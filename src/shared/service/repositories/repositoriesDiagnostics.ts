import {
  DiagnosticClassification,
  DiagnosticResult,
  DiagnosticSeverity,
  addTechnicalBreadcrumb,
  reportDiagnosticEvent,
  sanitizeDiagnosticError,
} from '@shared/lib/diagnostics';
import type { SanitizedDiagnosticError } from '@shared/lib/diagnostics';
import type { RetryingStorageAdapterFailureClassification } from '@shared/lib/automergeAdapter';

const REPLAY_TAGS = { provider: 'webFileSystem', operation: 'flushPendingSaves' } as const;
const SAVE_TAGS = { provider: 'webFileSystem', operation: 'repositorySave' } as const;
const REMOVE_TAGS = { provider: 'webFileSystem', operation: 'repositoryRemove' } as const;
const CLEANUP_TAGS = {
  provider: 'webFileSystem',
  operation: 'repositoryDeleteCleanup',
} as const;

const addRepositoryBreadcrumb = ({
  level = 'info',
  message,
  ...data
}: {
  classification?: string | undefined;
  errorClass?: string | undefined;
  errorClassification?: string | undefined;
  failureClassification?: string | undefined;
  flushedCount?: number | undefined;
  level?: 'debug' | 'info' | 'warning' | 'error' | undefined;
  message: string;
  operation: string;
  pendingCount?: number | undefined;
  provider?: string | undefined;
  result?: string | undefined;
  storageOperation?: string | undefined;
}): void => {
  addTechnicalBreadcrumb({
    category: 'repository.storage',
    data: {
      provider: data.provider ?? 'webFileSystem',
      operation: data.operation,
      ...(data.storageOperation !== undefined ? { storageOperation: data.storageOperation } : {}),
      ...(data.pendingCount !== undefined ? { pendingCount: data.pendingCount } : {}),
      ...(data.flushedCount !== undefined ? { flushedCount: data.flushedCount } : {}),
      ...(data.failureClassification !== undefined
        ? { failureClassification: data.failureClassification }
        : {}),
      ...(data.errorClass !== undefined ? { errorClass: data.errorClass } : {}),
      ...(data.errorClassification !== undefined
        ? { errorClassification: data.errorClassification }
        : {}),
      ...(data.classification !== undefined ? { classification: data.classification } : {}),
      ...(data.result !== undefined ? { result: data.result } : {}),
    },
    level,
    message,
  });
};

const classificationFromSanitizedError = (
  error: SanitizedDiagnosticError,
): DiagnosticClassification => {
  switch (error.errorClassification) {
    case 'accessDenied':
      return DiagnosticClassification.Access;
    case 'browserFileStateChanged':
    case 'storageFailure':
      return DiagnosticClassification.Storage;
    case 'notFound':
      return DiagnosticClassification.Storage;
    default:
      return DiagnosticClassification.Unknown;
  }
};

/**
 * Emits a diagnostic event when pending repository saves remain blocked after a write-access
 * recovery flush attempt.
 * @param root0 - Event options (flushedCount, pendingCount).
 */
export const reportWriteAccessReplayStillBlocked = ({
  flushedCount,
  pendingCount,
}: {
  flushedCount: number;
  pendingCount: number;
}): void => {
  reportDiagnosticEvent({
    name: 'writeAccessRecovery.repositoryReplayStillBlocked',
    severity: DiagnosticSeverity.Error,
    result: DiagnosticResult.Blocked,
    classification: DiagnosticClassification.Access,
    counters: { flushedCount, pendingCount },
    safeTags: { ...REPLAY_TAGS, failureClassification: 'accessRequired' },
  });
};

/**
 * Emits a diagnostic event when pending repository saves fail with a storage error during a
 * write-access recovery flush attempt.
 * @param root0 - Event options (flushedCount, pendingCount, failureClassification).
 */
export const reportWriteAccessReplayStorageFailure = ({
  error,
  flushedCount,
  pendingCount,
  failureClassification,
}: {
  error?: SanitizedDiagnosticError | undefined;
  flushedCount: number;
  pendingCount: number;
  failureClassification?: RetryingStorageAdapterFailureClassification | undefined;
}): void => {
  const safeClassification: RetryingStorageAdapterFailureClassification =
    failureClassification ?? 'unknown';
  reportDiagnosticEvent({
    name: 'writeAccessRecovery.repositoryReplayStorageFailure',
    severity: DiagnosticSeverity.Error,
    result: DiagnosticResult.Failed,
    classification:
      safeClassification === 'accessRequired'
        ? DiagnosticClassification.Access
        : safeClassification === 'storageFailure' ||
            safeClassification === 'browserFileStateChanged'
          ? DiagnosticClassification.Storage
          : DiagnosticClassification.Unknown,
    counters: { flushedCount, pendingCount },
    ...(error !== undefined ? { error } : {}),
    safeTags: { ...REPLAY_TAGS, failureClassification: safeClassification },
  });
};

