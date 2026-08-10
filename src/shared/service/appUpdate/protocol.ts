import * as z from 'zod/v4-mini';
import {
  isPositiveSafeInteger,
  zodManagedChannel,
  zodReleaseSummary,
  zodUpdateCandidate,
  zodUpdateMode,
} from './contracts';
import {
  APP_UPDATE_PROTOCOL_VERSION,
  BOOT_ACK_OUTCOMES,
  WATCHDOG_PROTOCOL_MESSAGE_TYPES,
} from './workerProtocolWireContract';

export { APP_UPDATE_PROTOCOL_VERSION, BOOT_ACK_OUTCOMES } from './workerProtocolWireContract';
export type { BootAckOutcome } from './workerProtocolWireContract';

/** Stable public error codes the worker may report back to the UI. Defined next to this boundary. */
export const APP_UPDATE_ERROR_CODES = ['check-failed', 'install-failed', 'unavailable'] as const;
/** One of {@link APP_UPDATE_ERROR_CODES}. */
export type AppUpdateErrorCode = (typeof APP_UPDATE_ERROR_CODES)[number];

/**
 * Private worker protocol message-type string literals, as a runtime value.
 * Composed from the canonical {@link WATCHDOG_PROTOCOL_MESSAGE_TYPES} (the
 * subset the publisher-generated boot watchdog itself sends or reads) plus
 * the two runtime-only broadcast/recovery types the watchdog never uses.
 */
export const APP_UPDATE_PROTOCOL_MESSAGE_TYPES = {
  ...WATCHDOG_PROTOCOL_MESSAGE_TYPES,
  STATE_CHANGED_BROADCAST: 'APP_UPDATE_STATE_CHANGED',
  RECOVER_INSTALL_LATEST: 'RECOVER_INSTALL_LATEST',
} as const;

const zodProtocolVersion = z.literal(APP_UPDATE_PROTOCOL_VERSION);

/**
 * The narrow, UI-facing read model the worker reports for every command
 * response: a direct projection of persisted state plus an ephemeral
 * classified error. Never exposes cache names, descriptors, client ids, or
 * other controller internals.
 */
export const zodAppUpdateSnapshot = z.object({
  /** Current update mode. */
  mode: zodUpdateMode,
  /** The currently active release. */
  activeRelease: zodReleaseSummary,
  /** The single future release candidate, if any. */
  candidate: z.optional(zodUpdateCandidate),
  /** ISO timestamp of the last successful discovery check, if any. */
  lastSuccessfulCheckAt: z.optional(z.iso.datetime()),
  /** An error to report for this response, if any. */
  error: z.optional(z.enum(APP_UPDATE_ERROR_CODES)),
});
/** A {@link zodAppUpdateSnapshot}-validated UI-facing snapshot. */
export type AppUpdateSnapshot = z.infer<typeof zodAppUpdateSnapshot>;

const zodProtocolReleaseNumber = z.number().check(z.refine(isPositiveSafeInteger));

/** Private worker protocol request messages. Never imported by UI-facing layers directly. */
export const zodAppUpdateWorkerRequest = z.discriminatedUnion('type', [
  z.object({ protocolVersion: zodProtocolVersion, type: z.literal('GET_SNAPSHOT') }),
  z.object({ protocolVersion: zodProtocolVersion, type: z.literal('CHECK_FOR_UPDATES') }),
  z.object({
    protocolVersion: zodProtocolVersion,
    type: z.literal('SET_MODE'),
    mode: zodUpdateMode,
  }),
  z.object({ protocolVersion: zodProtocolVersion, type: z.literal('INSTALL_ON_NEXT_LAUNCH') }),
  z.object({ protocolVersion: zodProtocolVersion, type: z.literal('CANCEL_SCHEDULED_UPDATE') }),
  z.object({
    protocolVersion: zodProtocolVersion,
    type: z.literal(APP_UPDATE_PROTOCOL_MESSAGE_TYPES.BOOT_OK),
    releaseNumber: zodProtocolReleaseNumber,
  }),
  z.object({
    protocolVersion: zodProtocolVersion,
    type: z.literal(APP_UPDATE_PROTOCOL_MESSAGE_TYPES.BOOT_FAILED),
    releaseNumber: zodProtocolReleaseNumber,
  }),
  z.object({
    protocolVersion: zodProtocolVersion,
    type: z.literal(APP_UPDATE_PROTOCOL_MESSAGE_TYPES.GET_ACTIVATION_STATUS),
    releaseNumber: zodProtocolReleaseNumber,
  }),
  z.object({
    protocolVersion: zodProtocolVersion,
    type: z.literal(APP_UPDATE_PROTOCOL_MESSAGE_TYPES.RECOVER_INSTALL_LATEST),
  }),
]);
/** A {@link zodAppUpdateWorkerRequest}-validated private protocol request. */
export type AppUpdateWorkerRequest = z.infer<typeof zodAppUpdateWorkerRequest>;
/** The `RECOVER_INSTALL_LATEST` request variant of {@link AppUpdateWorkerRequest}. */
export type RecoverInstallLatestRequest = Extract<
  AppUpdateWorkerRequest,
  { type: 'RECOVER_INSTALL_LATEST' }
