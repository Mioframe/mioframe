import { DomainError } from '@shared/lib/error';

/**
 * Stable code for remembered local-space access recovery emitted by the browser FS provider.
 */
export const WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE = 'web-file-system-access-required';

/**
 * Permission mode required to continue a blocked local-space operation.
 */
export type WebFileSystemAccessMode = 'readwrite';

/**
 * Safe metadata needed to recover browser permission for a remembered local directory.
 */
export interface WebFileSystemAccessRequiredDetails {
  /** Permission mode needed for the blocked operation. */
  mode: WebFileSystemAccessMode;
  /** Pending request identifier used to fetch the stored handle. */
  requestId: string;
  /** Safe remembered-space name shown to the user. */
  spaceName: string;
}

/**
 * Serialized transport payload for a provider-owned access-required error.
 */
export type SerializedWebFileSystemAccessRequiredError = {
  /** Optional safe cause. */
  cause?: unknown;
  /** Stable machine-readable code. */
  code: typeof WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE;
  /** Safe user-facing message. */
  message: string;
  /** Permission mode that must be granted. */
  mode: WebFileSystemAccessMode;
  /** Error class name. */
  name: string;
  /** Runtime access request identifier. */
  requestId: string;
  /** Remembered local-space name shown to the user. */
  spaceName: string;
  /** Optional stack trace. */
  stack?: string | undefined;
};

/**
 * Service-transfer-safe error raised when a remembered local space needs browser permission.
 */
export class WebFileSystemAccessRequiredError extends DomainError<
  typeof WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE
> {
  override name = 'WebFileSystemAccessRequiredError';
  override readonly code = WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE;
  readonly requestId: string;
  readonly spaceName: string;
  readonly mode: WebFileSystemAccessMode;

  /**
   * Creates an access-required error from runtime details or serialized transport data.
   * @param options - Safe transport data for the current access request.
   */
  constructor(
    options: WebFileSystemAccessRequiredDetails | SerializedWebFileSystemAccessRequiredError,
  ) {
    if ('name' in options) {
      super(options);
      this.requestId = options.requestId;
      this.spaceName = options.spaceName;
      this.mode = options.mode;
      return;
    }

    super('Permission required to open this remembered local space', {
      code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
    });
    this.requestId = options.requestId;
    this.spaceName = options.spaceName;
    this.mode = options.mode;
  }

  /**
   * Serializes the access-required error for worker transport.
   * @returns Service-transfer-safe error payload.
   */
  override toJSON(): SerializedWebFileSystemAccessRequiredError {
    return {
      ...super.toJSON(),
      code: this.code,
      mode: this.mode,
      name: this.name,
      requestId: this.requestId,
      spaceName: this.spaceName,
    };
  }
}
