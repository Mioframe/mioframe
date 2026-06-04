import {
  DiagnosticClassification,
  DiagnosticResult,
  DiagnosticSeverity,
  reportDiagnosticEvent,
} from '@shared/lib/diagnostics';
import type { RetryingStorageAdapterFailureClassification } from '@shared/lib/automergeAdapter';

const REPLAY_TAGS = { provider: 'webFileSystem', operation: 'flushPendingSaves' } as const;

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
    name: 'writeAccessRecovery.replayStillBlocked',
    severity: DiagnosticSeverity.Error,
    result: DiagnosticResult.Blocked,
    classification: DiagnosticClassification.Access,
    counters: { flushedCount, pendingCount },
    safeTags: REPLAY_TAGS,
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
  reportDiagnosticEvent({
    name: 'writeAccessRecovery.replayStorageFailure',
    severity: DiagnosticSeverity.Error,
    result: DiagnosticResult.Failed,
    classification:
      failureClassification === 'accessRequired'
        ? DiagnosticClassification.Access
        : failureClassification === 'storageFailure'
          ? DiagnosticClassification.Storage
          : DiagnosticClassification.Unknown,
    counters: { flushedCount, pendingCount },
    safeTags: REPLAY_TAGS,
  });
};
