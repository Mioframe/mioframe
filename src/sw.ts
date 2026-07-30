/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

/**
 * Managed pinned-update controller worker for the stable and develop
 * channels (see the managed pinned application updates feature).
 *
 * This worker owns application-release pinning only: persisted update
 * state, release discovery, immutable release preparation, selected-release
 * navigation, clean-launch activation, boot commit, rollback, and local
 * release-cache cleanup. It never manages its own code's lifecycle —
 * install/waiting/activate for this worker script itself is the browser's
 * ordinary Service Worker lifecycle, untouched here (no `skipWaiting()`, no
 * `clients.claim()`). It must never identify itself as, or embed, a
 * particular application release — only its own channel (derived at runtime
 * from its registration scope, not build-embedded).
 */

import {
  isSameChannelPath,
  isSameChannelWindowClient,
} from './shared/service/appUpdate/cleanLaunch';
import { createOperationQueue } from './shared/service/appUpdate/operationQueue';
import { createPreparationCoordinator } from './shared/service/appUpdate/preparationCoordinator';
import {
  withProtocolVersion,
  zodAppUpdateWorkerRequest,
} from './shared/service/appUpdate/protocol';
import { runReleaseCacheCleanup } from './shared/service/appUpdate/releaseCache';
import { createScheduledDiscoveryCheckScheduler } from './shared/service/appUpdate/scheduledDiscoveryCheckScheduler';
import { runScheduledDiscoveryCheck } from './shared/service/appUpdate/updateDiscovery';
import {
  buildManagedChannelBasePath,
  deriveManagedChannel,
  deriveManagedChannelOrigin,
} from './shared/service/appUpdate/workerChannel';
import { handleAssetFetch, handleNavigationFetch } from './shared/service/appUpdate/workerFetch';
import { runInstall } from './shared/service/appUpdate/workerInstall';
import {
  broadcastStateChanged,
  handleWorkerMessage,
} from './shared/service/appUpdate/workerMessages';

const channel = deriveManagedChannel(self.registration.scope);
const channelBasePath = buildManagedChannelBasePath(channel);
const channelOrigin = deriveManagedChannelOrigin(self.registration.scope);
const enqueue = createOperationQueue();
const preparationCoordinator = createPreparationCoordinator();
const scheduledDiscoveryCheckScheduler = createScheduledDiscoveryCheckScheduler();

self.addEventListener('install', (event) => {
  event.waitUntil(enqueue(() => runInstall(channel, channelBasePath)));
});

self.addEventListener('activate', (event) => {
  // Best-effort managed-cache housekeeping only: never selects, initializes,
  // or verifies an application release. A cleanup failure must not fail
  // this worker's activation.
  event.waitUntil(
    preparationCoordinator
      .runCleanup((inFlightReleaseIds) => runReleaseCacheCleanup(channel, inFlightReleaseIds))
      .catch(() => {}),
  );
});

/**
 * Builds the set of client ids that belong to this navigation itself, so the
 * clean-launch window count never counts a navigation against its own
 * outcome: the requesting client if any (`clientId`) and the id already
 * reserved for the resulting document (`resultingClientId`) — the two
 * navigation-identity fields `lib.webworker.d.ts` actually declares.
 * Deliberately never reads `FetchEvent.replacesClientId`: it is not part of
 * that standard surface, and this project does not read undeclared
 * properties via `Reflect.get` to recover it. Uses identity, never URL, so a
 * distinct window that happens to share this navigation's URL is still
 * counted.
 * @param event - The navigation `FetchEvent`.
 * @returns The set of this navigation's own client ids.
 */
function buildNavigationExclusionClientIds(event: FetchEvent): ReadonlySet<string> {
  const ids = [event.clientId, event.resultingClientId];
  return new Set(ids.filter((id): id is string => typeof id === 'string' && id.length > 0));
}

