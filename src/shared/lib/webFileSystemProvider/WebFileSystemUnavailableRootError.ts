import { DomainError } from '@shared/lib/error';

/**
 * Stable code for a remembered local-space root that cannot be enumerated despite granted
 * read permission, emitted by the browser FS provider.
 */
export const WEB_FILE_SYSTEM_UNAVAILABLE_ROOT_CODE = 'web-file-system-unavailable-root';

const WEB_FILE_SYSTEM_UNAVAILABLE_ROOT_MESSAGE =
  'Mioframe cannot open this remembered folder anymore. It may have been moved, renamed, or removed on this device.';

/**
 * Safe metadata needed to recover from an unavailable remembered local-directory root.
 */
export interface WebFileSystemUnavailableRootDetails {
  /** Safe remembered-space name shown to the user. */
  spaceName: string;
  /**
   * Opaque, transfer-safe, runtime-only key identifying the mounted provider instance that
   * emitted this error. Not a physical-directory identity and never persisted or displayed.
   */
  recoveryKey: string;
  /** Raw enumeration failure preserved as the trusted in-app cause. */
  cause?: unknown;
}

/**
 * Serialized transport payload for a provider-owned unavailable-root error.
 */
export type SerializedWebFileSystemUnavailableRootError = {
  /** Stable machine-readable code. */
  code: typeof WEB_FILE_SYSTEM_UNAVAILABLE_ROOT_CODE;
  /** Safe user-facing message. */
  message: string;
  /** Error class name. */
  name: string;
  /** Remembered local-space name shown to the user. */
  spaceName: string;
  /** Opaque runtime recovery key identifying the mounted provider instance. */
  recoveryKey: string;
  /** Optional stack trace. */
  stack?: string | undefined;
};

/**
 * Service-transfer-safe error raised when a remembered local space's root can no longer be
 * enumerated even though read permission is still granted.
 */
export class WebFileSystemUnavailableRootError extends DomainError<
  typeof WEB_FILE_SYSTEM_UNAVAILABLE_ROOT_CODE
> {
  override name = 'WebFileSystemUnavailableRootError';
  override readonly code = WEB_FILE_SYSTEM_UNAVAILABLE_ROOT_CODE;
  readonly spaceName: string;
  readonly recoveryKey: string;

  /**
   * Creates an unavailable-root error from runtime details or serialized transport data.
   * @param options - Safe transport data plus optional raw cause for the current failure.
   */
  constructor(
    options: WebFileSystemUnavailableRootDetails | SerializedWebFileSystemUnavailableRootError,
  ) {
    if ('name' in options) {
      super(options);
      this.spaceName = options.spaceName;
      this.recoveryKey = options.recoveryKey;
      return;
    }

    super(WEB_FILE_SYSTEM_UNAVAILABLE_ROOT_MESSAGE, {
      cause: options.cause,
      code: WEB_FILE_SYSTEM_UNAVAILABLE_ROOT_CODE,
    });
    this.spaceName = options.spaceName;
    this.recoveryKey = options.recoveryKey;
  }

  /**
   * Serializes the unavailable-root error for worker transport.
   * @returns Service-transfer-safe error payload.
   */
  override toJSON(): SerializedWebFileSystemUnavailableRootError {
    return {
      code: this.code,
      message: this.message,
      name: this.name,
      spaceName: this.spaceName,
      recoveryKey: this.recoveryKey,
      stack: this.stack,
    };
  }
}
