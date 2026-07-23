/// <reference lib="webworker" />

import type { ReleaseControllerState, ReleaseIdentity } from './contracts';
import { RELEASE_DESCRIPTOR_SCHEMA_VERSION, releaseDescriptorSchema } from './contracts';
import { createReleaseController } from './controller';
import { createReleaseControllerStateStore } from './persistence';
import { getReleaseResponse, isReleaseAvailable, prepareRelease } from './releaseCache';
import {
  createStableClientRegistry,
  getStableWindowClients,
  isStableAppUrl,
  isStableAppWindowClient,
} from './stableClients';
import { isStrictlyNewerRelease, projectAppUpdateSnapshot } from './stateMachine';
import {
  associateTrialNavigation,
  createTrial,
  rollbackExpiredTrial,
  selectServedRelease,
} from './trial';

declare const self: ServiceWorkerGlobalScope;

declare global {
  interface ServiceWorkerGlobalScope {
    __WB_MANIFEST: Array<{ url: string; revision?: string }>;
  }
}

const store = createReleaseControllerStateStore();
const registry = createStableClientRegistry();
let currentReleasePromise: Promise<ReleaseIdentity> | undefined;

const loadCurrentRelease = (): Promise<ReleaseIdentity> => {
  currentReleasePromise ??= (async () => {
    const response = await fetch(`/updates/releases/${__RELEASE_ID__}.json`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Current stable release descriptor unavailable.');
    return releaseDescriptorSchema.parse(await response.json());
  })();
  return currentReleasePromise;
};

const descriptorFor = (release: ReleaseIdentity) => ({
  schemaVersion: RELEASE_DESCRIPTOR_SCHEMA_VERSION,
  release,
  descriptorUrl: `/updates/releases/${release.releaseId}.json`,
});

const broadcastSnapshot = async (state: ReleaseControllerState): Promise<void> => {
  const snapshot = projectAppUpdateSnapshot(state);
  for (const client of await getStableWindowClients()) {
    client.postMessage({ type: 'APP_UPDATE_SNAPSHOT', snapshot });
  }
};

const createController = async () =>
  createReleaseController({
    currentRelease: await loadCurrentRelease(),
    store,
    registeredStableWindows: () => registry.getRegisteredStableWindowClients(),
    async vfsReadiness(clientId) {
      const client = (await registry.getRegisteredStableWindowClients()).find(
        ({ id }) => id === clientId,
      );
      if (!client) return true;
      return new Promise<boolean>((resolve) => {
        const channel = new MessageChannel();
        const timeout = setTimeout(() => {
          resolve(false);
        }, 2_000);
        channel.port1.onmessage = (event: MessageEvent<{ ready?: boolean }>) => {
          clearTimeout(timeout);
          resolve(event.data.ready !== false);
        };
        client.postMessage({ type: 'PRIVATE_VFS_READINESS' }, [channel.port2]);
      });
    },
    publish(state) {
      void broadcastSnapshot(state);
    },
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
      const currentRelease = await loadCurrentRelease();
      const controller = await getController();
      await controller.reconcile();
      const read = await store.read(currentRelease);
      const selected =
        read.capability === 'available' ? selectServedRelease(read.state) : currentRelease;
      if (!(await isReleaseAvailable(selected))) {
        await prepareRelease(descriptorFor(selected));
      }
      await self.clients.claim();
      if (read.capability === 'available') await broadcastSnapshot(read.state);
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

const selectNavigationRelease = async (event: FetchEvent): Promise<ReleaseIdentity> => {
  const currentRelease = await loadCurrentRelease();
  const read = await store.read(currentRelease);
  if (read.capability === 'unavailable') return currentRelease;

  let state = rollbackExpiredTrial(read.state, new Date());
  const navigatingClientId = event.resultingClientId || event.clientId;
  if (state.trial) {
    state = associateTrialNavigation(state, navigatingClientId);
  } else if (
    state.mode === 'automatic' &&
    state.preparation.status === 'ready' &&
    isStrictlyNewerRelease(state.preparation.release, state.activeRelease) &&
    !state.failedReleaseIds.includes(state.preparation.release.releaseId) &&
    (await registry.getRegisteredStableWindowClients()).filter(
      ({ id }) => id !== navigatingClientId,
    ).length === 0
  ) {
    state = createTrial({
      state,
      targetRelease: state.preparation.release,
      now: new Date(),
      initiatingClientId: navigatingClientId,
    });
  }
  if (state !== read.state) {
    await store.write(state);
    await broadcastSnapshot(state);
  }
  return selectServedRelease(state);
};

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (!isStableAppUrl(url)) return;

  event.respondWith(
    (async () => {
      const navigation = event.request.mode === 'navigate';
      const currentRelease = await loadCurrentRelease();
      const release = navigation
        ? await selectNavigationRelease(event)
        : await (async () => {
            const read = await store.read(currentRelease);
            return read.capability === 'available'
              ? selectServedRelease(read.state)
              : currentRelease;
          })();
      let response = await getReleaseResponse(release, url.pathname, navigation);
      if (!response) {
        const read = await store.read(currentRelease);
        const isMissingManualPin =
          read.capability === 'available' &&
          read.state.mode === 'manual' &&
          read.state.pinnedRelease?.releaseId === release.releaseId;
        if (isMissingManualPin) {
          try {
            await prepareRelease(descriptorFor(release));
            response = await getReleaseResponse(release, url.pathname, navigation);
          } catch {
            // Offline or otherwise unavailable; fall through to network below.
          }
        }
      }
      return response ?? fetch(event.request);
    })(),
  );
});
