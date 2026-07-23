/// <reference lib="webworker" />

import type { ReleaseControllerState, ReleaseIdentity } from './contracts';
import { releaseDescriptorSchema } from './contracts';
import { createReleaseController } from './controller';
import { createReleaseControllerStateStore } from './persistence';
import { getReleaseResponse, isReleaseAvailable, prepareRelease } from './releaseCache';
import {
  associateReplacementNavigation,
  createActivationTransaction,
  releaseForClient,
  rollbackExpiredActivation,
  rollbackFailedReplacementNavigation,
} from './activationTransaction';
import { getStableWindowClients, isStableAppUrl, isStableAppWindowClient } from './stableClients';
import { projectAppUpdateSnapshot } from './stateMachine';

declare const self: ServiceWorkerGlobalScope;

declare global {
  interface ServiceWorkerGlobalScope {
    __WB_MANIFEST: Array<{ url: string; revision?: string }>;
  }
}

const store = createReleaseControllerStateStore();
let currentReleasePromise: Promise<ReleaseIdentity> | undefined;

const loadCurrentRelease = (): Promise<ReleaseIdentity> => {
  currentReleasePromise ??= (async () => {
    const response = await fetch(`/updates/releases/${__RELEASE_ID__}.json`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Current stable release descriptor unavailable.');
    return releaseDescriptorSchema.parse(await response.json());
  })();
  return currentReleasePromise;
};

const broadcastSnapshot = async (state: ReleaseControllerState): Promise<void> => {
  for (const client of await getStableWindowClients()) {
    client.postMessage({
      type: 'APP_UPDATE_SNAPSHOT',
      snapshot: projectAppUpdateSnapshot(state, releaseForClient(state, client.id)),
    });
  }
};

const requestRestartReadiness = async () => {
  const clients = await getStableWindowClients();
  const results = await Promise.all(
    clients.map(
      (client) =>
        new Promise<'ready' | 'busy' | 'unresponsive'>((resolve) => {
          const channel = new MessageChannel();
          const timeout = setTimeout(() => {
            resolve('unresponsive');
          }, 2_000);
          channel.port1.onmessage = (event: MessageEvent<{ status?: string }>) => {
            clearTimeout(timeout);
            resolve(event.data.status === 'ready' ? 'ready' : 'busy');
          };
          client.postMessage({ type: 'PRIVATE_RESTART_READINESS' }, [channel.port2]);
        }),
    ),
  );
  return {
    status: results.includes('unresponsive')
      ? ('unresponsive' as const)
      : results.includes('busy')
        ? ('busy' as const)
        : ('ready' as const),
    clientIds: clients.map(({ id }) => id),
  };
};

const createController = async () =>
  createReleaseController({
    currentRelease: await loadCurrentRelease(),
    store,
    readiness: requestRestartReadiness,
    publish(state) {
      void broadcastSnapshot(state);
    },
    async onActivationStarted(transactionId, clientIds) {
      const clients = await getStableWindowClients();
      clients
        .filter((client) => clientIds.includes(client.id))
        .forEach((client) => {
          client.postMessage({
            type: 'PRIVATE_UPDATE_RELOAD',
            transactionId,
            oldClientId: client.id,
          });
        });
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
      const state = await store.read(currentRelease);
      const selected =
        state.mode === 'manual'
          ? (state.pinnedRelease ?? state.activeRelease)
          : state.activeRelease;
      if (!(await isReleaseAvailable(selected))) {
        await prepareRelease({
          schemaVersion: 2,
          release: selected,
          descriptorUrl: `/updates/releases/${selected.releaseId}.json`,
        });
      }
      await self.clients.claim();
      await broadcastSnapshot(state);
    })(),
  );
});

self.addEventListener('message', (event) => {
  const source = event.source;
  if (source && (!('url' in source) || !isStableAppWindowClient(source))) return;
  event.waitUntil(
    (async () => {
      const controller = await getController();
      const execution = await controller.execute(
        event.data,
        source && 'id' in source ? source.id : '',
      );
      event.ports[0]?.postMessage(execution.response);
      if (execution.background) await execution.background();
    })(),
  );
});

const selectNavigationRelease = async (event: FetchEvent): Promise<ReleaseIdentity> => {
  const currentRelease = await loadCurrentRelease();
  let state = rollbackExpiredActivation(await store.read(currentRelease), new Date());
  const url = new URL(event.request.url);
  const restartTransactionId = url.searchParams.get('__mioframe_restart_transaction');
  const restartOldClientId = url.searchParams.get('__mioframe_restart_client');
  const transaction = state.activationTransaction;
  const tokenOldClientId =
    transaction &&
    restartTransactionId === transaction.transactionId &&
    restartOldClientId &&
    transaction.expectedOldClientIds.includes(restartOldClientId)
      ? restartOldClientId
      : '';
  const replacesClientId = event.replacesClientId || tokenOldClientId;
  state = rollbackFailedReplacementNavigation(state, replacesClientId);
  if (
    !state.activationTransaction &&
    state.mode === 'automatic' &&
    state.preparedRelease &&
    (await getStableWindowClients()).filter(({ id }) => id !== event.resultingClientId).length === 0
  ) {
    state = createActivationTransaction({
      state,
      targetRelease: state.preparedRelease,
      oldClientIds: [],
      now: new Date(),
    });
  }
  state = associateReplacementNavigation(
    state,
    replacesClientId,
    event.resultingClientId || event.clientId,
  );
  await store.write(state);
  await broadcastSnapshot(state);
  return releaseForClient(state, event.resultingClientId || event.clientId);
};

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (!isStableAppUrl(url)) return;

  event.respondWith(
    (async () => {
      const navigation = event.request.mode === 'navigate';
      const currentRelease = await loadCurrentRelease();
      const state = await store.read(currentRelease);
      const release = navigation
        ? await selectNavigationRelease(event)
        : releaseForClient(state, event.clientId);
      let response = await getReleaseResponse(release, url.pathname, navigation);
      if (
        !response &&
        state.mode === 'manual' &&
        state.pinnedRelease?.releaseId === release.releaseId
      ) {
        await prepareRelease({
          schemaVersion: 2,
          release,
          descriptorUrl: `/updates/releases/${release.releaseId}.json`,
        });
        response = await getReleaseResponse(release, url.pathname, navigation);
      }
      return response ?? fetch(event.request);
    })(),
  );
});
