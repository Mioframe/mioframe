/// <reference lib="webworker" />

import type { ReleaseIdentity } from './contracts';
import { createReleaseController } from './controller';
import { createReleaseControllerStateStore } from './persistence';
import { getReleaseResponse, isReleaseAvailable, prepareRelease } from './releaseCache';
import { beginBootAttempt, rollbackUnconfirmedBoot } from './stateMachine';

declare const self: ServiceWorkerGlobalScope;

declare global {
  interface ServiceWorkerGlobalScope {
    __WB_MANIFEST: Array<{ url: string; revision?: string }>;
  }
}

const currentRelease: ReleaseIdentity = {
  releaseId: __RELEASE_ID__,
  appVersion: __APP_VERSION__,
  buildId: (__BUILD_ID__ || __RELEASE_ID__).slice(0, 7),
  buildDate: __BUILD_DATE__,
};
const store = createReleaseControllerStateStore();

const getWindowClients = () =>
  self.clients.matchAll({ type: 'window', includeUncontrolled: false });

const requestRestartReadiness = async (): Promise<'ready' | 'busy' | 'unresponsive'> => {
  const clients = await getWindowClients();
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
          client.postMessage({ type: 'RESTART_READINESS' }, [channel.port2]);
        }),
    ),
  );
  return results.includes('unresponsive')
    ? 'unresponsive'
    : results.includes('busy')
      ? 'busy'
      : 'ready';
};

const controller = createReleaseController({
  currentRelease,
  store,
  readiness: requestRestartReadiness,
});

self.addEventListener('install', () => {
  // Keep the plugin's injection seam in emitted code, but never use its entries for caching or
  // routing. Validated immutable release descriptors are the only application-content source.
  if (!Array.isArray(self['__WB_MANIFEST'])) throw new Error('Build manifest was not injected.');
  // The browser controls controller-code activation. Application release selection never uses
  // skipWaiting and remains entirely in the persisted release state below.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const state = await store.read(currentRelease);
      const selectedRelease =
        state.mode === 'manual'
          ? (state.pinnedRelease ?? state.activeRelease)
          : state.activeRelease;
      if (!(await isReleaseAvailable(selectedRelease))) {
        await prepareRelease(selectedRelease);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  event.waitUntil(
    (async () => {
      const outcome = await controller.execute(event.data);
      event.ports[0]?.postMessage(outcome);
      if (event.data?.type === 'ACTIVATE' && outcome.status === 'ok') {
        const clients = await getWindowClients();
        const state = await store.read(currentRelease);
        await store.write({ ...state, bootExpectedClientIds: clients.map(({ id }) => id) });
        clients.forEach((client) => {
          client.postMessage({ type: 'RELOAD_FOR_UPDATE' });
        });
      }
    })(),
  );
});

const selectNavigationRelease = async (navigationClientId: string): Promise<ReleaseIdentity> => {
  let state = await store.read(currentRelease);
  if (state.bootAttempt) {
    const expectedClients = state.bootExpectedClientIds ?? [];
    if (expectedClients.includes(navigationClientId)) {
      state = {
        ...state,
        bootNavigationServed: true,
        bootExpectedClientIds: expectedClients.filter((id) => id !== navigationClientId),
      };
    } else if (state.bootNavigationServed) {
      state = rollbackUnconfirmedBoot(state);
    } else {
      state = { ...state, bootNavigationServed: true };
    }
    await store.write(state);
    return state.bootAttempt ?? state.activeRelease;
  }
  if (state.mode === 'manual') return state.pinnedRelease ?? state.activeRelease;
  const olderClients = (await getWindowClients()).filter(({ id }) => id !== navigationClientId);
  if (state.candidateRelease && olderClients.length === 0) {
    state = { ...beginBootAttempt(state, state.candidateRelease), bootNavigationServed: true };
    await store.write(state);
    return state.bootAttempt ?? state.activeRelease;
  }
  return state.activeRelease;
};

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/branch/') ||
    url.pathname.startsWith('/pr/') ||
    url.pathname === '/updates/latest.json' ||
    /^\/updates\/releases\/[^/]+\.json$/.test(url.pathname)
  ) {
    return;
  }

  event.respondWith(
    (async () => {
      const isNavigation = event.request.mode === 'navigate';
      const state = await store.read(currentRelease);
      const release = isNavigation
        ? await selectNavigationRelease(event.resultingClientId || event.clientId)
        : (state.bootAttempt ?? state.pinnedRelease ?? state.activeRelease);
      let response = await getReleaseResponse(release, url.pathname, isNavigation);
      if (
        !response &&
        state.mode === 'manual' &&
        state.pinnedRelease?.releaseId === release.releaseId
      ) {
        await prepareRelease(release);
        response = await getReleaseResponse(release, url.pathname, isNavigation);
      }
      return response ?? fetch(event.request);
    })(),
  );
});
