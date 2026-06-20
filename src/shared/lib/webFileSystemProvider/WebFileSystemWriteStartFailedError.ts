import { DomainError } from '@shared/lib/error';

/**
 * Stable code for browser file-system writable-open failures detected by the provider.
 */
export const WEB_FILE_SYSTEM_WRITE_START_FAILED_CODE = 'web-file-system-write-start-failed';

const WEB_FILE_SYSTEM_WRITE_START_FAILED_MESSAGE = [
  'Could not start writing to this storage location.',
  'Mioframe has access to the selected folder, but the browser could not open a file for writing.',
  'This is usually caused by the browser, the system file picker, or the selected storage provider.',
  'Choose another storage location, such as a local device folder or Browser storage.',
].join('\n');

/**
 * Serialized transport payload for a provider-owned writable-open failure.
 */
export type SerializedWebFileSystemWriteStartFailedError = {
  /** Stable machine-readable code. */
  code: typeof WEB_FILE_SYSTEM_WRITE_START_FAILED_CODE;
  /** Raw runtime cause preserved for trusted in-app debugging. */
  cause?: unknown;
  /** Safe user-facing message. */
  message: string;
  /** Error class name. */
  name: string;
  /** Optional stack trace. */
  stack?: string | undefined;
};

/**
 * Provider-owned safe error for browser createWritable failures after permission is still granted.
 */
export class WebFileSystemWriteStartFailedError extends DomainError<
  typeof WEB_FILE_SYSTEM_WRITE_START_FAILED_CODE
> {
  override name = 'WebFileSystemWriteStartFailedError';
  override readonly code = WEB_FILE_SYSTEM_WRITE_START_FAILED_CODE;

  /**
   * Creates a write-start failure from runtime data or serialized transport data.
   * @param options - Raw runtime cause or serialized transport payload.
   */
  constructor(
    options:
      | {
          cause?: unknown;
        }
      | SerializedWebFileSystemWriteStartFailedError,
  ) {
    if ('name' in options) {
      super(options);
      return;
    }

    super(WEB_FILE_SYSTEM_WRITE_START_FAILED_MESSAGE, {
      cause: options.cause,
      code: WEB_FILE_SYSTEM_WRITE_START_FAILED_CODE,
    });
  }

  /**
   * Serializes the provider-owned error for worker transport.
   * @returns Service-transfer-safe error payload.
   */
  override toJSON(): SerializedWebFileSystemWriteStartFailedError {
    return {
      code: this.code,
      cause: this.cause,
      message: this.message,
      name: this.name,
      stack: this.stack,
    };
  }
}
