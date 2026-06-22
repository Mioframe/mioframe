import { DomainError } from '../error';
import { HttpStatusCode } from '../error/httpStatus';

/**
 * Initialization options for a Google Drive error.
 */
type GoogleDriveErrorInit = {
  /** HTTP-like Google Drive error code. */
  code: HttpStatusCode;
  /** Project-controlled error message safe for diagnostics. */
  message: string;
  /** Underlying cause preserved for debugging. */
  cause?: unknown;
  /** Google API error reason token (e.g. `insufficientFilePermissions`), when available. */
  reason?: string | undefined;
  /** Google API error domain token (e.g. `global`), when available. */
  domain?: string | undefined;
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
  /** Google API error reason token, when safely available. Not guaranteed to be present. */
  reason?: string | undefined;
  /** Google API error domain token, when safely available. Not guaranteed to be present. */
  domain?: string | undefined;
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
      const { code, message, reason, domain } = options;
      super(message, { cause });
      this.code = code;
      this.reason = reason;
      this.domain = domain;
    }
  }
}
