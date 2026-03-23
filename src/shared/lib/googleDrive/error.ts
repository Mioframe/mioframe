import { DomainError } from '../error';
import { HttpStatusCode } from '../error/httpStatus';

export class GoogleDriveError extends DomainError {
  override name = 'GoogleDriveError';
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