self.addEventListener('fetch', (event) => {
  // For the stable channel (`channelBasePath` is `/`), a bare `startsWith`
  // check would match every path on the origin, including `/branch/**` and
  // `/pr/**` — this worker's own scope is wide enough to otherwise
  // intercept those foreign deployments' requests (including a develop
  // controller's own install-time fetches), which must stay this worker's
  // non-concern exactly like the legacy Workbox config's denylist. The
  // origin check additionally rejects any cross-origin request the browser
  // still dispatches to this handler (scope only limits which pages this
  // worker controls, not which of their requests reach `fetch`).
  if (!isSameChannelPath(event.request.url, channelBasePath, channelOrigin)) return;

  // `updates/**` (the `latest.json` pointer, release descriptors, and
  // archived indexes) is metadata this worker fetches for its own
  // bookkeeping — never one of a release's cached asset files — and must
  // never be routed back through this same fetch handler. Once this worker
  // is active and controlling, its own internal `fetch()` calls for these
  // URLs are otherwise self-intercepted here too, and `handleAssetFetch`
  // would incorrectly serve a synthetic 404 for them (they are never part
  // of `descriptor.files`), breaking every re-check after the first install.
  if (new URL(event.request.url).pathname.startsWith(`${channelBasePath}updates/`)) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      handleNavigationFetch(
        channel,
        channelBasePath,
        channelOrigin,
        event.request,
        buildNavigationExclusionClientIds(event),
        enqueue,
        preparationCoordinator,
      ),
    );
    // Deduplicated once per worker lifetime, and attached to this event's
    // lifetime via `waitUntil` — never awaited as part of the navigation
    // response, so a background discovery check (and, in Automatic mode,
    // any release download/hashing it triggers) can never delay this or any
    // other navigation, but the worker is also not eligible for termination
    // while it is still running. Runs in both update modes; only Automatic
    // mode goes on to prepare and approve a newer release. No foreground
    // requester is waiting on this call, so a state change it causes is
    // reported through one same-channel invalidation broadcast instead —
    // an already-open window refreshes its own snapshot via `GET_SNAPSHOT`.
    event.waitUntil(
      scheduledDiscoveryCheckScheduler.scheduleOnce(async () => {
        const changed = await runScheduledDiscoveryCheck(
          channel,
          channelBasePath,
          enqueue,
          preparationCoordinator,
        );
        if (changed) await broadcastStateChanged(channelBasePath, channelOrigin);
      }),
    );
    return;
  }

  event.respondWith(
    handleAssetFetch(channel, channelBasePath, event.request, preparationCoordinator),
  );
});

self.addEventListener('message', (event) => {
  // Only a same-channel window may issue a private protocol request: a
  // foreign-channel same-origin page that obtained this worker's
  // registration through `getRegistrations()` rather than its own
  // `controller` must never be able to read or mutate this channel's
  // controller state, and must never learn anything about it — including
  // through an error response, which is why this case is silently ignored
  // rather than answered.
  if (!isSameChannelWindowClient(event.source, channelBasePath, channelOrigin)) return;

  // A malformed payload or an unsupported/missing protocol version is
  // ignored exactly like a foreign-channel request above: no state
  // mutation, no response, and never a thrown error out of this handler.
  const parsedRequest = zodAppUpdateWorkerRequest.safeParse(event.data);
  if (!parsedRequest.success) return;
  const request = parsedRequest.data;

  const respond = (result: unknown) => {
    if (event.ports[0]) event.ports[0].postMessage(result);
  };

  // The response is posted as soon as `handleWorkerMessage` resolves; only
  // afterwards is `runLifetimeWork` (cache cleanup, a same-channel
  // invalidation broadcast, or a rollback broadcast) invoked and awaited,
  // still inside this same `message` event's `waitUntil()` — this ordering
  // is what guarantees the underlying follow-up work never starts before the
  // response has already been posted.
  event.waitUntil(
    (async () => {
      let result;
      try {
        result = await handleWorkerMessage(
          channel,
          channelBasePath,
          channelOrigin,
          request,
          enqueue,
          preparationCoordinator,
        );
      } catch {
        // Never a raw exception message: this private protocol only ever
        // sends the stable, versioned failure envelope across the boundary.
        respond(withProtocolVersion({ error: 'unavailable' as const }));
        return;
      }
      respond(result.response);
      // `runLifetimeWork` is documented as best effort and every current
      // producer already swallows its own failures; this catch is a defense
      // in depth so a future producer's mistake can never throw out of this
      // handler or surface as an unhandled rejection.
      if (result.runLifetimeWork) await result.runLifetimeWork().catch(() => {});
    })(),
  );
});
