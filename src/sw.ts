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

import { isSameChannelPath } from './shared/service/appUpdate/cleanLaunch';
import { readControllerState } from './shared/service/appUpdate/controllerState';
import {
  computeCacheNamesToDelete,
  computeProtectedReleaseIds,
} from './shared/service/appUpdate/releaseCache';
import { createOperationQueue } from './shared/service/appUpdate/operationQueue';
import type { AppUpdateWorkerRequest } from './shared/service/appUpdate/protocol';
import {
  buildManagedChannelBasePath,
  deriveManagedChannel,
} from './shared/service/appUpdate/workerChannel';
import { handleAssetFetch, handleNavigationFetch } from './shared/service/appUpdate/workerFetch';
import { runInstallPrerequisites } from './shared/service/appUpdate/workerInstall';
import { handleWorkerMessage } from './shared/service/appUpdate/workerMessages';

const channel = deriveManagedChannel(self.registration.scope);
const channelBasePath = buildManagedChannelBasePath(channel);
const enqueue = createOperationQueue();

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      // Only claim the controller identity once prerequisites succeed: a
      // failed first install must never replace a working previous worker,
      // and an existing installation's active release must never change
      // just because the controller code itself was upgraded.
      await enqueue(() => runInstallPrerequisites(channel, channelBasePath));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      await enqueue(async () => {
        const read = await readControllerState(channel);
        if (read.status !== 'valid') return;
        const protectedReleaseIds = computeProtectedReleaseIds({
          activeRelease: read.state.activeRelease,
          approvedRelease: read.state.approvedRelease,
          activation: read.state.activation,
        });
        const existingCacheNames = await caches.keys();
        const staleCacheNames = computeCacheNamesToDelete(
          existingCacheNames,
          channel,
          protectedReleaseIds,
        );
        await Promise.all(staleCacheNames.map((name) => caches.delete(name)));
      });
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
    return;
  }

  event.respondWith(handleAssetFetch(channel, channelBasePath, event.request));
});

self.addEventListener('message', (event) => {
  const request: AppUpdateWorkerRequest = event.data;
  const respond = (result: unknown) => {
    if (event.ports[0]) event.ports[0].postMessage(result);
  };
  event.waitUntil(
    handleWorkerMessage(channel, channelBasePath, request, enqueue).then(
      respond,
      (error: unknown) => {
        respond({ error: error instanceof Error ? error.message : 'unavailable' });
      },
    ),
  );
});
