import type { ReleaseRef, UpdateMode } from './contracts';

/** Stable public error codes the worker may report back to the UI. Defined next to this boundary. */
export const APP_UPDATE_ERROR_CODES = ['check-failed', 'install-failed', 'unavailable'] as const;
/** One of {@link APP_UPDATE_ERROR_CODES}. */
export type AppUpdateErrorCode = (typeof APP_UPDATE_ERROR_CODES)[number];

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
  /** The latest release discovered by a check, if any. */
  latestRelease?: ReleaseRef | undefined;
  /** An approved release waiting for the next clean launch, if any. */
  scheduledRelease?: ReleaseRef | undefined;
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
  | { type: 'BOOT_OK'; releaseId: string }
  | { type: 'BOOT_FAILED'; releaseId: string }
  | { type: 'GET_ACTIVATION_STATUS'; releaseId: string };

/** Private worker protocol response message: every command resolves with the resulting snapshot. */
export type AppUpdateWorkerResponse = {
  /** The resulting snapshot after handling the request. */
  snapshot: AppUpdateSnapshot;
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
  type: 'APP_UPDATE_ROLLBACK';
  /** The release id that failed to boot and was rolled back. */
  releaseId: string;
};
