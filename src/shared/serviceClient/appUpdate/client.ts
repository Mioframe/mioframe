import {
  withProtocolVersion,
  zodAppUpdateStateChangedBroadcast,
  zodAppUpdateWorkerFailureResponse,
  zodAppUpdateWorkerResponse,
  zodManagedControllerProbeResponse,
  type AppUpdateSnapshot,
  type AppUpdateWorkerRequest,
} from '@shared/service/appUpdate/protocol';
import type { UpdateMode } from '@shared/service/appUpdate/contracts';
import { MANAGED_APP_UPDATE_CHANNEL } from '@shared/config';

// Re-exported so UI-facing layers (entities, features) never need to import
// `@shared/service/appUpdate/*` directly — this client is their only
// allowed bridge to worker-owned types.
export type { AppUpdateErrorCode, AppUpdateSnapshot } from '@shared/service/appUpdate/protocol';
export type { UpdateMode } from '@shared/service/appUpdate/contracts';

/** The classified outcome of one bounded application-update client request. */
export type AppUpdateClientResult<T> =
  | { status: 'success'; value: T }
  | { status: 'timeout' }
  | { status: 'unavailable' };

/** Transport deadline for commands that do not wait for release preparation. */
const SHORT_REQUEST_TIMEOUT_MS = 10_000;
/** Transport deadline for commands that may wait for release download and hashing. */
const LONG_REQUEST_TIMEOUT_MS = 120_000;
/**
 * Client-side deadline for the managed-controller capability probe. Never
 * reused for an actual command deadline: a legacy Workbox controller (which
 * never answers this probe) must become "unavailable" quickly, long before
 * either command deadline would otherwise elapse.
 */
const PROBE_TIMEOUT_MS = 1_000;

const unavailableResult = (): AppUpdateClientResult<never> => ({ status: 'unavailable' });

/**
 * Classified outcome of one managed-controller capability probe.
 *
 * - `capable`/`incompatible` are confirmed, stable facts about this exact
 *   `ServiceWorker` object and are cached for it (see
 *   {@link capabilityByController}) — a controller's compatibility never
 *   changes without becoming a different `ServiceWorker` object;
 * - `temporarily-unavailable` is a transport failure (a throwing
 *   `MessageChannel` constructor, a synchronously throwing `postMessage`, or
 *   silence until {@link PROBE_TIMEOUT_MS}), indistinguishable from a silent
 *   legacy Workbox controller. Never cached: a later command must be able to
 *   probe the same controller again, so a transient failure — or a genuinely
 *   incompatible legacy controller, which will simply time out again — never
 *   permanently latches this controller as unavailable.
 */
type ManagedCapabilityProbeResult = 'capable' | 'incompatible' | 'temporarily-unavailable';

/**
 * Per-`ServiceWorker`-object cache of capability-probe results. Only
 * `capable`/`incompatible` outcomes are ever stored past their own
 * settlement (see {@link confirmManagedCapability}); a
 * `temporarily-unavailable` entry is removed as soon as it settles, so it
 * only ever shares one in-flight attempt among callers racing the same
 * probe, never a permanent cache. A different controller object (a new
 * deployment taking over) is always probed independently. Intentionally the
 * only capability state this client keeps — never persisted, never a
 * manager.
 */
const capabilityByController = new WeakMap<ServiceWorker, Promise<ManagedCapabilityProbeResult>>();

/**
 * Sends the same-path managed-controller capability probe to `controller`
 * and classifies its capability for `expectedChannel`. Never rejects: every
 * failure mode resolves `'temporarily-unavailable'`, exactly like a
 * compatible legacy Workbox controller that never implements this private
 * protocol at all — see {@link ManagedCapabilityProbeResult}.
 * @param controller - The controller to probe.
 * @param expectedChannel - This build's own managed application-update channel.
 * @returns The classified probe outcome.
 */
