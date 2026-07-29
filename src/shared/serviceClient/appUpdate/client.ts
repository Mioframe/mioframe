import type {
  AppUpdateSnapshot,
  AppUpdateWorkerRequest,
  AppUpdateWorkerResponse,
} from '@shared/service/appUpdate/protocol';
import type { UpdateMode } from '@shared/service/appUpdate/contracts';

// Re-exported so UI-facing layers (entities, features) never need to import
// `@shared/service/appUpdate/*` directly — this client is their only
// allowed bridge to worker-owned types.
export type { AppUpdateErrorCode, AppUpdateSnapshot } from '@shared/service/appUpdate/protocol';
export type { UpdateMode } from '@shared/service/appUpdate/contracts';

const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Sends one private worker protocol request to this page's controlling
 * service worker and awaits its response over a dedicated `MessageChannel`.
 * Resolves `undefined` when no managed controller is available at all
 * (unsupported browser, no current controller, or the request timed out) —
 * callers treat that as the capability-unavailable state.
 *
 * Reads `navigator.serviceWorker.controller` directly rather than awaiting
 * `navigator.serviceWorker.ready` first: this client is only a bridge to
 * whichever worker already controls the current document, and `ready` can
 * remain pending indefinitely when no registration ever becomes active for
 * this page (e.g. an unmanaged channel) — an unbounded wait this function
 * must never introduce.
 * @param request - The protocol request to send.
 * @returns The worker's response, or `undefined` when unavailable.
 */
async function sendToController(
  request: AppUpdateWorkerRequest,
): Promise<AppUpdateWorkerResponse | undefined> {
  if (!('serviceWorker' in navigator)) return undefined;

  const controller = navigator.serviceWorker.controller;
  if (!controller) return undefined;

  return new Promise<AppUpdateWorkerResponse | undefined>((resolve) => {
    const channel = new MessageChannel();
    let settled = false;

    const settle = (result: AppUpdateWorkerResponse | undefined) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    channel.port1.onmessage = (event) => {
      const data: AppUpdateWorkerResponse = event.data;
      settle(data);
    };
    setTimeout(() => {
      settle(undefined);
    }, REQUEST_TIMEOUT_MS);
    controller.postMessage(request, [channel.port2]);
  });
}

async function sendAndUnwrap(
  request: AppUpdateWorkerRequest,
): Promise<AppUpdateSnapshot | undefined> {
  const response = await sendToController(request);
  return response?.snapshot;
}

/**
 * Fetches the current update snapshot without triggering a check.
 * @returns The current snapshot, or `undefined` when unavailable.
 */
export function getAppUpdateSnapshot(): Promise<AppUpdateSnapshot | undefined> {
  return sendAndUnwrap({ type: 'GET_SNAPSHOT' });
}

/**
 * Checks for a newer release. In Automatic mode, a newer release is also
 * prepared and approved in the background.
 * @returns The resulting snapshot, or `undefined` when unavailable.
 */
export function checkForAppUpdates(): Promise<AppUpdateSnapshot | undefined> {
  return sendAndUnwrap({ type: 'CHECK_FOR_UPDATES' });
}

/**
 * Switches the update mode. Switching to Automatic prepares and approves
 * the latest known forward release; switching to Manual clears an unstarted
 * Automatic approval.
 * @param mode - The mode to switch to.
 * @returns The resulting snapshot, or `undefined` when unavailable.
 */
export function setAppUpdateMode(mode: UpdateMode): Promise<AppUpdateSnapshot | undefined> {
  return sendAndUnwrap({ type: 'SET_MODE', mode });
}

/**
 * Prepares and approves the current latest release for installation on the
 * next clean launch (Manual mode).
 * @returns The resulting snapshot, or `undefined` when unavailable.
 */
export function installAppUpdateOnNextLaunch(): Promise<AppUpdateSnapshot | undefined> {
  return sendAndUnwrap({ type: 'INSTALL_ON_NEXT_LAUNCH' });
}

/**
 * Cancels a scheduled Manual update that has not yet started activation.
 * @returns The resulting snapshot, or `undefined` when unavailable.
 */
export function cancelScheduledAppUpdate(): Promise<AppUpdateSnapshot | undefined> {
  return sendAndUnwrap({ type: 'CANCEL_SCHEDULED_UPDATE' });
}
