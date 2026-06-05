import {
  DiagnosticClassification,
  DiagnosticResult,
  DiagnosticSeverity,
  reportDiagnosticEvent,
} from '@shared/lib/diagnostics';
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
  flushedCount,
  pendingCount,
  failureClassification,
}: {
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
        : safeClassification === 'storageFailure'
          ? DiagnosticClassification.Storage
          : DiagnosticClassification.Unknown,
    counters: { flushedCount, pendingCount },
    safeTags: { ...REPLAY_TAGS, failureClassification: safeClassification },
  });
};

/**
 * Emits a diagnostic event when a primary repository save fails and is queued for retry.
 * This event fires at the repository service boundary when the retrying storage adapter
 * queues a failed save due to a missing write-access permission.
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
 * This event fires at the repository service boundary when the retrying storage adapter
 * discards a failed save because the failure is not a recoverable access error.
 * @param root0 - Event options (pendingCount).
 */
export const reportRepositorySaveFailed = ({ pendingCount }: { pendingCount: number }): void => {
  reportDiagnosticEvent({
    name: 'repositoryStorage.saveFailed',
    severity: DiagnosticSeverity.Error,
    result: DiagnosticResult.Failed,
    classification: DiagnosticClassification.Storage,
    counters: { pendingCount },
    safeTags: { ...SAVE_TAGS, failureClassification: 'storageFailure' },
  });
};
