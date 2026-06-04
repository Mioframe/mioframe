import type { SanitizedDiagnosticError } from '@shared/lib/diagnostics';
import {
  DiagnosticClassification,
  DiagnosticResult,
  DiagnosticSeverity,
  reportDiagnosticEvent,
} from '@shared/lib/diagnostics';

const PROVIDER_TAGS = { provider: 'webFileSystem' } as const;

/**
 * Emits a diagnostic event when a write-access recovery attempt finds no pending request.
 * This indicates the request was already consumed or was never registered (stale state).
 * @param root0 - Event options (attemptId).
 */
export const reportWriteAccessMissingRequest = ({ attemptId }: { attemptId: string }): void => {
  reportDiagnosticEvent({
    name: 'writeAccessRecovery.missingRequest',
    severity: DiagnosticSeverity.Warning,
    result: DiagnosticResult.Stale,
    classification: DiagnosticClassification.Access,
    attemptId,
    safeTags: { ...PROVIDER_TAGS, operation: 'requestAccess' },
  });
};

/**
 * Emits a diagnostic event when a write-access recovery attempt reaches the resolve stage
 * but the request has disappeared by the time the service responds (stale request).
 * @param root0 - Event options (attemptId).
 */
export const reportWriteAccessStaleResolve = ({ attemptId }: { attemptId: string }): void => {
  reportDiagnosticEvent({
    name: 'writeAccessRecovery.staleResolve',
    severity: DiagnosticSeverity.Warning,
    result: DiagnosticResult.Stale,
    classification: DiagnosticClassification.Access,
    attemptId,
    safeTags: { ...PROVIDER_TAGS, operation: 'resolveAccessRequest' },
  });
};

/**
 * Emits a diagnostic event when the user denies write permission during a recovery attempt.
 * @param root0 - Event options (attemptId).
 */
export const reportWriteAccessPermissionDenied = ({ attemptId }: { attemptId: string }): void => {
  reportDiagnosticEvent({
    name: 'writeAccessRecovery.permissionDenied',
    severity: DiagnosticSeverity.Warning,
    result: DiagnosticResult.Denied,
    classification: DiagnosticClassification.Access,
    attemptId,
    safeTags: { ...PROVIDER_TAGS, operation: 'resolveAccessRequest' },
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
  reportDiagnosticEvent({
    name: 'writeAccessRecovery.providerFailure',
    severity: DiagnosticSeverity.Error,
    result: DiagnosticResult.Failed,
    classification: DiagnosticClassification.Provider,
    attemptId,
    error,
    safeTags: { ...PROVIDER_TAGS, operation: 'requestAccess' },
  });
};

/**
 * Emits a diagnostic event when write access was granted but pending saves could not be
 * replayed — the replay reported still-blocked or partial failures.
 * @param root0 - Event options (attemptId).
 */
export const reportWriteAccessReplayFailure = ({ attemptId }: { attemptId: string }): void => {
  reportDiagnosticEvent({
    name: 'writeAccessRecovery.replayStillBlocked',
    severity: DiagnosticSeverity.Error,
    result: DiagnosticResult.Failed,
    classification: DiagnosticClassification.Storage,
    attemptId,
    safeTags: { ...PROVIDER_TAGS, operation: 'resolveAccessRequest' },
  });
};

/**
 * Emits a diagnostic event when write access was granted but replay hit a storage failure
 * (the underlying store returned an error, not just a blocked state).
 * @param root0 - Event options (attemptId).
 */
export const reportWriteAccessStorageFailure = ({ attemptId }: { attemptId: string }): void => {
  reportDiagnosticEvent({
    name: 'writeAccessRecovery.replayStorageFailure',
    severity: DiagnosticSeverity.Error,
    result: DiagnosticResult.Failed,
    classification: DiagnosticClassification.Storage,
    attemptId,
    safeTags: { ...PROVIDER_TAGS, operation: 'resolveAccessRequest' },
  });
};