/**
 * Emits a diagnostic event when a primary repository save fails and is queued for retry.
 * @param root0 - Event options (pendingCount).
 */
export const reportRepositorySaveQueued = ({ pendingCount }: { pendingCount: number }): void => {
  reportDiagnosticEvent({
    name: 'repositoryStorage.saveQueued',
    severity: DiagnosticSeverity.Warning,
    result: DiagnosticResult.Blocked,
    classification: DiagnosticClassification.Access,
    counters: { pendingCount },
    safeTags: { ...SAVE_TAGS, failureClassification: 'accessRequired' },
  });
};

/**
 * Emits a diagnostic event when a primary repository save fails and is NOT queued for retry.
 * @param root0 - Event options (pendingCount, caughtError).
 */
export const reportRepositorySaveFailed = ({
  failureClassification,
  pendingCount,
  caughtError,
}: {
  failureClassification?: RetryingStorageAdapterFailureClassification | undefined;
  pendingCount: number;
  caughtError: unknown;
}): void => {
  const error = sanitizeDiagnosticError(caughtError);
  const safeFailureClassification =
    failureClassification ??
    (error.errorClassification === 'browserFileStateChanged'
      ? 'browserFileStateChanged'
      : 'storageFailure');
  reportDiagnosticEvent({
    name: 'repositoryStorage.saveFailed',
    severity: DiagnosticSeverity.Error,
    result: DiagnosticResult.Failed,
    classification: DiagnosticClassification.Storage,
    counters: { pendingCount },
    error,
    safeTags: { ...SAVE_TAGS, failureClassification: safeFailureClassification },
  });
};

/**
 * Emits a diagnostic event when a repository storage remove (single key) fails.
 * Distinguishes access-required failures from hard storage errors.
 * @param root0 - Event options (caughtError).
 */
export const reportRepositoryRemoveFailed = ({ caughtError }: { caughtError: unknown }): void => {
  const error = sanitizeDiagnosticError(caughtError);
  const classification = classificationFromSanitizedError(error);
  const failureClassification =
    classification === DiagnosticClassification.Access ? 'accessRequired' : 'storageFailure';
  reportDiagnosticEvent({
    name: 'repositoryStorage.removeFailed',
    severity: DiagnosticSeverity.Error,
    result: DiagnosticResult.Failed,
    classification,
    error,
    safeTags: { ...REMOVE_TAGS, failureClassification },
  });
};

/**
 * Emits a diagnostic event when repository document cleanup (post-delete storage file removal)
 * fails. This covers failures outside the retryable save queue — notably VFS delete failures
 * caused by access-required or hard storage errors during document cleanup.
 * @param root0 - Event options (caughtError).
 */
export const reportRepositoryDeleteCleanupFailed = ({
  caughtError,
}: {
  caughtError: unknown;
}): void => {
  const error = sanitizeDiagnosticError(caughtError);
  const classification = classificationFromSanitizedError(error);
  const failureClassification =
    classification === DiagnosticClassification.Access ? 'accessRequired' : 'storageFailure';

  reportDiagnosticEvent({
    name: 'repositoryStorage.deleteCleanupFailed',
    severity: DiagnosticSeverity.Error,
    result: DiagnosticResult.Failed,
    classification,
    error,
    safeTags: { ...CLEANUP_TAGS, failureClassification },
  });
};

/**
 * Adds a breadcrumb when a repository save attempt starts.
 */
export const addRepositorySaveAttemptBreadcrumb = (): void => {
  addRepositoryBreadcrumb({
    message: 'repository save started',
    operation: 'repositorySave',
  });
};

/**
 * Adds a breadcrumb when a pending-save replay starts.
 * @param root0 - Safe replay counters at the start of the replay.
 */
export const addRepositoryReplayStartedBreadcrumb = ({
  pendingCount,
}: {
  pendingCount: number;
}): void => {
  addRepositoryBreadcrumb({
    message: 'pending save replay started',
    operation: 'flushPendingSaves',
    pendingCount,
  });
};

/**
 * Adds a breadcrumb when a pending-save replay completes successfully.
 * @param root0 - Aggregate replay counters after completion.
 */
export const addRepositoryReplayCompletedBreadcrumb = ({
  flushedCount,
  pendingCount,
}: {
  flushedCount: number;
  pendingCount: number;
}): void => {
  addRepositoryBreadcrumb({
    flushedCount,
    message: 'pending save replay completed',
    operation: 'flushPendingSaves',
    pendingCount,
    result: 'success',
  });
};

/**
 * Adds a breadcrumb when repository storage removal starts.
 */
export const addRepositoryRemoveStartBreadcrumb = (): void => {
  addRepositoryBreadcrumb({
    message: 'repository remove started',
    operation: 'repositoryRemove',
    storageOperation: 'removeRange',
  });
};
