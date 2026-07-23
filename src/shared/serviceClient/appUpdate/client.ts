/* eslint-disable jsdoc/require-jsdoc -- AppUpdateClient is the documented narrow public contract; helpers remain module-private. */
import type {
  AppUpdateOutcome,
  ReleaseControllerCommand,
  ReleaseControllerState,
} from '@shared/service/appUpdate';
import { APP_RELEASE_ID, MANAGED_APP_UPDATES_AVAILABLE } from '@shared/config';

export type AppUpdateClient = {
  getState(): Promise<AppUpdateOutcome>;
  checkForUpdates(): Promise<AppUpdateOutcome>;
  setAutomatic(enabled: boolean, runningReleaseId: string): Promise<AppUpdateOutcome>;
  prepareLatest(): Promise<AppUpdateOutcome>;
  requestActivate(): Promise<AppUpdateOutcome>;
  reportBootOk(releaseId: string): Promise<void>;
  subscribe(listener: (state: ReleaseControllerState) => void): () => void;
};

const listeners = new Set<(state: ReleaseControllerState) => void>();
let restartReady = () => true;
let registrationPromise: Promise<ServiceWorkerRegistration> | undefined;
let hooksInstalled = false;

const publish = (outcome: AppUpdateOutcome): AppUpdateOutcome => {
  if ('state' in outcome) {
    const nextState = outcome.state;
    listeners.forEach((listener) => {
      listener(nextState);
    });
  }
  return outcome;
};

const waitForController = async (): Promise<ServiceWorker> => {
  if (navigator.serviceWorker.controller) return navigator.serviceWorker.controller;
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error('Update controller unavailable.'));
    }, 8_000);
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => {
        window.clearTimeout(timeout);
        const controller = navigator.serviceWorker.controller;
        if (controller) resolve(controller);
        else reject(new Error('Update controller unavailable.'));
      },
      { once: true },
    );
  });
};

const register = async (): Promise<ServiceWorkerRegistration> => {
  if (!MANAGED_APP_UPDATES_AVAILABLE) throw new Error('Managed updates are not available.');
  registrationPromise ??= (async () => {
    const existing = await navigator.serviceWorker.getRegistration('/');
    if (!existing) return navigator.serviceWorker.register('/sw.js', { scope: '/' });
    try {
      await existing.update();
    } catch {
      // The currently active controller remains usable when an update check is offline.
    }
    return existing;
  })();
  return registrationPromise;
};

const send = async (command: ReleaseControllerCommand): Promise<AppUpdateOutcome> => {
  if (command.type === 'CHECK' && !navigator.onLine) {
    return { status: 'error', code: 'checkFailed' };
  }
  try {
    await register();
    const controller = await waitForController();
    return await new Promise<AppUpdateOutcome>((resolve) => {
      const channel = new MessageChannel();
      const timeout = window.setTimeout(() => {
        const code =
          command.type === 'CHECK'
            ? 'checkFailed'
            : command.type === 'PREPARE_LATEST' || command.type === 'ACTIVATE'
              ? 'prepareFailed'
              : 'capabilityUnavailable';
        resolve({ status: 'error', code });
      }, 5_000);
      channel.port1.onmessage = (event: MessageEvent<AppUpdateOutcome>) => {
        window.clearTimeout(timeout);
        resolve(publish(event.data));
      };
      controller.postMessage(command, [channel.port2]);
    });
  } catch {
    return { status: 'error', code: 'capabilityUnavailable' };
  }
};

export const setupAppUpdateRestartReadiness = (readiness: () => boolean): (() => void) => {
  restartReady = readiness;
  return () => {
    restartReady = () => true;
  };
};

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'RESTART_READINESS') {
      event.ports[0]?.postMessage({ status: restartReady() ? 'ready' : 'busy' });
    } else if (event.data?.type === 'RELOAD_FOR_UPDATE' && restartReady()) {
      window.location.reload();
    }
  });
}

export const appUpdateClient: AppUpdateClient = {
  getState: () => send({ protocolVersion: 1, type: 'GET_STATE' }),
  checkForUpdates: () => send({ protocolVersion: 1, type: 'CHECK' }),
  setAutomatic: (enabled, runningReleaseId) =>
    send({ protocolVersion: 1, type: 'SET_AUTOMATIC', enabled, runningReleaseId }),
  prepareLatest: () => send({ protocolVersion: 1, type: 'PREPARE_LATEST' }),
  requestActivate: () => send({ protocolVersion: 1, type: 'ACTIVATE' }),
  async reportBootOk(releaseId) {
    await send({ protocolVersion: 1, type: 'BOOT_OK', releaseId });
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export const setupManagedAppUpdates = async (): Promise<AppUpdateOutcome> => {
  if (!MANAGED_APP_UPDATES_AVAILABLE || !APP_RELEASE_ID || !('serviceWorker' in navigator)) {
    return { status: 'error', code: 'capabilityUnavailable' };
  }
  const outcome = await appUpdateClient.getState();
  if (outcome.status === 'ok') {
    await appUpdateClient.reportBootOk(APP_RELEASE_ID);
    if (!hooksInstalled) {
      hooksInstalled = true;
      const checkWhenReachable = () => {
        if (navigator.onLine && document.visibilityState === 'visible') {
          void appUpdateClient.checkForUpdates();
        }
      };
      window.addEventListener('online', checkWhenReachable);
      document.addEventListener('visibilitychange', checkWhenReachable);
      checkWhenReachable();
    }
  }
  return outcome;
};
/* eslint-enable jsdoc/require-jsdoc -- End AppUpdateClient implementation. */
