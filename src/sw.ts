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
 *
 * Stage 3 implements bootstrap classification and active-release-only
 * serving; discovery/preparation (Stage 4) and clean-launch
 * activation/rollback (Stage 5) are not yet wired from this file.
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
  zodManagedControllerProbeRequest,
} from './shared/service/appUpdate/protocol';
import { runReleaseCacheCleanup } from './shared/service/appUpdate/releaseCache';
import {
  buildManagedChannelBasePath,
  deriveManagedChannel,
  deriveManagedChannelOrigin,
} from './shared/service/appUpdate/workerChannel';
import { handleAssetFetch, handleNavigationFetch } from './shared/service/appUpdate/workerFetch';
import { runInstall } from './shared/service/appUpdate/workerInstall';
import { handleWorkerMessage } from './shared/service/appUpdate/workerMessages';

const channel = deriveManagedChannel(self.registration.scope);
const channelBasePath = buildManagedChannelBasePath(channel);
const channelOrigin = deriveManagedChannelOrigin(self.registration.scope);
const enqueue = createOperationQueue();
const preparationCoordinator = createPreparationCoordinator();

self.addEventListener('install', (event) => {
  // Deliberately outside `enqueue`/`OperationQueue`: predecessor probing,
  // the `latest.json`/descriptor fetch, file downloads, hashing, and cache
  // preparation are long-running network/cache work, never a short
  // serialized state transition. `self.registration.active` is read
  // synchronously here, at the moment this listener runs, so it reflects
  // this exact install attempt's own predecessor.
  event.waitUntil(
    runInstall(channel, channelBasePath, self.registration.active, preparationCoordinator),
  );
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

  const pathname = new URL(event.request.url).pathname;

  // `updates/**` (the `latest.json` pointer, release descriptors, and
  // archived indexes) is metadata this worker fetches for its own
  // bookkeeping — never one of a release's cached asset files — and must
  // never be routed back through this same fetch handler. Once this worker
  // is active and controlling, its own internal `fetch()` calls for these
  // URLs are otherwise self-intercepted here too, and treating it as an
  // owned asset path would incorrectly serve a synthetic 404 for it (it is
  // never part of `descriptor.files`), breaking every re-check after the
  // first install.
  if (pathname.startsWith(`${channelBasePath}updates/`)) return;

  if (event.request.mode === 'navigate' && event.request.destination === 'document') {
    event.respondWith(
      handleNavigationFetch(channel, channelBasePath, event.request, preparationCoordinator),
    );
    return;
  }

  // This worker owns only same-channel `<channelBasePath>assets/**`. Every
  // other same-origin, same-channel request (manifest, PWA icons outside
  // `assets/**`, API routes, fonts, or anything else) is not this worker's
  // concern at all: returning without calling `respondWith()` leaves it to
  // ordinary browser network behavior, never a synthetic release-cache
  // response.
  const relativePath = pathname.slice(channelBasePath.length);
  if (!relativePath.startsWith('assets/')) return;

  event.respondWith(
    handleAssetFetch(channel, channelBasePath, event.request, preparationCoordinator),
  );
});

self.addEventListener('message', (event) => {
  // The same-path bootstrap compatibility probe (Stage 3): its sender is
  // another service worker instance installing on top of this one
  // (`registration.active.postMessage()`), never a window client, so it
  // must be answered before the same-channel *window* client check below
  // would otherwise silently reject it. Reads no state, mutates no state,
  // touches no cache — a fixed, unconditional reply naming only this
  // worker's own channel.
  const probeRequest = zodManagedControllerProbeRequest.safeParse(event.data);
  if (probeRequest.success) {
    event.ports[0]?.postMessage(
      withProtocolVersion({ kind: 'managed-update-controller' as const, channel }),
    );
    return;
  }

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
