/**
 * Safe browser file-write phase labels used in diagnostics.
 * Never derive from paths, names, ids, or runtime messages.
 */
export type WebFileSystemWritePhase =
  | 'ensureAccess'
  | 'lookupExistingHandle'
  | 'lookupParentDirectory'
  | 'createFileHandle'
  | 'createWritableStarted'
  | 'createWritableSucceeded'
  | 'writeStarted'
  | 'writeSucceeded'
  | 'closeStarted'
  | 'closeSucceeded'
  | 'abortStarted'
  | 'abortSucceeded'
  | 'abortFailed'
  | 'statAfterWriteStarted'
  | 'statAfterWriteSucceeded'
  | 'statAfterWriteFailed';

/** Safe attempt role for a browser-backed file write diagnostic summary. */
export type WebFileSystemWriteAttemptRole = 'initial' | 'retry';
/** Safe bounded retry strategy label for a browser-backed file write diagnostic summary. */
export type WebFileSystemWriteRetryKind = 'none' | 'freshHandle' | 'rootHandleRefresh';
/** Safe origin label for the handle used by a browser-backed file write attempt. */
export type WebFileSystemWriteHandleSource =
  | 'existingLookup'
  | 'createdHandle'
  | 'freshParentLookup'
  | 'returnedGrantedRootHandle'
  | 'storedRootHandle';
/** Safe abort cleanup outcome for a browser-backed file write attempt. */
export type WebFileSystemWriteAbortResult = 'notNeeded' | 'succeeded' | 'failed';

/**
 * Safe sanitized write-error summary for browser-backed file writes.
 * Contains only project-controlled fields and browser enum names.
 */
export interface WebFileSystemWriteDiagnosticSummary {
  /** Whether this summary describes the initial write or the bounded retry attempt. */
  attemptRole?: WebFileSystemWriteAttemptRole | undefined;
  /** Retry strategy in effect for this attempt. */
  retryKind?: WebFileSystemWriteRetryKind | undefined;
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
  /** Current browser write phase when the summary was recorded. */
  currentPhase?: WebFileSystemWritePhase | undefined;
  /** Original failing phase from the initial attempt when this summary describes a retry. */
  originalFailurePhase?: WebFileSystemWritePhase | undefined;
  /** Failing phase for the current attempt. */
  failedPhase?: WebFileSystemWritePhase | undefined;
  /** Where the current file/root handle came from. */
  handleSource?: WebFileSystemWriteHandleSource | undefined;
  /** Whether `createWritable()` completed and produced a stream. */
  streamCreated?: 'false' | 'true' | undefined;
  /** Whether `abort()` was attempted for cleanup. */
  abortAttempted?: 'false' | 'true' | undefined;
  /** Outcome of the abort cleanup path. */
  abortResult?: WebFileSystemWriteAbortResult | undefined;
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