>;

/** Private worker protocol response message: every command resolves with the resulting snapshot. */
export const zodAppUpdateWorkerResponse = z.object({
  protocolVersion: zodProtocolVersion,
  /** The resulting snapshot after handling the request. */
  snapshot: zodAppUpdateSnapshot,
});
/** A {@link zodAppUpdateWorkerResponse}-validated private protocol response. */
export type AppUpdateWorkerResponse = z.infer<typeof zodAppUpdateWorkerResponse>;

/**
 * The single stable protocol-v1 failure envelope `src/sw.ts`'s message
 * handler sends when `handleWorkerMessage()` throws an unexpected error.
 * Never carries the raw exception message or any other diagnostic detail —
 * this private protocol boundary only ever exposes this one fixed shape for
 * an unexpected failure, exactly like {@link zodAppUpdateWorkerResponse}'s
 * `snapshot.error` field for an expected, already-classified one.
 */
export const zodAppUpdateWorkerFailureResponse = z.object({
  protocolVersion: zodProtocolVersion,
  error: z.literal('unavailable'),
});
/** A {@link zodAppUpdateWorkerFailureResponse}-validated private protocol failure envelope. */
export type AppUpdateWorkerFailureResponse = z.infer<typeof zodAppUpdateWorkerFailureResponse>;

/**
 * Private worker protocol response to `BOOT_OK`/`BOOT_FAILED`, acknowledging
 * exactly what the worker durably persisted (or failed to). The watchdog
 * only disables its own error handlers and deadline timer on a `committed`
 * or `rolled-back` outcome — never merely because the message was sent.
 */
export const zodAppUpdateBootAckResponse = z.object({
  protocolVersion: zodProtocolVersion,
  /** The resulting snapshot after handling the request. */
  snapshot: zodAppUpdateSnapshot,
  /** What the worker durably did with this acknowledgement. */
  ack: z.enum(BOOT_ACK_OUTCOMES),
});
/** A {@link zodAppUpdateBootAckResponse}-validated boot acknowledgement. */
export type AppUpdateBootAckResponse = z.infer<typeof zodAppUpdateBootAckResponse>;

/**
 * Every stable result code a `RECOVER_INSTALL_LATEST` response may report
 * (see the managed pinned application updates architecture, "Recovery result
 * categories"). Never carries a raw exception or a state snapshot — the
 * recovery page's own subsequent reload, not this response, is what a client
 * uses to observe the resulting state.
 */
export const RECOVER_INSTALL_LATEST_RESULT_CODES = [
  /** State-loss recovery wrote a fresh Automatic baseline, or known-active recovery restored exact A or scheduled a newer B as `ready`. */
  'success',
  /** Fresh state changed concurrently (another window already recovered, or active/pinned candidate changed); the page should reload and let ordinary lifecycle logic reclassify. */
  'state-changed',
  /** Controller storage could not be read or written. */
  'controller-storage-unavailable',
  /** `latest.json` or its descriptor could not be fetched. */
  'network-or-latest-unavailable',
  /** `latest.json` or its descriptor failed structural validation. */
  'invalid-latest-metadata',
  /** Known-active recovery only: `latest.releaseNumber` is older than the current active release. */
  'latest-older-than-active',
  /** Known-active recovery only: `latest` shares the active/candidate release number but conflicts on another identity field. */
  'conflicting-release-identity',
  /** Exact-release preparation (download, integrity, or Cache Storage) failed. */
  'release-preparation-failed',
  /** The final durable controller-state write failed after successful preparation. */
  'controller-state-persistence-failed',
] as const;
/** One of {@link RECOVER_INSTALL_LATEST_RESULT_CODES}. */
export type RecoverInstallLatestResultCode = (typeof RECOVER_INSTALL_LATEST_RESULT_CODES)[number];

/**
 * Private worker protocol response to `RECOVER_INSTALL_LATEST`. Deliberately
 * not an {@link AppUpdateWorkerResponse}: recovery may run from absent or
 * invalid persisted state, so it has no snapshot to report — only this one
 * stable result code, safe to render directly on the recovery page.
 */
export const zodRecoverInstallLatestResponse = z.object({
  protocolVersion: zodProtocolVersion,
  result: z.enum(RECOVER_INSTALL_LATEST_RESULT_CODES),
});
/** A {@link zodRecoverInstallLatestResponse}-validated recovery response. */
export type RecoverInstallLatestResponse = z.infer<typeof zodRecoverInstallLatestResponse>;

/**
 * Private worker protocol response to `GET_ACTIVATION_STATUS`, used only by
 * the publisher-injected boot watchdog to know whether — and until when —
 * to arm its own boot-confirmation deadline for its exact release.
 */
