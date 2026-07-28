/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

/**
 * Managed pinned-update controller worker for the stable and develop
 * channels (see the managed pinned application updates feature).
 *
 * This worker is a permanent release controller, independent of any
 * particular application release: it owns persisted update state, release
 * discovery, immutable release preparation, selected-release navigation,
 * clean-launch activation, boot commit, rollback, and local release-cache
 * cleanup. It must never identify itself as, or embed, a particular
 * application release — only its own channel (derived at runtime from its
 * registration scope, not build-embedded).
 */

import { createAutomaticCheckScheduler } from './shared/service/appUpdate/automaticCheckScheduler';
import {
  isSameChannelPath,
  isSameChannelWindowClient,
} from './shared/service/appUpdate/cleanLaunch';
import { readControllerState } from './shared/service/appUpdate/controllerState';
import { createOperationQueue } from './shared/service/appUpdate/operationQueue';
import { createPreparationCoordinator } from './shared/service/appUpdate/preparationCoordinator';
import type { AppUpdateWorkerRequest } from './shared/service/appUpdate/protocol';
import { runReleaseCacheCleanup } from './shared/service/appUpdate/releaseCache';
import { runAutomaticCheckIfEnabled } from './shared/service/appUpdate/updateDiscovery';
import {
  buildManagedChannelBasePath,
  deriveManagedChannel,
} from './shared/service/appUpdate/workerChannel';
import { handleAssetFetch, handleNavigationFetch } from './shared/service/appUpdate/workerFetch';
import {
  confirmExistingManagedInstall,
  decideInstallAction,
  prepareInitialManagedRelease,
} from './shared/service/appUpdate/workerInstall';
import { handleWorkerMessage } from './shared/service/appUpdate/workerMessages';

const channel = deriveManagedChannel(self.registration.scope);
const channelBasePath = buildManagedChannelBasePath(channel);
const enqueue = createOperationQueue();
const preparationCoordinator = createPreparationCoordinator();
const automaticCheckScheduler = createAutomaticCheckScheduler();

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const hasPreviousActiveController = self.registration.active !== null;
      const action = await enqueue(() => decideInstallAction(channel, hasPreviousActiveController));

      if (action === 'defer-to-legacy-worker') {
        // No managed state exists, and a previously-active (necessarily
        // legacy, pre-migration) worker still controls this channel: do
        // not fetch or prepare anything here — the still-active legacy
        // Workbox worker's own runtime-caching routes would otherwise
        // intercept these install-time requests — and do not call
        // `skipWaiting()`. This worker simply waits; ordinary browser
        // worker lifecycle promotes it once every legacy-controlled window
        // closes, and migration completes in the `activate` handler below.
        return;
      }

      // Only claim the controller identity once prerequisites succeed: a
      // failed first install must never replace a working previous worker,
      // and an existing installation's active release must never change
      // just because the controller code itself was upgraded.
      await enqueue(() =>
        action === 'prepare-fresh-install'
          ? prepareInitialManagedRelease(channel, channelBasePath)
          : confirmExistingManagedInstall(channel, channelBasePath),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const read = await enqueue(() => readControllerState(channel));
      if (read.status === 'absent') {
        // Completing a legacy-Workbox migration: this worker deferred all
        // preparation during `install`, and the browser has now promoted
        // it on its own once every legacy-controlled window closed. Only
        // claim already-open (legacy) clients once the initial managed
        // release is fully prepared and persisted — a failure here must
        // not claim clients or create partial state (see the managed
        // pinned application updates feature, "Worker migration"). The
        // browser has already committed to this worker as `active`
        // regardless (the platform has no "reject activation" mechanism),
        // so a failure here is a best-effort non-claim: any subsequent
        // navigation this worker does end up controlling still falls back
        // to an ordinary network fetch via `handleNavigationFetch`'s own
        // invalid-state handling, rather than a hard failure.
        try {
          await enqueue(() => prepareInitialManagedRelease(channel, channelBasePath));
        } catch {
          return;
        }
      }
      await self.clients.claim();
      await runReleaseCacheCleanup(channel);
    })(),
  );
});

/**
 * Returns `true` when this navigation replaces an existing document (an
 * ordinary reload), rather than opening a genuinely new window/tab.
 *
 * Reads the standard `FetchEvent.replacesClientId` property via `Reflect.get`
 * (rather than a type assertion, which this project forbids), since
 * TypeScript's `lib.webworker.d.ts` does not declare it — unlike the closely
 * related, already-typed `resultingClientId` — even though it is
 * implemented by current browsers. If a runtime ever omits it, this
 * conservatively reports `false`; the caller's `otherLiveClientCount` check
 * independently prevents a wrongful activation start in that case too,
 * since a reloading document's own prior client is still live in
 * `clients.matchAll()` at fetch time.
 * @param event - The navigation `FetchEvent`.
 * @returns Whether this navigation replaces an existing document.
 */
function isReplacementNavigation(event: FetchEvent): boolean {
  const replacesClientId: unknown = Reflect.get(event, 'replacesClientId');
  return typeof replacesClientId === 'string' && replacesClientId !== '';
}

self.addEventListener('fetch', (event) => {
  // For the stable channel (`channelBasePath` is `/`), a bare `startsWith`
  // check would match every path on the origin, including `/branch/**` and
  // `/pr/**` — this worker's own scope is wide enough to otherwise
  // intercept those foreign deployments' requests (including a develop
  // controller's own install-time fetches), which must stay this worker's
  // non-concern exactly like the legacy Workbox config's denylist.
  if (!isSameChannelPath(event.request.url, channelBasePath)) return;

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
        event.request,
        isReplacementNavigation(event),
        enqueue,
      ),
    );
    // Fire-and-forget, deduplicated once per worker lifetime: never awaited
    // as part of the navigation response, so an Automatic-mode background
    // check (and any release download/hashing it triggers) can never delay
    // this or any other navigation.
    automaticCheckScheduler.scheduleOnce(() =>
      runAutomaticCheckIfEnabled(channel, channelBasePath, enqueue, preparationCoordinator),
    );
    return;
  }

  event.respondWith(handleAssetFetch(channel, channelBasePath, event.request));
});

self.addEventListener('message', (event) => {
  // Only a same-channel window may issue a private protocol request: a
  // foreign-channel same-origin page that obtained this worker's
  // registration through `getRegistrations()` rather than its own
  // `controller` must never be able to read or mutate this channel's
  // controller state, and must never learn anything about it — including
  // through an error response, which is why this case is silently ignored
  // rather than answered.
  if (!isSameChannelWindowClient(event.source, channelBasePath)) return;

  const request: AppUpdateWorkerRequest = event.data;
  const respond = (result: unknown) => {
    if (event.ports[0]) event.ports[0].postMessage(result);
  };
  event.waitUntil(
    handleWorkerMessage(channel, channelBasePath, request, enqueue, preparationCoordinator).then(
      respond,
      (error: unknown) => {
        respond({ error: error instanceof Error ? error.message : 'unavailable' });
      },
    ),
  );
});
