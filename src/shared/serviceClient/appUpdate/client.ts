import { APP_RELEASE_ID, MANAGED_APP_UPDATES_AVAILABLE } from '@shared/config';
import type {
  AppUpdateActionResult,
  AppUpdateMode,
  AppUpdateSnapshot,
} from '@shared/service/appUpdate/publicContracts';
import type { ReleaseControllerCommand } from '@shared/service/appUpdate/contracts';
import type { ControllerResponse } from '@shared/service/appUpdate/controller';

/** High-level managed-update actions and factual snapshot reads available to application code. */
export type AppUpdateClient = {
  /** Read the controller's latest factual UI-safe snapshot. */
  getSnapshot(): Promise<AppUpdateSnapshot>;
  /** Start or join a metadata check and acknowledge without awaiting background download work. */
  checkForUpdates(): Promise<AppUpdateActionResult>;
  /** Persist the selected Automatic or Manual update mode. */
  setMode(mode: AppUpdateMode): Promise<AppUpdateActionResult>;
  /** Start preparation and coordinated activation of the latest forward release. */
  updateNow(): Promise<AppUpdateActionResult>;
  /** Observe factual persisted snapshot changes broadcast to this stable window. */
  subscribeToSnapshot(listener: (snapshot: AppUpdateSnapshot) => void): () => void;
};

const unavailableSnapshot: AppUpdateSnapshot = {
  capability: 'unavailable',
  mode: 'automatic',
  checkState: 'notChecked',
  preparationState: 'idle',
  activationState: 'idle',
  errorCode: 'capabilityUnavailable',
};

const listeners = new Set<(snapshot: AppUpdateSnapshot) => void>();
let restartReady = () => true;
let registrationPromise: Promise<ServiceWorkerRegistration> | undefined;
let hooksInstalled = false;

const getRunningReleaseId = (): string | undefined => {
  const value = document.querySelector<HTMLMetaElement>(
    'meta[name="mioframe-release-id"]',
  )?.content;
  return value && /^[0-9a-f]{40}$/.test(value) ? value : APP_RELEASE_ID;
};

const publish = (snapshot: AppUpdateSnapshot) => {
  listeners.forEach((listener) => {
    listener(snapshot);
  });
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

const register = async (): Promise<void> => {
  if (!MANAGED_APP_UPDATES_AVAILABLE) throw new Error('Managed updates are unavailable.');
  registrationPromise ??= (async () => {
    const existing = await navigator.serviceWorker.getRegistration('/');
    if (existing) {
      try {
        await existing.update();
      } catch {
        // The installed stable controller remains usable while metadata is offline.
      }
      return existing;
    }
    return navigator.serviceWorker.register('/sw.js', { scope: '/' });
  })();
  await registrationPromise;
};

const send = async (command: ReleaseControllerCommand): Promise<ControllerResponse | undefined> => {
  try {
    await register();
    const controller = await waitForController();
    return await new Promise((resolve) => {
      const channel = new MessageChannel();
      const timeout = window.setTimeout(() => {
        resolve(undefined);
      }, 5_000);
      channel.port1.onmessage = (event: MessageEvent<ControllerResponse>) => {
        window.clearTimeout(timeout);
        resolve(event.data);
      };
      controller.postMessage(command, [channel.port2]);
    });
  } catch {
    return undefined;
  }
};

const action = async (command: ReleaseControllerCommand): Promise<AppUpdateActionResult> => {
  const response = await send(command);
  return response?.kind === 'action'
    ? response.result
    : { status: 'error', code: 'capabilityUnavailable' };
};

/**
 * Install the stable-window readiness callback used by coordinated restart.
 * @param readiness - Returns whether this stable window can safely restart.
 * @returns Cleanup that restores the default ready response.
 */
export const setupAppUpdateRestartReadiness = (readiness: () => boolean): (() => void) => {
  restartReady = readiness;
  return () => {
    restartReady = () => true;
  };
};

if (MANAGED_APP_UPDATES_AVAILABLE && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'APP_UPDATE_SNAPSHOT') {
      publish(event.data.snapshot);
    } else if (event.data?.type === 'PRIVATE_RESTART_READINESS') {
      event.ports[0]?.postMessage({ status: restartReady() ? 'ready' : 'busy' });
    } else if (
      event.data?.type === 'PRIVATE_UPDATE_RELOAD' &&
      typeof event.data.transactionId === 'string' &&
      typeof event.data.oldClientId === 'string'
    ) {
      const url = new URL(window.location.href);
      url.searchParams.set('__mioframe_restart_transaction', event.data.transactionId);
      url.searchParams.set('__mioframe_restart_client', event.data.oldClientId);
      window.location.replace(url);
    }
  });
}

/** Shared application client for managed stable updates. */
export const appUpdateClient: AppUpdateClient = {
  async getSnapshot() {
    if (!MANAGED_APP_UPDATES_AVAILABLE) return unavailableSnapshot;
    const response = await send({ protocolVersion: 2, type: 'GET_SNAPSHOT' });
    if (response?.kind === 'snapshot') {
      publish(response.snapshot);
      return response.snapshot;
    }
    return unavailableSnapshot;
  },
  checkForUpdates: () => action({ protocolVersion: 2, type: 'CHECK_FOR_UPDATES' }),
  setMode: (mode) => action({ protocolVersion: 2, type: 'SET_MODE', mode }),
  updateNow: () => action({ protocolVersion: 2, type: 'UPDATE_NOW' }),
  subscribeToSnapshot(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/**
 * Complete stable runtime registration after Vue mount and initial router readiness.
 * @returns The initial factual snapshot, or unavailable capability facts.
 */
export const setupManagedAppUpdates = async (): Promise<AppUpdateSnapshot> => {
  const runningReleaseId = getRunningReleaseId();
  if (!MANAGED_APP_UPDATES_AVAILABLE || !runningReleaseId || !('serviceWorker' in navigator)) {
    return unavailableSnapshot;
  }
  const snapshot = await appUpdateClient.getSnapshot();
  if (snapshot.capability === 'available') {
    await action({ protocolVersion: 2, type: 'PRIVATE_BOOT_READY', releaseId: runningReleaseId });
    if (
      window.location.search.includes('__mioframe_restart_transaction=') ||
      window.location.search.includes('__mioframe_restart_client=')
    ) {
      const url = new URL(window.location.href);
      url.searchParams.delete('__mioframe_restart_transaction');
      url.searchParams.delete('__mioframe_restart_client');
      window.history.replaceState(window.history.state, '', url);
    }
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
  return snapshot;
};
