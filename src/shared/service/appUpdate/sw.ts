/// <reference lib="webworker" />

import type { ReleaseControllerState, ReleaseIdentity } from './contracts';
import {
  RELEASE_DESCRIPTOR_SCHEMA_VERSION,
  isSameReleaseIdentity,
  releaseDescriptorSchema,
  releaseIdentitySchema,
} from './contracts';
import { createReleaseController } from './controller';
import { createReleaseControllerStateStore } from './persistence';
import {
  getReleaseResponse,
  isReleaseAvailable,
  prepareRelease,
  readCachedReleaseDescriptor,
} from './releaseCache';
import {
  createStableClientRegistry,
  getStableWindowClients,
  isStableAppUrl,
  isStableAppWindowClient,
} from './stableClients';
import { committedRelease, projectAppUpdateSnapshot } from './stateMachine';
import { selectServedRelease } from './trial';

declare const self: ServiceWorkerGlobalScope;

declare global {
  interface ServiceWorkerGlobalScope {
    __WB_MANIFEST: Array<{ url: string; revision?: string }>;
  }
}

const store = createReleaseControllerStateStore();
const registry = createStableClientRegistry();
let currentReleasePromise: Promise<ReleaseIdentity> | undefined;

/**
 * This worker's own build-embedded release identity, resolved synchronously at module evaluation
 * with no network or cache access. Trustworthy only when this exact build went through the
 * managed release-publication pipeline, which patches `__RELEASE_SEQUENCE__` in place after the
 * real sequence is allocated (see `scripts/pages/lib/stableRelease.mjs`); an un-patched value (a
 * local, branch, or otherwise unpublished build) safely fails `releaseIdentitySchema` and is
 * `undefined` here rather than being trusted with a wrong sequence.
 */
const embeddedRelease: ReleaseIdentity | undefined = (() => {
  const parsed = releaseIdentitySchema.safeParse({
    releaseId: __RELEASE_ID__,
    releaseSequence: Number(__RELEASE_SEQUENCE__),
    appVersion: __APP_VERSION__,
    buildId: __BUILD_ID__,
    buildDate: __BUILD_DATE__,
  });
  return parsed.success ? parsed.data : undefined;
})();

/**
 * Resolve this worker's own build-embedded release identity without depending on a successful
 * network request. The final release cache (already committed by a previous activation of this
 * exact build) is tried first; only a first-ever online install or a missing local bootstrap
 * cache falls through to fetching this build's own descriptor from the immutable online archive.
 * `latest.json` is never fetched here — only the explicit `CHECK_FOR_UPDATES` operation does.
 *
 * Used only as a fallback for {@link resolveBootstrapRelease} when {@link embeddedRelease} itself
 * failed validation (an unpublished build); a genuinely published build never reaches this network
 * path just to read persisted state or serve an already-cached release.
 * @returns This worker's own build-embedded release identity.
 */
