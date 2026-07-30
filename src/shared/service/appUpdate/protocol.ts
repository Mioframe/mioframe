import * as z from 'zod/v4-mini';
import { zodReleaseRef, zodReleaseSummary, zodUpdateMode } from './contracts';

/** Stable public error codes the worker may report back to the UI. Defined next to this boundary. */
export const APP_UPDATE_ERROR_CODES = ['check-failed', 'install-failed', 'unavailable'] as const;
/** One of {@link APP_UPDATE_ERROR_CODES}. */
export type AppUpdateErrorCode = (typeof APP_UPDATE_ERROR_CODES)[number];

/**
 * Private worker protocol message-type string literals, as a runtime value.
 *
 * The publisher-generated boot watchdog (`scripts/pages/lib/watchdogInject.mjs`)
 * runs as plain Node ESM with no TypeScript loader, so it cannot import this
 * module directly — it keeps its own literal copies of these strings.
 * `watchdogProtocolParity.test.ts` imports both this object and the built
 * watchdog script text and proves they stay in exact agreement, the same
 * proven-equivalence pattern used for the release descriptor validators (see
 * `scripts/pages/lib/releaseDescriptorCorpus.mjs`).
 */
export const APP_UPDATE_PROTOCOL_MESSAGE_TYPES = {
  BOOT_OK: 'BOOT_OK',
  BOOT_FAILED: 'BOOT_FAILED',
  GET_ACTIVATION_STATUS: 'GET_ACTIVATION_STATUS',
  ROLLBACK_BROADCAST: 'APP_UPDATE_ROLLBACK',
  STATE_CHANGED_BROADCAST: 'APP_UPDATE_STATE_CHANGED',
} as const;

/**
 * Private protocol wire-format version, present in every request, response,
 * acknowledgement, and broadcast that crosses the UI/worker/watchdog
 * boundary. Evolves additively: existing fields and semantics never change
 * for v1, and new fields are optional for a pinned v1 consumer. An
 * incompatible change requires a new explicit version and a separate
 * architecture decision — never a negotiation or adapter layer.
 */
export const APP_UPDATE_PROTOCOL_VERSION = 1;

const zodProtocolVersion = z.literal(APP_UPDATE_PROTOCOL_VERSION);

/** Every outcome the worker may report for a `BOOT_OK`/`BOOT_FAILED` acknowledgement. */
export const BOOT_ACK_OUTCOMES = ['committed', 'rolled-back', 'ignored', 'error'] as const;
/** One of {@link BOOT_ACK_OUTCOMES}. */
export type BootAckOutcome = (typeof BOOT_ACK_OUTCOMES)[number];

/**
 * The narrow, UI-facing read model the worker reports for every command
 * response. Never exposes cache names, descriptors, client ids, or other
 * controller internals.
 */
export const zodAppUpdateSnapshot = z.object({
  /** Current update mode. */
  mode: zodUpdateMode,
  /** The currently active release. */
  activeRelease: zodReleaseRef,
  /** The latest release discovered by a check, with display metadata, if any. */
  latestRelease: z.optional(zodReleaseSummary),
  /** An approved release waiting for the next clean launch, with display metadata, if any. */
  scheduledRelease: z.optional(zodReleaseSummary),
  /** The release currently being activated on a clean launch, with display metadata, if any. Derived only from `state.activation?.targetRelease` — never separately persisted. */
  activatingRelease: z.optional(zodReleaseSummary),
  /** The single most recent release that failed clean-launch activation and was rolled back, with display metadata, if any. Remains visible until cleared by a successful retry or superseded by a newer discovery. */
  failedRelease: z.optional(zodReleaseSummary),
  /** ISO timestamp of the last successful discovery check, if any. */
  lastSuccessfulCheckAt: z.optional(z.iso.datetime()),
  /** An error to report for this response, if any. */
  error: z.optional(z.enum(APP_UPDATE_ERROR_CODES)),
});
/** A {@link zodAppUpdateSnapshot}-validated UI-facing snapshot. */
export type AppUpdateSnapshot = z.infer<typeof zodAppUpdateSnapshot>;

const zodProtocolReleaseId = z.string().check(z.minLength(1));

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
    releaseId: zodProtocolReleaseId,
  }),
  z.object({
    protocolVersion: zodProtocolVersion,
    type: z.literal(APP_UPDATE_PROTOCOL_MESSAGE_TYPES.BOOT_FAILED),
    releaseId: zodProtocolReleaseId,
  }),
  z.object({
    protocolVersion: zodProtocolVersion,
    type: z.literal(APP_UPDATE_PROTOCOL_MESSAGE_TYPES.GET_ACTIVATION_STATUS),
    releaseId: zodProtocolReleaseId,
  }),
]);
/** A {@link zodAppUpdateWorkerRequest}-validated private protocol request. */
export type AppUpdateWorkerRequest = z.infer<typeof zodAppUpdateWorkerRequest>;

/** Private worker protocol response message: every command resolves with the resulting snapshot. */
export const zodAppUpdateWorkerResponse = z.object({
  protocolVersion: zodProtocolVersion,
  /** The resulting snapshot after handling the request. */
  snapshot: zodAppUpdateSnapshot,
});
/** A {@link zodAppUpdateWorkerResponse}-validated private protocol response. */
export type AppUpdateWorkerResponse = z.infer<typeof zodAppUpdateWorkerResponse>;

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
  /** The release id that failed to boot and was rolled back. */
  releaseId: zodProtocolReleaseId,
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
 * requester immediately, plus optional follow-up work owned by the same
 * originating `message` event's lifetime (cache cleanup, a same-channel
 * invalidation broadcast, or a rollback broadcast). Never itself sent over
 * `postMessage` — an internal, same-thread return contract between
 * `handleWorkerMessage()`/`runUpdateCheck()` and `src/sw.ts`'s message
 * handler.
 */
export type WorkerMessageResult<Response> = {
  /** The response to post back to the requester immediately. */
  response: Response;
  /**
   * Optional follow-up work kept alive under the same message event's
   * `waitUntil()`. Best effort: its rejection must never change the
   * already-posted `response`.
   */
  lifetimeWork?: Promise<void> | undefined;
};
