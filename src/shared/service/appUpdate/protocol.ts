import type { ReleaseRef, ReleaseSummary, UpdateMode } from './contracts';

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

/** Every outcome the worker may report for a `BOOT_OK`/`BOOT_FAILED` acknowledgement. */
export const BOOT_ACK_OUTCOMES = ['committed', 'rolled-back', 'ignored', 'error'] as const;
/** One of {@link BOOT_ACK_OUTCOMES}. */
export type BootAckOutcome = (typeof BOOT_ACK_OUTCOMES)[number];

/**
 * The narrow, UI-facing read model the worker reports for every command
 * response. Never exposes cache names, descriptors, client ids, or other
 * controller internals.
 */
export type AppUpdateSnapshot = {
  /** Current update mode. */
  mode: UpdateMode;
  /** The currently active release. */
  activeRelease: ReleaseRef;
  /** The latest release discovered by a check, with display metadata, if any. */
  latestRelease?: ReleaseSummary | undefined;
  /** An approved release waiting for the next clean launch, with display metadata, if any. */
  scheduledRelease?: ReleaseSummary | undefined;
  /** The single most recent release that failed clean-launch activation and was rolled back, with display metadata, if any. Remains visible until cleared by a successful retry or superseded by a newer discovery. */
  failedRelease?: ReleaseSummary | undefined;
  /** ISO timestamp of the last successful discovery check, if any. */
  lastSuccessfulCheckAt?: string | undefined;
  /** An error to report for this response, if any. */
  error?: AppUpdateErrorCode | undefined;
};

/** Private worker protocol request messages. Never imported by UI-facing layers directly. */
export type AppUpdateWorkerRequest =
  | { type: 'GET_SNAPSHOT' }
  | { type: 'CHECK_FOR_UPDATES' }
  | { type: 'SET_MODE'; mode: UpdateMode }
  | { type: 'INSTALL_ON_NEXT_LAUNCH' }
  | { type: 'CANCEL_SCHEDULED_UPDATE' }
  | { type: typeof APP_UPDATE_PROTOCOL_MESSAGE_TYPES.BOOT_OK; releaseId: string }
  | { type: typeof APP_UPDATE_PROTOCOL_MESSAGE_TYPES.BOOT_FAILED; releaseId: string }
  | { type: typeof APP_UPDATE_PROTOCOL_MESSAGE_TYPES.GET_ACTIVATION_STATUS; releaseId: string };

/** Private worker protocol response message: every command resolves with the resulting snapshot. */
export type AppUpdateWorkerResponse = {
  /** The resulting snapshot after handling the request. */
  snapshot: AppUpdateSnapshot;
};

/**
 * Private worker protocol response to `BOOT_OK`/`BOOT_FAILED`, acknowledging
 * exactly what the worker durably persisted (or failed to). The watchdog
 * only disables its own error handlers and deadline timer on a `committed`
 * or `rolled-back` outcome — never merely because the message was sent.
 */
export type AppUpdateBootAckResponse = {
  /** The resulting snapshot after handling the request. */
  snapshot: AppUpdateSnapshot;
  /** What the worker durably did with this acknowledgement. */
  ack: BootAckOutcome;
};

/**
 * Private worker protocol response to `GET_ACTIVATION_STATUS`, used only by
 * the publisher-injected boot watchdog to know whether — and until when —
 * to arm its own boot-confirmation deadline for its exact release.
 */
export type ActivationStatusResponse =
  | { isActivationTarget: true; deadlineAt: string }
  | { isActivationTarget: false };

/** Broadcast the worker sends to every same-channel activation window on a boot failure. */
export type AppUpdateRollbackBroadcast = {
  /** Discriminant tag for this broadcast message. */
  type: typeof APP_UPDATE_PROTOCOL_MESSAGE_TYPES.ROLLBACK_BROADCAST;
  /** The release id that failed to boot and was rolled back. */
  releaseId: string;
};

/**
 * Private invalidation-only broadcast the worker sends to every same-channel
 * window after a background state change (a scheduled discovery check with
 * no foreground requester waiting on a response). Never carries a duplicate
 * snapshot — a receiving client must re-fetch through `GET_SNAPSHOT`.
 */
export type AppUpdateStateChangedBroadcast = {
  /** Discriminant tag for this broadcast message. */
  type: typeof APP_UPDATE_PROTOCOL_MESSAGE_TYPES.STATE_CHANGED_BROADCAST;
};