const loadCurrentRelease = (): Promise<ReleaseIdentity> => {
  currentReleasePromise ??= (async () => {
    const cached = await readCachedReleaseDescriptor(__RELEASE_ID__);
    if (cached) return cached;
    const response = await fetch(`/updates/releases/${__RELEASE_ID__}.json`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Current stable release descriptor unavailable.');
    return releaseDescriptorSchema.parse(await response.json());
  })();
  return currentReleasePromise;
};

/**
 * Resolve the identity used to seed persisted-state recovery: the build-embedded identity when
 * valid (synchronous, no I/O), or the cache/network fallback otherwise. This is only ever a
 * fallback value for an absent or unrecoverable persisted record — reading an existing persisted
 * record and serving an already-cached release never depends on this resolving from the network.
 * @returns This worker's own release identity.
 */
const resolveBootstrapRelease = (): Promise<ReleaseIdentity> =>
  embeddedRelease ? Promise.resolve(embeddedRelease) : loadCurrentRelease();

const descriptorFor = (release: ReleaseIdentity) => ({
  schemaVersion: RELEASE_DESCRIPTOR_SCHEMA_VERSION,
  release,
  descriptorUrl: `/updates/releases/${release.releaseId}.json`,
});

/**
 * Broadcast a per-client-accurate snapshot to every live stable window.
 * @param state - Private durable controller state.
 */
const broadcastSnapshot = async (state: ReleaseControllerState): Promise<void> => {
  for (const client of await getStableWindowClients()) {
    client.postMessage({
      type: 'APP_UPDATE_SNAPSHOT',
      snapshot: projectAppUpdateSnapshot(state, 'available', client.id),
    });
  }
};

const createController = async () =>
  createReleaseController({
    currentRelease: await resolveBootstrapRelease(),
    store,
    liveStableWindows: () => getStableWindowClients(),
    async vfsReadiness(clientId) {
      // Fail closed: a client that never completed the registration handshake, a request that
      // times out, or a malformed response must never be treated as ready. Only an explicit
      // `ready: true` from the exact registered source client counts.
      const client = (await registry.getRegisteredStableWindowClients()).find(
        ({ id }) => id === clientId,
      );
      if (!client) return false;
      return new Promise<boolean>((resolve) => {
        const channel = new MessageChannel();
        const timeout = setTimeout(() => {
          resolve(false);
        }, 2_000);
        channel.port1.onmessage = (event: MessageEvent<{ ready?: boolean }>) => {
          clearTimeout(timeout);
          resolve(event.data.ready === true);
        };
        client.postMessage({ type: 'PRIVATE_VFS_READINESS' }, [channel.port2]);
      });
    },
    publish: broadcastSnapshot,
    async onTrialStarted(_target, clientId) {
      const client = (await registry.getRegisteredStableWindowClients()).find(
        ({ id }) => id === clientId,
      );
      client?.postMessage({ type: 'PRIVATE_UPDATE_RELOAD' });
    },
  });

let controllerPromise: ReturnType<typeof createController> | undefined;
const getController = () => (controllerPromise ??= createController());

self.addEventListener('install', (event) => {
  if (!Array.isArray(self.__WB_MANIFEST)) throw new Error('Build manifest was not injected.');
  // Controller-code takeover is independent from persisted application release selection.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const currentRelease = await resolveBootstrapRelease();
        const controller = await getController();
        await controller.reconcile();
        const read = await store.read(currentRelease);
        const selected =
          read.capability === 'available' ? committedRelease(read.state) : currentRelease;
        if (!(await isReleaseAvailable(selected))) {
          await prepareRelease(descriptorFor(selected));
        }
        if (read.capability === 'available') await broadcastSnapshot(read.state);
      } catch {
        // The embedded build identity failed validation (an unpublished build) and neither a
        // local bootstrap cache nor the network could establish an identity in its place (offline
        // first-ever install): the worker still takes control below so normal network navigation
        // keeps working, without selecting or claiming any managed release.
      } finally {
        await self.clients.claim();
      }
    })(),
  );
});

self.addEventListener('message', (event) => {
  const source = event.source;
  if (!source || !('url' in source) || !isStableAppWindowClient(source)) return;
  const clientId = 'id' in source ? source.id : '';
  registry.register(clientId);
  event.waitUntil(
    (async () => {
      const controller = await getController();
      const execution = await controller.execute(event.data, clientId);
      event.ports[0]?.postMessage(execution.response);
      if (execution.background) await execution.background();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (!isStableAppUrl(url)) return;

  event.respondWith(
    (async () => {
      try {
        const navigation = event.request.mode === 'navigate';
        const requestingClientId = event.resultingClientId || event.clientId;
        const currentRelease = await resolveBootstrapRelease();
        const controller = await getController();
        let release = navigation
          ? await controller.handleNavigation(requestingClientId)
          : await (async () => {
              const read = await store.read(currentRelease);
              return read.capability === 'available'
                ? selectServedRelease(read.state, requestingClientId)
                : currentRelease;
            })();
        let response = await getReleaseResponse(release, url.pathname, navigation);
        if (!response) {
          const read = await store.read(currentRelease);
          // A response missing from the final cache is restored — never silently replaced with
          // the current root deployment — for any release the controller currently selects for
          // this client: the committed (Automatic active / Manual pinned) release, or this
          // client's own claimed trial target.
          const isTrialTargetForClient =
            read.capability === 'available' &&
            read.state.trial !== undefined &&
            read.state.trial.initiatingClientId === requestingClientId &&
            isSameReleaseIdentity(release, read.state.trial.targetRelease);
          const isManagedSelection =
            read.capability === 'available' &&
            (isSameReleaseIdentity(release, committedRelease(read.state)) ||
              isTrialTargetForClient);
          if (isManagedSelection) {
            try {
              await prepareRelease(descriptorFor(release));
              response = await getReleaseResponse(release, url.pathname, navigation);
            } catch {
              // Offline or the immutable archive is unavailable; handled below rather than
              // falling through to plain network, which could silently execute another release.
            }
            if (!response && isTrialTargetForClient) {
              // The trial target cannot be restored: roll the trial back exactly once through the
              // controller and try to serve the previous committed release instead.
              release = await controller.rollbackTrialTarget(release.releaseId);
              response = await getReleaseResponse(release, url.pathname, navigation);
            }
            if (!response) {
              return new Response('Selected release is unavailable.', {
                status: 503,
                statusText: 'Release Unavailable',
              });
            }
          }
        }
        return response ?? (await fetch(event.request));
      } catch {
        // Neither persisted state nor a locally cached build release could be recovered (e.g. a
        // genuinely fresh install with no network reachable at all): fall back to plain network
        // navigation rather than looping or selecting another managed release.
        return fetch(event.request);
      }
    })(),
  );
});
