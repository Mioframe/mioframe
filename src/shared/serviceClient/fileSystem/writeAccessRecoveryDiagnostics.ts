import type { SanitizedDiagnosticError } from '@shared/lib/diagnostics';
import {
  DiagnosticClassification,
  DiagnosticResult,
  DiagnosticSeverity,
  reportDiagnosticEvent,
} from '@shared/lib/diagnostics';
import type { DiagnosticEvent } from '@shared/lib/diagnostics';

/**
 * Safe replay summary forwarded from a write recovery handler to broker-side diagnostics.
 * Only safe project-controlled counters and a classification enum — no paths, ids, or errors.
 */
export interface BrokerReplaySummary {
  /** Number of saves successfully written during the replay attempt. */
  flushedCount: number;
  /** Number of saves still queued after the replay attempt. */
  pendingCount: number;
  /** Safe classification of the first failure, when available. */
  failureClassification?: 'accessRequired' | 'storageFailure' | 'unknown' | undefined;
}

const PROVIDER = 'webFileSystem' as const;

type WebFsEventParams = Omit<DiagnosticEvent, 'safeTags'> & { operation: string };

const reportWebFsEvent = ({ operation, ...rest }: WebFsEventParams): void => {
  reportDiagnosticEvent({
    ...rest,
    safeTags: { provider: PROVIDER, operation },
  });
};

/**
 * Emits a diagnostic event when a write-access recovery attempt finds no pending request.
 * This indicates the request was already consumed or was never registered (stale state).
 * @param root0 - Event options (attemptId).
 */
export const reportWriteAccessMissingRequest = ({ attemptId }: { attemptId: string }): void => {
  reportWebFsEvent({
    name: 'writeAccessRecovery.missingRequest',
    severity: DiagnosticSeverity.Warning,
    result: DiagnosticResult.Stale,
    classification: DiagnosticClassification.Access,
    attemptId,
    operation: 'requestAccess',
  });
};

/**
 * Emits a diagnostic event when a write-access recovery attempt reaches the resolve stage
 * but the request has disappeared by the time the service responds (stale request).
 * @param root0 - Event options (attemptId).
 */
export const reportWriteAccessStaleResolve = ({ attemptId }: { attemptId: string }): void => {
  reportWebFsEvent({
    name: 'writeAccessRecovery.staleResolve',
    severity: DiagnosticSeverity.Warning,
    result: DiagnosticResult.Stale,
    classification: DiagnosticClassification.Access,
    attemptId,
    operation: 'resolveAccessRequest',
  });
};

/**
 * Emits a diagnostic event when the user denies write permission during a recovery attempt.
 * @param root0 - Event options (attemptId).
 */
export const reportWriteAccessPermissionDenied = ({ attemptId }: { attemptId: string }): void => {
  reportWebFsEvent({
    name: 'writeAccessRecovery.permissionDenied',
    severity: DiagnosticSeverity.Warning,
    result: DiagnosticResult.Denied,
    classification: DiagnosticClassification.Access,
    attemptId,
    operation: 'resolveAccessRequest',
  });
};

/**
 * Emits a diagnostic event when the provider (browser File System Access API) throws unexpectedly
 * during a write-access recovery attempt.
 * @param root0 - Event options (attemptId, error).
 */
export const reportWriteAccessProviderFailure = ({
  attemptId,
  error,
}: {
  attemptId: string;
  error: SanitizedDiagnosticError;
}): void => {
  reportWebFsEvent({
    name: 'writeAccessRecovery.providerFailure',
    severity: DiagnosticSeverity.Error,
    result: DiagnosticResult.Failed,
    classification: DiagnosticClassification.Provider,
    attemptId,
    error,
    operation: 'requestAccess',
  });
};

/**
 * Emits a diagnostic event when write access was granted but pending saves could not be
 * replayed — the replay reported still-blocked or partial failures (service-client side).
 * @param root0 - Event options (attemptId, replay).
 */
export const reportWriteAccessReplayFailure = ({
  attemptId,
  replay,
}: {
  attemptId: string;
  replay?: BrokerReplaySummary | undefined;
}): void => {
  reportWebFsEvent({
    name: 'writeAccessRecovery.grantReplayStillBlocked',
    severity: DiagnosticSeverity.Error,
    result: DiagnosticResult.Blocked,
    classification: DiagnosticClassification.Access,
    attemptId,
    operation: 'resolveAccessRequest',
    ...(replay !== undefined
      ? { counters: { flushedCount: replay.flushedCount, pendingCount: replay.pendingCount } }
      : {}),
  });
};

/**
 * Emits a diagnostic event when write access was granted but replay hit a storage failure
 * (the underlying store returned an error, not just a blocked state) — service-client side.
 * @param root0 - Event options (attemptId, replay).
 */
export const reportWriteAccessStorageFailure = ({
  attemptId,
  replay,
}: {
  attemptId: string;
  replay?: BrokerReplaySummary | undefined;
}): void => {
  const classification =
    replay?.failureClassification === 'accessRequired'
      ? DiagnosticClassification.Access
      : replay?.failureClassification === 'unknown'
        ? DiagnosticClassification.Unknown
        : replay?.failureClassification === 'storageFailure'
          ? DiagnosticClassification.Storage
          : DiagnosticClassification.Storage;

  reportWebFsEvent({
    name: 'writeAccessRecovery.grantReplayStorageFailure',
    severity: DiagnosticSeverity.Error,
    result: DiagnosticResult.Failed,
    classification,
    attemptId,
    operation: 'resolveAccessRequest',
    ...(replay !== undefined
      ? { counters: { flushedCount: replay.flushedCount, pendingCount: replay.pendingCount } }
      : {}),
  });
};