function probeManagedController(
  controller: ServiceWorker,
  expectedChannel: 'stable' | 'develop',
): Promise<ManagedCapabilityProbeResult> {
  let channel: MessageChannel;
  try {
    channel = new MessageChannel();
  } catch {
    return Promise.resolve('temporarily-unavailable');
  }

  return new Promise((resolve) => {
    let settled = false;

    const settle = (result: ManagedCapabilityProbeResult): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      channel.port1.onmessage = null;
      try {
        channel.port1.close();
      } catch {
        // A browser transport cleanup failure must not leak past this boundary.
      }
      resolve(result);
    };

    channel.port1.onmessage = (event) => {
      const parsed = zodManagedControllerProbeResponse.safeParse(event.data);
      settle(
        parsed.success && parsed.data.channel === expectedChannel ? 'capable' : 'incompatible',
      );
    };

    const timer = setTimeout(() => {
      settle('temporarily-unavailable');
    }, PROBE_TIMEOUT_MS);

    try {
      controller.postMessage(
        withProtocolVersion({ type: 'PROBE_MANAGED_UPDATE_CONTROLLER' as const }),
        [channel.port2],
      );
    } catch {
      settle('temporarily-unavailable');
    }
  });
}

/**
 * Resolves — and caches, per {@link capabilityByController} — this
 * controller's managed-update capability for this build's own
 * `MANAGED_APP_UPDATE_CHANNEL`. Only `capable`/`incompatible` are cached
 * past their own settlement; a `temporarily-unavailable` result is removed
 * from the cache once settled, so concurrent callers share the one in-flight
 * attempt but a later command always probes again.
 * @param controller - The controller to confirm.
 * @returns The classified probe outcome.
 */
function confirmManagedCapability(
  controller: ServiceWorker,
): Promise<ManagedCapabilityProbeResult> {
  if (!MANAGED_APP_UPDATE_CHANNEL) return Promise.resolve('incompatible');

  const cached = capabilityByController.get(controller);
  if (cached) return cached;

  const probe = probeManagedController(controller, MANAGED_APP_UPDATE_CHANNEL).then((result) => {
    if (result === 'temporarily-unavailable') capabilityByController.delete(controller);
    return result;
  });
  capabilityByController.set(controller, probe);
  return probe;
}

/**
 * Sends one private worker protocol request to an already-capability-
 * confirmed controller, over an owned `MessageChannel`. A timeout never
 * cancels worker work; it only settles this client request and ignores a
 * later response.
 * @param controller - The confirmed managed controller.
 * @param request - The protocol request to send.
 * @param timeoutMs - The finite client transport deadline.
 * @returns A classified response, timeout, or unavailable outcome.
 */
function sendCommand(
  controller: ServiceWorker,
  request: AppUpdateWorkerRequest,
  timeoutMs: number,
): Promise<AppUpdateClientResult<AppUpdateSnapshot>> {
  let channel: MessageChannel;
  try {
    channel = new MessageChannel();
  } catch {
    return Promise.resolve(unavailableResult());
  }

  return new Promise((resolve) => {
    let settled = false;

    const settle = (result: AppUpdateClientResult<AppUpdateSnapshot>): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      channel.port1.onmessage = null;
      try {
        channel.port1.close();
      } catch {
        // A browser transport cleanup failure must not leak past this boundary.
      }
      resolve(result);
    };

    channel.port1.onmessage = (event) => {
      const response = zodAppUpdateWorkerResponse.safeParse(event.data);
      if (response.success) {
        settle({ status: 'success', value: response.data.snapshot });
        return;
      }

      // The worker's stable v1 failure envelope and every malformed or
      // unsupported response have the same capability-unavailable transport
      // meaning. Neither exposes a raw worker exception to upper layers.
      if (zodAppUpdateWorkerFailureResponse.safeParse(event.data).success) {
        settle(unavailableResult());
        return;
      }
      settle(unavailableResult());
    };

    const timer = setTimeout(() => {
      settle({ status: 'timeout' });
    }, timeoutMs);

    try {
      controller.postMessage(request, [channel.port2]);
    } catch {
      settle(unavailableResult());
    }
  });
}