export const zodActivationStatusResponse = z.discriminatedUnion('isActivationTarget', [
  z.object({
    protocolVersion: zodProtocolVersion,
    isActivationTarget: z.literal(true),
    deadlineAt: z.iso.datetime(),
  }),
  z.object({ protocolVersion: zodProtocolVersion, isActivationTarget: z.literal(false) }),
]);
/** A {@link zodActivationStatusResponse}-validated activation-status response. */
export type ActivationStatusResponse = z.infer<typeof zodActivationStatusResponse>;

/** Broadcast the worker sends to every same-channel activation window on a boot failure. */
export const zodAppUpdateRollbackBroadcast = z.object({
  protocolVersion: zodProtocolVersion,
  /** Discriminant tag for this broadcast message. */
  type: z.literal(APP_UPDATE_PROTOCOL_MESSAGE_TYPES.ROLLBACK_BROADCAST),
  /** The release number that failed to boot and was rolled back. */
  releaseNumber: zodProtocolReleaseNumber,
});
/** A {@link zodAppUpdateRollbackBroadcast}-validated rollback broadcast. */
export type AppUpdateRollbackBroadcast = z.infer<typeof zodAppUpdateRollbackBroadcast>;

/**
 * Private invalidation-only broadcast the worker sends to every same-channel
 * window after a background state change (a scheduled discovery check with
 * no foreground requester waiting on a response). Never carries a duplicate
 * snapshot — a receiving client must re-fetch through `GET_SNAPSHOT`.
 */
export const zodAppUpdateStateChangedBroadcast = z.object({
  protocolVersion: zodProtocolVersion,
  /** Discriminant tag for this broadcast message. */
  type: z.literal(APP_UPDATE_PROTOCOL_MESSAGE_TYPES.STATE_CHANGED_BROADCAST),
});
/** A {@link zodAppUpdateStateChangedBroadcast}-validated state-changed broadcast. */
export type AppUpdateStateChangedBroadcast = z.infer<typeof zodAppUpdateStateChangedBroadcast>;

/**
 * The same-path bootstrap compatibility probe (Stage 3) an installing worker
 * sends to `registration.active` to test whether it is itself a managed
 * update controller. Handled by `src/sw.ts` before normal same-channel
 * window request validation: the sender is another service worker instance,
 * never a window client, so it must never be rejected by the window-client
 * source check. Answering it reads no state, mutates no state, and touches
 * no cache — see {@link zodManagedControllerProbeResponse} for the reply.
 */
export const zodManagedControllerProbeRequest = z.object({
  protocolVersion: zodProtocolVersion,
  type: z.literal('PROBE_MANAGED_UPDATE_CONTROLLER'),
});
/** A {@link zodManagedControllerProbeRequest}-validated predecessor probe request. */
export type ManagedControllerProbeRequest = z.infer<typeof zodManagedControllerProbeRequest>;

/**
 * The response a managed controller worker returns to the same-path
 * bootstrap compatibility probe (Stage 3): proves the responding
 * `registration.active` worker is itself a managed update controller for the
 * given channel, distinct from a compatible legacy Workbox `CACHE_URLS`
 * responder.
 */
export const zodManagedControllerProbeResponse = z.object({
  protocolVersion: zodProtocolVersion,
  /** Discriminates this response from a compatible Workbox `CACHE_URLS` acknowledgement. */
  kind: z.literal('managed-update-controller'),
  channel: zodManagedChannel,
});
/** A {@link zodManagedControllerProbeResponse}-validated predecessor probe response. */
export type ManagedControllerProbeResponse = z.infer<typeof zodManagedControllerProbeResponse>;

/**
 * Stamps `payload` with the current private protocol version. The single
 * place every worker-constructed request, response, acknowledgement, or
 * broadcast attaches `protocolVersion`, so every producer stays trivially in
 * agreement.
 * @param payload - The protocol payload fields, without `protocolVersion`.
 * @returns `payload` with `protocolVersion` attached.
 */
export function withProtocolVersion<T extends object>(
  payload: T,
): T & { protocolVersion: typeof APP_UPDATE_PROTOCOL_VERSION } {
  return { ...payload, protocolVersion: APP_UPDATE_PROTOCOL_VERSION };
}

/**
 * A worker message handler's result: the response to post back to the
 * requester immediately, plus an optional deferred follow-up work callback
 * owned by the same originating `message` event's lifetime (cache cleanup, a
 * same-channel invalidation broadcast, or a rollback broadcast). Never itself
 * sent over `postMessage` — an internal, same-thread return contract between
 * `handleWorkerMessage()`/`runUpdateCheck()` and `src/sw.ts`'s message
 * handler.
 *
 * `runLifetimeWork` is a callback, not an already-running `Promise`: the
 * underlying work (cache cleanup, a broadcast) must not start until the
 * caller explicitly invokes it, so it can never begin before `response` has
 * already been posted.
 */
export type WorkerMessageResult<Response> = {
  /** The response to post back to the requester immediately. */
  response: Response;
  /**
   * Optional deferred follow-up work, kept alive under the same message
   * event's `waitUntil()` once invoked. Best effort: its rejection must never
   * change the already-posted `response`. Must be called only after
   * `response` has been posted, never before.
   */
  runLifetimeWork?: (() => Promise<void>) | undefined;
};
