import { DomainError } from '../error';
import { HttpStatusCode } from '../error/httpStatus';

/**
 * Initialization options for a Google Drive error.
 */
type GoogleDriveErrorInit = {
  /** HTTP-like Google Drive error code. */
  code: HttpStatusCode;
  /** User-facing error message. */
  message: string;
  /** Underlying cause preserved for debugging. */
  cause?: unknown;
  /** Additional API details attached to the failure. */
  details?: Record<string, unknown> | undefined;
};

/**
 * Optional constructor options when creating a Google Drive error from a string message.
 */
type GoogleDriveErrorOptions = {
  /** Underlying cause preserved for debugging. */
  cause?: unknown;
};

/**
 * Domain error wrapper for Google Drive failures with HTTP-style status codes.
 */
export class GoogleDriveError extends DomainError<HttpStatusCode> {
  override name = 'GoogleDriveError';
  /** HTTP-like Google Drive error code. */
  override code: HttpStatusCode;
  /** Additional API details attached to the failure. */
  details?: Record<string, unknown> | undefined;

  /**
   * Creates a Google Drive error from either an init object or a plain message.
   * @param options - Full error details or a fallback message.
   * @param initialOptions - Optional cause when constructing from a plain message.
   */
  constructor(options: GoogleDriveErrorInit | string, { cause }: GoogleDriveErrorOptions = {}) {
    if (typeof options === 'string') {
      super(options, { cause });
      this.code = HttpStatusCode.INTERNAL_SERVER_ERROR;
    } else {
      const { code, message, details } = options;
      super(message, { cause });
      this.code = code;
      this.details = details;
    }
  }
}
