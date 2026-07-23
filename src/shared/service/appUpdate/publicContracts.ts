/** Stable release facts safe for presentation layers. */
export type AppReleaseInfo = {
  /** Immutable full-SHA release identifier. */
  releaseId: string;
  /** Publisher-allocated forward-only release order. */
  releaseSequence: number;
  /** User-facing application version. */
  appVersion: string;
  /** Short build identifier. */
  buildId: string;
  /** ISO build timestamp. */
  buildDate: string;
};

/** User-selectable managed-update behavior. */
export type AppUpdateMode = 'automatic' | 'manual';

/** Stable error categories that presentation code may explain. */
export type AppUpdatePublicErrorCode =
  | 'capabilityUnavailable'
  | 'storageUnavailable'
  | 'checkFailed'
  | 'invalidReleaseMetadata'
  | 'preparationFailed'
  | 'restartBusy'
  | 'restartUnresponsive';

/** Factual, UI-safe projection of managed stable-update state. */
export type AppUpdateSnapshot = {
  /** Whether the stable controller can provide managed updates in this session. */
  capability: 'available' | 'unavailable';
  /** Persisted update-selection mode. */
  mode: AppUpdateMode;
  /** Release whose application code is executing in this window. */
  runningRelease?: AppReleaseInfo;
  /** Persisted Manual-mode release selection, when applicable. */
  pinnedRelease?: AppReleaseInfo;
  /** Most recent valid non-regressing latest release fact. */
  latestRelease?: AppReleaseInfo;
  /** Persisted metadata-check progress or result. */
  checkState: 'notChecked' | 'checking' | 'succeeded' | 'failed';
  /** Persisted release-preparation progress or result. */
  preparationState: 'idle' | 'preparing' | 'ready' | 'failed';
  /** Persisted coordinated-activation progress or blocker. */
  activationState:
    | 'idle'
    | 'waitingForSafeLaunch'
    | 'blockedByActivity'
    | 'blockedByWindow'
    | 'restarting';
  /** ISO time of the last successful metadata check. */
  lastSuccessfulCheckAt?: string;
  /** Stable public explanation category for the latest failure or blocker. */
  errorCode?: AppUpdatePublicErrorCode;
};

/** Immediate acknowledgement returned by a high-level update action. */
export type AppUpdateActionResult =
  | { /** Action was durably accepted. */ status: 'accepted' }
  | {
      /** Action could not proceed until stable windows become ready. */
      status: 'blocked';
      /** Stable restart blocker category. */
      code: 'restartBusy' | 'restartUnresponsive';
    }
  | {
      /** Action failed before it could be accepted. */
      status: 'error';
      /** Stable public failure category. */
      code: AppUpdatePublicErrorCode;
    };
