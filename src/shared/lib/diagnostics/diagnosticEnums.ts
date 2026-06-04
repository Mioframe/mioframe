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
 * Observed outcome at the emitting stage.
 *
 * Use `Success` for completed operations, `Failed` for generic failures,
 * `Blocked` for still-blocked states after a recovery attempt,
 * `Denied` for permission or access denials, `Stale` for outdated or missing requests,
 * and `Unknown` for unclassified outcomes.
 */
export enum DiagnosticResult {
  Success = 'success',
  Failed = 'failed',
  Blocked = 'blocked',
  Denied = 'denied',
  Stale = 'stale',
  Unknown = 'unknown',
}

/**
 * Safe classification of the root cause.
 * Used to identify whether the failure stems from access policy, storage, provider, data
 * consistency, an unexpected internal condition, or an unknown cause.
 */
export enum DiagnosticClassification {
  Access = 'access',
  Storage = 'storage',
  Provider = 'provider',
  Consistency = 'consistency',
  Unexpected = 'unexpected',
  Unknown = 'unknown',
}
