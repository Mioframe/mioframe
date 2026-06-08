import {
  DiagnosticClassification,
  DiagnosticResult,
  DiagnosticSeverity,
  reportDiagnosticEvent,
  sanitizeDiagnosticError,
} from '@shared/lib/diagnostics';
import type { SanitizedDiagnosticError } from '@shared/lib/diagnostics';
import type { RetryingStorageAdapterFailureClassification } from '@shared/lib/automergeAdapter';

const REPLAY_TAGS = { provider: 'webFileSystem', operation: 'flushPendingSaves' } as const;
const SAVE_TAGS = { provider: 'webFileSystem', operation: 'repositorySave' } as const;

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
