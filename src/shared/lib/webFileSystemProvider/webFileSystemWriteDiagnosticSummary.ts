/**
 * Safe browser file-write phase labels used in diagnostics.
 * Never derive from paths, names, ids, or runtime messages.
 */
export type WebFileSystemWritePhase =
  | 'lookupExistingHandle'
  | 'lookupParentDirectory'
  | 'createFileHandle'
  | 'createWritable'
  | 'writeContent'
  | 'closeWritable'
  | 'statAfterWrite';

/**
 * Safe sanitized write-error summary for browser-backed file writes.
 * Contains only project-controlled fields and browser enum names.
 */
export interface WebFileSystemWriteDiagnosticSummary {
  /** Safe error class name derived from the thrown type. */
  errorClass: 'DOMException' | 'VfsError' | 'DomainError' | 'Error' | 'unknown';
  /** `DOMException.name` when the error is a `DOMException`. */
  domExceptionName?: string;
  /** `VfsError.code` when the error is a `VfsError`. */
  vfsErrorCode?: string;
  /** `DomainError.code` when the error is a `DomainError`. */
  domainErrorCode?: string;
  /** Safe classification derived from the error type and code. */
  errorClassification:
    | 'accessDenied'
    | 'browserFileStateChanged'
    | 'notFound'
    | 'storageFailure'
    | 'unknown';
  /** Browser write phase that observed the failure. */
  writePhase?: WebFileSystemWritePhase | undefined;
  /** Whether a fresh-handle retry was attempted. */
  retryAttempted?: 'false' | 'true' | undefined;
  /** Outcome of the bounded retry decision. */
  retryResult?: 'failed' | 'notAttempted' | 'succeeded' | undefined;
}

const WEB_FILE_SYSTEM_DIAGNOSTIC_SUMMARY = Symbol('webFileSystemDiagnosticSummary');

type ErrorWithSummaryCarrier = {
  [WEB_FILE_SYSTEM_DIAGNOSTIC_SUMMARY]?: WebFileSystemWriteDiagnosticSummary | undefined;
};

const isErrorWithSummaryCarrier = (value: unknown): value is ErrorWithSummaryCarrier =>
  typeof value === 'object' && value !== null;

/**
 * Attaches a safe write-error summary to a thrown error without changing its identity.
 * @param error - Unknown thrown value to annotate in-place when possible.
 * @param summary - Safe summary to attach.
 */
export const attachWebFileSystemWriteDiagnosticSummary = (
  error: unknown,
  summary: WebFileSystemWriteDiagnosticSummary,
): void => {
  if (!isErrorWithSummaryCarrier(error)) {
    return;
  }

  Object.defineProperty(error, WEB_FILE_SYSTEM_DIAGNOSTIC_SUMMARY, {
    configurable: true,
    enumerable: false,
    value: summary,
    writable: true,
  });
};

/**
 * Reads a previously attached safe write-error summary from a thrown error.
 * @param error - Unknown thrown value.
 * @returns Safe summary when present.
 */
export const getWebFileSystemWriteDiagnosticSummary = (
  error: unknown,
): WebFileSystemWriteDiagnosticSummary | undefined => {
  if (!isErrorWithSummaryCarrier(error)) {
    return undefined;
  }

  return error[WEB_FILE_SYSTEM_DIAGNOSTIC_SUMMARY];
};
