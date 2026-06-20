import { DomainError } from '@shared/lib/error';

/**
 * Stable code for browser file-system writable-open failures detected by the provider.
 */
export const WEB_FILE_SYSTEM_WRITE_START_FAILED_CODE = 'web-file-system-write-start-failed';

/**
 * Safe user-facing message for browser `createWritable()` failures after permission remains granted.
 */
export const WEB_FILE_SYSTEM_WRITE_START_FAILED_MESSAGE = [
  'Could not start writing to this storage location.',
  'Mioframe has access to the selected folder, but the browser could not open a file for writing.',
  'This is usually caused by the browser, the system file picker, or the selected storage provider.',
  'Choose another storage location, such as a local device folder or Browser storage.',
].join('\n');

/**
 * Creates a provider-owned `DomainError` for browser writable-open failures.
 * @param cause - Raw runtime cause preserved for trusted in-app debugging.
 * @returns Provider-owned `DomainError` with a stable code and safe message.
 */
export const createWebFileSystemWriteStartFailedError = (
  cause: unknown,
): DomainError<typeof WEB_FILE_SYSTEM_WRITE_START_FAILED_CODE> =>
  new DomainError(WEB_FILE_SYSTEM_WRITE_START_FAILED_MESSAGE, {
    cause,
    code: WEB_FILE_SYSTEM_WRITE_START_FAILED_CODE,
  });
