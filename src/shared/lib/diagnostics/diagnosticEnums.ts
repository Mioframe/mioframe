/**
 * Severity levels for structured diagnostic events.
 * Use `Info` for normal-path observations, `Warning` for degraded states, `Error` for failures,
 * and `Fatal` for data-loss-risk or unrecoverable failures.
 */
export enum DiagnosticSeverity {
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
  Fatal = 'fatal',
}

/**
 * Feature areas that may emit diagnostic events.
 * Extend this enum when a new feature requires instrumentation.
 */
export enum DiagnosticFeature {
  WriteAccessRecovery = 'writeAccessRecovery',
}

/**
 * Named operations within a feature that can emit diagnostic events.
 */
export enum DiagnosticOperation {
  RequestAccess = 'requestAccess',
  ResolveAccessRequest = 'resolveAccessRequest',
  FlushPendingSaves = 'flushPendingSaves',
}

/**
 * Stage within an operation where the diagnostic event was emitted.
 */
export enum DiagnosticStage {
  AccessRequestPrepare = 'accessRequestPrepare',
  AccessRequestResolved = 'accessRequestResolved',
  PendingSaveReplay = 'pendingSaveReplay',
}

/**
 * Observed outcome at the emitting stage.
 */
export enum DiagnosticResult {
  StaleRequest = 'staleRequest',
  PermissionDenied = 'permissionDenied',
  PermissionGranted = 'permissionGranted',
  StillBlocked = 'stillBlocked',
  StorageFailure = 'storageFailure',
  ReplayFailure = 'replayFailure',
  ProviderFailure = 'providerFailure',
  Unknown = 'unknown',
}

/**
 * Safe classification of the root cause.
 * Used to identify whether the failure stems from access policy, storage, or an unknown cause.
 */
export enum DiagnosticClassification {
  StaleRequest = 'staleRequest',
  AccessDenied = 'accessDenied',
  AccessBlocked = 'accessBlocked',
  StorageFailure = 'storageFailure',
  ProviderFailure = 'providerFailure',
  Unknown = 'unknown',
}

/**
 * Provider kinds that may be attached to a diagnostic event.
 * Extend this enum when a new provider requires instrumentation.
 * Do not use free-form strings — all values must be project-controlled.
 */
export enum DiagnosticProviderKind {
  WebFileSystem = 'webFileSystem',
}
