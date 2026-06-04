/**
 * Severity levels for structured diagnostic events.
 * Use `info` for normal-path observations, `warning` for degraded states, `error` for failures,
 * and `fatal` for data-loss-risk or unrecoverable failures.
 */
export const DiagnosticSeverity = {
  info: 'info',
  warning: 'warning',
  error: 'error',
  fatal: 'fatal',
} as const;

/** Union of allowed `DiagnosticSeverity` values. */
export type DiagnosticSeverity = (typeof DiagnosticSeverity)[keyof typeof DiagnosticSeverity];

/**
 * Feature areas that may emit diagnostic events.
 * Extend this enum when a new feature requires instrumentation.
 */
export const DiagnosticFeature = {
  writeAccessRecovery: 'writeAccessRecovery',
} as const;

/** Union of allowed `DiagnosticFeature` values. */
export type DiagnosticFeature = (typeof DiagnosticFeature)[keyof typeof DiagnosticFeature];

/**
 * Named operations within a feature that can emit diagnostic events.
 */
export const DiagnosticOperation = {
  requestAccess: 'requestAccess',
  resolveAccessRequest: 'resolveAccessRequest',
  flushPendingSaves: 'flushPendingSaves',
} as const;

/** Union of allowed `DiagnosticOperation` values. */
export type DiagnosticOperation = (typeof DiagnosticOperation)[keyof typeof DiagnosticOperation];

/**
 * Stage within an operation where the diagnostic event was emitted.
 */
export const DiagnosticStage = {
  accessRequestPrepare: 'accessRequestPrepare',
  accessRequestResolved: 'accessRequestResolved',
  pendingSaveReplay: 'pendingSaveReplay',
} as const;

/** Union of allowed `DiagnosticStage` values. */
export type DiagnosticStage = (typeof DiagnosticStage)[keyof typeof DiagnosticStage];

/**
 * Observed outcome at the emitting stage.
 */
export const DiagnosticResult = {
  staleRequest: 'staleRequest',
  permissionDenied: 'permissionDenied',
  permissionGranted: 'permissionGranted',
  stillBlocked: 'stillBlocked',
  storageFailure: 'storageFailure',
  replayFailure: 'replayFailure',
  providerFailure: 'providerFailure',
  unknown: 'unknown',
} as const;

/** Union of allowed `DiagnosticResult` values. */
export type DiagnosticResult = (typeof DiagnosticResult)[keyof typeof DiagnosticResult];

/**
 * Safe classification of the root cause.
 * Used to identify whether the failure stems from access policy, storage, or an unknown cause.
 */
export const DiagnosticClassification = {
  staleRequest: 'staleRequest',
  accessDenied: 'accessDenied',
  accessBlocked: 'accessBlocked',
  storageFailure: 'storageFailure',
  providerFailure: 'providerFailure',
  unknown: 'unknown',
} as const;

/** Union of allowed `DiagnosticClassification` values. */
export type DiagnosticClassification =
  (typeof DiagnosticClassification)[keyof typeof DiagnosticClassification];

/**
 * Provider kinds that may be attached to a diagnostic event.
 * Extend this enum when a new provider requires instrumentation.
 * Do not use free-form strings — all values must be project-controlled.
 */
export const DiagnosticProviderKind = {
  webFileSystem: 'webFileSystem',
} as const;

/** Union of allowed `DiagnosticProviderKind` values. */
export type DiagnosticProviderKind =
  (typeof DiagnosticProviderKind)[keyof typeof DiagnosticProviderKind];
