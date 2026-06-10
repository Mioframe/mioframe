import type {
  DiagnosticClassification,
  DiagnosticResult,
  DiagnosticSeverity,
} from './diagnosticEnums';

/**
 * Project-controlled primitive tags attached to a diagnostic event.
 * Keys and values must be project-controlled strings — no paths, ids, names, URLs, or user data.
 */
export type DiagnosticSafeTags = Record<string, string>;

/**
 * Safe counters allowed in a diagnostic event.
 * Do not add storage keys, document ids, byte counts, or any user-controlled values.
 */
export interface DiagnosticCounters {
  /** Number of pending saves or items awaiting processing. */
  pendingCount?: number;
  /** Number of items that failed during the operation. */
  failedCount?: number;
  /** Number of items successfully flushed or processed. */
  flushedCount?: number;
}

/**
 * Typed structured diagnostic event.
 *
 * All fields must be safe to send to external diagnostics backends.
 * Do not add paths, file names, document names, document ids, storage keys, URLs,
 * handles, raw external messages, raw causes, document contents, or bytes.
 *
 * Use `name` to identify the event (e.g. `'writeAccessRecovery.permissionDenied'`).
 * Attach flow-specific context through `safeTags` with project-controlled primitive values only.
 * For actual exceptions with stack traces, use `captureDiagnosticException` instead.
 */
export interface DiagnosticEvent {
  /**
   * Project-controlled event name. Use dot-separated namespacing.
   * Must be a stable project-controlled string constant — not derived from user data.
   */
  name: string;
  /** How severe the event is. */
  severity: DiagnosticSeverity;
  /** Observed outcome at the emitting stage. */
  result: DiagnosticResult;
  /** Safe classification of the root cause. */
  classification: DiagnosticClassification;
  /** Optional attempt or request id — must be project-generated, never derived from user data. */
  attemptId?: string;
  /** Optional safe numeric counters. */
  counters?: DiagnosticCounters;
  /**
   * Optional project-controlled primitive tags for additional safe context.
   * All keys and values must be project-controlled — no paths, ids, names, URLs, or user data.
   */
  safeTags?: DiagnosticSafeTags;
}
