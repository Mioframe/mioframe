import type { SanitizedDiagnosticError } from '@shared/lib/diagnostics';
import {
  DiagnosticClassification,
  DiagnosticResult,
  DiagnosticSeverity,
  addTechnicalBreadcrumb,
  reportDiagnosticEvent,
} from '@shared/lib/diagnostics';
import type { DiagnosticEvent } from '@shared/lib/diagnostics';

/**
 * Safe handle comparison summary forwarded from the service after permission grant.
 * Contains only booleans and project-controlled status enums.
 */
export interface WriteAccessRecoveryHandleComparison {
  /** Safe result of comparing stored and returned handles. */
  handleComparisonResult: 'differentEntry' | 'notCompared' | 'queryFailed' | 'sameEntry';
  /** Safe readwrite permission status of the returned main-thread handle. */
  returnedHandlePermission: 'denied' | 'granted' | 'prompt' | 'queryFailed' | 'unsupported';
  /** Whether the broker returned a granted handle to the service. */
  returnedHandleProvided: 'false' | 'true';
  /** Safe same-entry status, or `unknown` when `isSameEntry()` failed. */
  returnedHandleSameEntry: 'false' | 'true' | 'unknown';
  /** Safe readwrite permission status of the stored worker-side handle. */
  storedHandlePermission: 'denied' | 'granted' | 'prompt' | 'queryFailed' | 'unsupported';
}

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
  /** Safe sanitized summary of the first replay failure when available. */
  error?: SanitizedDiagnosticError | undefined;
}

const PROVIDER = 'webFileSystem' as const;

const addWriteAccessBreadcrumb = ({
  level = 'info',
  message,
  ...data
}: {
  errorClass?: string | undefined;
  errorClassification?: string | undefined;
  failureClassification?: string | undefined;
  flushedCount?: number | undefined;
  level?: 'debug' | 'info' | 'warning' | 'error' | undefined;
  message: string;
  operation: string;
  pendingCount?: number | undefined;
  result?: string | undefined;
}): void => {
  addTechnicalBreadcrumb({
    category: 'writeAccessRecovery',
    data: {
      provider: PROVIDER,
      operation: data.operation,
      ...(data.pendingCount !== undefined ? { pendingCount: data.pendingCount } : {}),
      ...(data.flushedCount !== undefined ? { flushedCount: data.flushedCount } : {}),
      ...(data.failureClassification !== undefined
        ? { failureClassification: data.failureClassification }
        : {}),
      ...(data.errorClass !== undefined ? { errorClass: data.errorClass } : {}),
      ...(data.errorClassification !== undefined
        ? { errorClassification: data.errorClassification }
        : {}),
      ...(data.result !== undefined ? { result: data.result } : {}),
    },
    level,
    message,
  });
};

type WebFsEventParams = Omit<DiagnosticEvent, 'safeTags'> & {
  operation: string;
  safeTags?: Record<string, string> | undefined;
};

const reportWebFsEvent = ({ operation, safeTags, ...rest }: WebFsEventParams): void => {
  reportDiagnosticEvent({
    ...rest,
    safeTags: { provider: PROVIDER, operation, ...safeTags },
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
 * Adds a breadcrumb when write-access recovery starts.
 */
export const addWriteAccessRequestStartBreadcrumb = (): void => {
  addWriteAccessBreadcrumb({
    message: 'write access recovery started',
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
 * Adds a breadcrumb when the browser permission prompt starts.
 */
export const addWriteAccessPermissionPromptStartBreadcrumb = (): void => {
  addTechnicalBreadcrumb({
    category: 'webFileSystem.permission',
    data: {
      operation: 'requestPermission',
      provider: PROVIDER,
    },
    message: 'write permission prompt started',
  });
};

/**
 * Adds a breadcrumb with the resolved result of the write permission prompt.
 * @param root0 - Safe permission prompt result.
 */
export const addWriteAccessPermissionResolvedBreadcrumb = ({
  permissionState,
}: {
  permissionState: PermissionState;
}): void => {
  addTechnicalBreadcrumb({
    category: 'webFileSystem.permission',
    data: {
      operation: 'requestPermission',
      provider: PROVIDER,
      result: permissionState,
    },
    level: permissionState === 'denied' ? 'warning' : 'info',
    message: `write permission prompt resolved: ${permissionState}`,
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
 * Emits a diagnostic event with safe handle comparison statuses after permission grant.
 * @param root0 - Event options (attemptId, comparison).
 */
export const reportWriteAccessHandleComparison = ({
  attemptId,
  comparison,
}: {
  attemptId: string;
  comparison: WriteAccessRecoveryHandleComparison;
}): void => {
  reportWebFsEvent({
    name: 'writeAccessRecovery.handleComparison',
    severity: DiagnosticSeverity.Info,
    result: DiagnosticResult.Success,
    classification: DiagnosticClassification.Access,
    attemptId,
    operation: 'resolveAccessRequest',
    safeTags: {
      handleComparisonResult: comparison.handleComparisonResult,
      returnedHandlePermission: comparison.returnedHandlePermission,
      returnedHandleProvided: comparison.returnedHandleProvided,
      returnedHandleSameEntry: comparison.returnedHandleSameEntry,
      storedHandlePermission: comparison.storedHandlePermission,
    },
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
  const failureClassification = replay?.failureClassification ?? 'unknown';
  reportWebFsEvent({
    name: 'writeAccessRecovery.grantReplayStillBlocked',
    severity: DiagnosticSeverity.Error,
    result: DiagnosticResult.Blocked,
    classification: DiagnosticClassification.Access,
    attemptId,
    operation: 'resolveAccessRequest',
    safeTags: { failureClassification },
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
  const failureClassification = replay?.failureClassification ?? 'unknown';
  const classification =
    replay?.failureClassification === 'accessRequired'
      ? DiagnosticClassification.Access
      : replay?.failureClassification === 'unknown'
        ? DiagnosticClassification.Unknown
        : DiagnosticClassification.Storage;

  reportWebFsEvent({
    name: 'writeAccessRecovery.grantReplayStorageFailure',
    severity: DiagnosticSeverity.Error,
    result: DiagnosticResult.Failed,
    classification,
    attemptId,
    ...(replay?.error !== undefined ? { error: replay.error } : {}),
    operation: 'resolveAccessRequest',
    safeTags: { failureClassification },
    ...(replay !== undefined
      ? { counters: { flushedCount: replay.flushedCount, pendingCount: replay.pendingCount } }
      : {}),
  });
};