/**
 * Sends one private worker protocol request to this page's controlling
 * service worker, only once that controller's managed-update capability has
 * been confirmed (see {@link confirmManagedCapability}).
 *
 * Reads `navigator.serviceWorker.controller` directly rather than awaiting
 * `navigator.serviceWorker.ready`: this client only bridges the worker that
 * already controls the current document, and `ready` can remain pending
 * indefinitely for an unmanaged channel. An unsupported build, a missing
 * controller, or a failed capability probe all resolve `unavailable`
 * without ever sending `request`.
 * @param request - The protocol request to send.
 * @param timeoutMs - The finite client transport deadline for the command itself, once capability is confirmed.
 * @returns A classified response, timeout, or unavailable outcome.
 */
async function sendToController(
  request: AppUpdateWorkerRequest,
  timeoutMs: number,
): Promise<AppUpdateClientResult<AppUpdateSnapshot>> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return unavailableResult();
  }
  if (!MANAGED_APP_UPDATE_CHANNEL) return unavailableResult();

  let controller: ServiceWorker | null | undefined;
  try {
    controller = navigator.serviceWorker.controller;
  } catch {
    return unavailableResult();
  }
  if (!controller) return unavailableResult();

  const capability = await confirmManagedCapability(controller);
  if (capability !== 'capable') return unavailableResult();

  return sendCommand(controller, request, timeoutMs);
}

/**
 * Fetches the current update snapshot without triggering a check.
 * @returns A classified snapshot result.
 */
export function getAppUpdateSnapshot(): Promise<AppUpdateClientResult<AppUpdateSnapshot>> {
  return sendToController(withProtocolVersion({ type: 'GET_SNAPSHOT' }), SHORT_REQUEST_TIMEOUT_MS);
}

/**
 * Checks for a newer release. The deadline bounds only this page's transport
 * wait; a worker reconciliation that outlives it remains eligible to later
 * broadcast a fresh snapshot.
 * @returns A classified snapshot result.
 */
export function checkForAppUpdates(): Promise<AppUpdateClientResult<AppUpdateSnapshot>> {
  return sendToController(
    withProtocolVersion({ type: 'CHECK_FOR_UPDATES' }),
    LONG_REQUEST_TIMEOUT_MS,
  );
}

/**
 * Switches the managed-update mode. The worker responds after the durable
 * mode change and performs deferred reconciliation separately, so both mode
 * values use the short transport deadline.
 * @param mode - The requested update mode.
 * @returns A classified snapshot result.
 */
export function setAppUpdateMode(
  mode: UpdateMode,
): Promise<AppUpdateClientResult<AppUpdateSnapshot>> {
  return sendToController(
    withProtocolVersion({ type: 'SET_MODE', mode }),
    SHORT_REQUEST_TIMEOUT_MS,
  );
}

/**
 * Prepares and approves the current latest release for the next clean launch
 * in Manual mode.
 * @returns A classified snapshot result.
 */
export function installAppUpdateOnNextLaunch(): Promise<AppUpdateClientResult<AppUpdateSnapshot>> {
  return sendToController(
    withProtocolVersion({ type: 'INSTALL_ON_NEXT_LAUNCH' }),
    LONG_REQUEST_TIMEOUT_MS,
  );
}

/**
 * Cancels a scheduled Manual update that has not started activation.
 * @returns A classified snapshot result.
 */
export function cancelScheduledAppUpdate(): Promise<AppUpdateClientResult<AppUpdateSnapshot>> {
  return sendToController(
    withProtocolVersion({ type: 'CANCEL_SCHEDULED_UPDATE' }),
    SHORT_REQUEST_TIMEOUT_MS,
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
 * subscription in a browser without `serviceWorker` support.
 * @param onStateChanged - Called whenever the worker reports a background state change.
 * @returns An unsubscribe function that removes the underlying listener.
 */
export function subscribeToAppUpdateStateChanged(onStateChanged: () => void): () => void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return () => {};

  const handler = (event: MessageEvent): void => {
    if (isStateChangedBroadcast(event.data)) onStateChanged();
  };
  navigator.serviceWorker.addEventListener('message', handler);
  return () => {
    navigator.serviceWorker.removeEventListener('message', handler);
  };
}
