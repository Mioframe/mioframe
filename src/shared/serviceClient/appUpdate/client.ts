import {
  withProtocolVersion,
  zodAppUpdateStateChangedBroadcast,
  zodAppUpdateWorkerResponse,
  type AppUpdateSnapshot,
  type AppUpdateWorkerRequest,
  type AppUpdateWorkerResponse,
} from '@shared/service/appUpdate/protocol';
import type { UpdateMode } from '@shared/service/appUpdate/contracts';

// Re-exported so UI-facing layers (entities, features) never need to import
// `@shared/service/appUpdate/*` directly — this client is their only
// allowed bridge to worker-owned types.
export type { AppUpdateErrorCode, AppUpdateSnapshot } from '@shared/service/appUpdate/protocol';
export type { UpdateMode } from '@shared/service/appUpdate/contracts';

/**
 * Bounded transport timeout for fast local requests that never perform
 * release preparation (network download and hashing): `GET_SNAPSHOT`,
 * `SET_MODE` to Manual, and `CANCEL_SCHEDULED_UPDATE`. `CHECK_FOR_UPDATES`,
 * `SET_MODE` to Automatic, and `INSTALL_ON_NEXT_LAUNCH` may download and
 * hash a release, so they are sent with no client-side timeout at all — the
 * feature-local `isChecking`/`isPreparing` state remains the UI's only
 * progress owner while such a command is in flight.
 */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Sends one private worker protocol request to this page's controlling
 * service worker and awaits its response over a dedicated `MessageChannel`.
 * Resolves `undefined` when no managed controller is available at all
 * (unsupported browser, no current controller, or a bounded request timed
 * out) — callers treat that as the capability-unavailable state.
 *
 * Reads `navigator.serviceWorker.controller` directly rather than awaiting
 * `navigator.serviceWorker.ready` first: this client is only a bridge to
 * whichever worker already controls the current document, and `ready` can
 * remain pending indefinitely when no registration ever becomes active for
 * this page (e.g. an unmanaged channel) — an unbounded wait this function
 * must never introduce.
 * @param request - The protocol request to send.
 * @param timeoutMs - Bounded transport timeout in milliseconds; omitted for a command that may take arbitrarily long (release download and hashing).
 * @returns The worker's response, or `undefined` when unavailable.
 */
async function sendToController(
  request: AppUpdateWorkerRequest,
  timeoutMs?: number,
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
      // A malformed response or an unsupported/missing protocol version is
      // treated exactly like no response at all (see `settle`'s callers),
      // never thrown.
      const parsed = zodAppUpdateWorkerResponse.safeParse(event.data);
      settle(parsed.success ? parsed.data : undefined);
    };
    if (timeoutMs !== undefined) {
      setTimeout(() => {
        settle(undefined);
      }, timeoutMs);
    }
    controller.postMessage(request, [channel.port2]);
  });
}

async function sendAndUnwrap(
  request: AppUpdateWorkerRequest,
  timeoutMs?: number,
): Promise<AppUpdateSnapshot | undefined> {
  const response = await sendToController(request, timeoutMs);
  return response?.snapshot;
}

/**
 * Fetches the current update snapshot without triggering a check.
 * @returns The current snapshot, or `undefined` when unavailable.
 */
export function getAppUpdateSnapshot(): Promise<AppUpdateSnapshot | undefined> {
  return sendAndUnwrap(withProtocolVersion({ type: 'GET_SNAPSHOT' }), REQUEST_TIMEOUT_MS);
}

/**
 * Checks for a newer release. In Automatic mode, a newer release is also
 * prepared and approved in the background. May download and hash a release,
 * so this command carries no client-side timeout; the caller's own
 * `isChecking` state owns UI progress while it is in flight.
 * @returns The resulting snapshot, or `undefined` when unavailable.
 */
export function checkForAppUpdates(): Promise<AppUpdateSnapshot | undefined> {
  return sendAndUnwrap(withProtocolVersion({ type: 'CHECK_FOR_UPDATES' }));
}

/**
 * Switches the update mode. Switching to Automatic prepares and approves
 * the latest known forward release, so it may download and hash a release
 * and carries no client-side timeout. Switching to Manual only clears an
 * unstarted Automatic approval and keeps the bounded transport timeout.
 * @param mode - The mode to switch to.
 * @returns The resulting snapshot, or `undefined` when unavailable.
 */
export function setAppUpdateMode(mode: UpdateMode): Promise<AppUpdateSnapshot | undefined> {
  const timeoutMs = mode === 'manual' ? REQUEST_TIMEOUT_MS : undefined;
  return sendAndUnwrap(withProtocolVersion({ type: 'SET_MODE', mode }), timeoutMs);
}

/**
 * Prepares and approves the current latest release for installation on the
 * next clean launch (Manual mode). May download and hash a release, so this
 * command carries no client-side timeout; the caller's own `isPreparing`
 * state owns UI progress while it is in flight.
 * @returns The resulting snapshot, or `undefined` when unavailable.
 */
export function installAppUpdateOnNextLaunch(): Promise<AppUpdateSnapshot | undefined> {
  return sendAndUnwrap(withProtocolVersion({ type: 'INSTALL_ON_NEXT_LAUNCH' }));
}

/**
 * Cancels a scheduled Manual update that has not yet started activation.
 * @returns The resulting snapshot, or `undefined` when unavailable.
 */
export function cancelScheduledAppUpdate(): Promise<AppUpdateSnapshot | undefined> {
  return sendAndUnwrap(
    withProtocolVersion({ type: 'CANCEL_SCHEDULED_UPDATE' }),
    REQUEST_TIMEOUT_MS,
  );
}

/**
 * Returns `true` when `data` is a valid v1 private state-invalidation
 * broadcast. Never carries a snapshot itself — a subscriber must re-fetch
 * through {@link getAppUpdateSnapshot}. A malformed payload or an
 * unsupported/missing protocol version is never treated as this broadcast.
 * @param data - A `navigator.serviceWorker` `message` event's `data`.
 * @returns Whether `data` is a state-invalidation broadcast.
 */
function isStateChangedBroadcast(data: unknown): boolean {
  return zodAppUpdateStateChangedBroadcast.safeParse(data).success;
}

/**
 * Subscribes to the worker's private same-channel state-invalidation
 * broadcast, calling `onStateChanged` with no arguments every time one
 * arrives so the caller can re-fetch the current snapshot. A no-op
 * subscription (a no-op unsubscribe) in a browser without `serviceWorker`
 * support.
 * @param onStateChanged - Called whenever the worker reports a background state change.
 * @returns An unsubscribe function that removes the underlying listener.
 */
export function subscribeToAppUpdateStateChanged(onStateChanged: () => void): () => void {
  if (!('serviceWorker' in navigator)) return () => {};

  const handler = (event: MessageEvent): void => {
    if (isStateChangedBroadcast(event.data)) onStateChanged();
  };
  navigator.serviceWorker.addEventListener('message', handler);
  return () => {
    navigator.serviceWorker.removeEventListener('message', handler);
  };
}
