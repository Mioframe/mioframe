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

const webFileSystemDiagnosticSummaries = new WeakMap<object, WebFileSystemWriteDiagnosticSummary>();

const isObject = (value: unknown): value is object => typeof value === 'object' && value !== null;

/**
 * Attaches a safe write-error summary to a thrown object without changing its identity.
 * Never throws, even for frozen or non-extensible objects.
 * @param error - Unknown thrown value to annotate when it is an object.
 * @param summary - Safe summary to attach.
 */
export const attachWebFileSystemWriteDiagnosticSummary = (
  error: unknown,
  summary: WebFileSystemWriteDiagnosticSummary,
): void => {
  if (!isObject(error)) {
    return;
  }
  webFileSystemDiagnosticSummaries.set(error, summary);
};

/**
 * Reads a previously attached safe write-error summary from a thrown error.
 * @param error - Unknown thrown value.
 * @returns Safe summary when present.
 */
export const getWebFileSystemWriteDiagnosticSummary = (
  error: unknown,
): WebFileSystemWriteDiagnosticSummary | undefined => {
  if (!isObject(error)) {
    return undefined;
  }

  return webFileSystemDiagnosticSummaries.get(error);
};
