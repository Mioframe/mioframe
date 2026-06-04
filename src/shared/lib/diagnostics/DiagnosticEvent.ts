import type {
  DiagnosticClassification,
  DiagnosticFeature,
  DiagnosticOperation,
  DiagnosticResult,
  DiagnosticSeverity,
  DiagnosticStage,
} from './diagnosticEnums';

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
 * Safe sanitized representation of a boundary error.
 * Never contains raw error messages, paths, file names, document ids, storage keys, URLs,
 * handles, raw external messages, raw causes, document contents, or bytes.
 *
 * See `sanitizeDiagnosticError` for construction rules.
 */
export interface SanitizedDiagnosticError {
  /** Safe error class name derived from the thrown type. */
  errorClass: 'DOMException' | 'VfsError' | 'DomainError' | 'Error' | 'unknown';
  /** `DOMException.name` when the error is a `DOMException`. Always safe — browser-controlled. */
  domExceptionName?: string;
  /** `VfsError.code` when the error is a `VfsError`. Always safe — project-controlled enum. */
  vfsErrorCode?: string;
  /**
   * `DomainError.code` when the error is a `DomainError`.
   * Safe only when the code is a project-controlled enum value.
   */
  domainErrorCode?: string;
  /** Safe classification derived from the error type and code. */
  errorClassification: 'accessDenied' | 'storageFailure' | 'notFound' | 'unknown';
}

/**
 * Typed structured diagnostic event.
 *
 * All fields must be safe to send to external diagnostics backends.
 * Do not add paths, file names, document names, document ids, storage keys, URLs,
 * handles, raw external messages, raw causes, document contents, or bytes.
 */
export interface DiagnosticEvent {
  /** How severe the event is. */
  severity: DiagnosticSeverity;
  /** Feature area that emitted the event. */
  feature: DiagnosticFeature;
  /** Named operation within the feature. */
  operation: DiagnosticOperation;
  /** Stage within the operation where the event was emitted. */
  stage: DiagnosticStage;
  /** Observed outcome at the emitting stage. */
  result: DiagnosticResult;
  /** Safe classification of the root cause. */
  classification: DiagnosticClassification;
  /** Optional provider kind for provider-specific recovery paths. */
  providerKind?: string;
  /** Optional attempt or request id — must be project-generated, never derived from user data. */
  attemptId?: string;
  /** Optional safe numeric counters. */
  counters?: DiagnosticCounters;
  /** Optional sanitized error summary produced by `sanitizeDiagnosticError`. */
  error?: SanitizedDiagnosticError;
}
