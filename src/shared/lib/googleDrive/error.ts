import { DomainError } from '../error';
import { HttpStatusCode } from '../error/httpStatus';

export class GoogleDriveError extends DomainError {
  override name = 'GoogleDriveError';
  override __isDomainError = true;
  override message: string;
  override cause?: unknown;
  code: HttpStatusCode;
  details?: Record<string, unknown>;

  constructor(
    options:
      | {
          code: HttpStatusCode;
          message: string;
          cause?: unknown;
          details?: Record<string, unknown>;
        }
      | string,
    { cause }: { cause?: unknown } = {},
  ) {
    if (typeof options === 'string') {
      super(options);
      this.code = HttpStatusCode.INTERNAL_SERVER_ERROR;
      this.message = options;
      this.cause = cause;
    } else {
      const { code, message, details } = options;
      super(message, { cause });
      this.code = code;
      this.message = message;
      this.details = details;
    }
  }
}
