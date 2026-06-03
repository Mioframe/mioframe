import { WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE } from '@shared/lib/webFileSystemProvider';
import type { output } from 'zod/v4-mini';
import { literal, object, string, union } from 'zod/v4-mini';
import { zodSafeCheck } from '@shared/lib/validateZodScheme';

/**
 * Generic operation type for file-system access recovery flows.
 * - 'read' — needed for stat, readFile, and readDirectory operations.
 * - 'write' — needed for writeFile, createDirectory, delete, and move operations.
 */
export type FileSystemAccessOperation = 'read' | 'write';

/**
 * Transfer-safe key for a pending file-system access grant.
 * Does not include handles, provider objects, raw browser errors, or raw paths.
 */
export interface FileSystemAccessRecovery {
  /** Generic operation that requires browser permission. */
  operation: FileSystemAccessOperation;
  /** Safe remembered-space name shown to the user. */
  spaceName: string;
}

const zodWebFileSystemAccessMode = union([literal('read'), literal('readwrite')]);

const zodSerializedFileSystemAccessRecoveryPayload = object({
  code: literal(WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE),
  mode: zodWebFileSystemAccessMode,
  spaceName: string(),
});

type SerializedFileSystemAccessRecoveryPayload = output<
  typeof zodSerializedFileSystemAccessRecoveryPayload
>;

const toFileSystemAccessRecovery = ({
  mode,
  spaceName,
}: SerializedFileSystemAccessRecoveryPayload): FileSystemAccessRecovery => ({
  operation: mode === 'readwrite' ? 'write' : 'read',
  spaceName,
});

/**
 * Parses a transfer-safe file-system access recovery payload from an unknown error shape.
 * @param error - Unknown error candidate emitted by a file-system operation.
 * @returns Generic recovery state when the payload is valid, otherwise undefined.
 */
export const parseFileSystemAccessRecovery = (
  error: unknown,
): FileSystemAccessRecovery | undefined => {
  const result = zodSafeCheck(zodSerializedFileSystemAccessRecoveryPayload, error);

  if ('error' in result) {
    return undefined;
  }

  return toFileSystemAccessRecovery(result.data);
};

/**
 * Returns generic recovery state when the error signals missing browser file-system permission.
 * @param error - Unknown error caught from a file-system operation.
 * @param options - Optional filter; pass `{ operation: 'write' }` to match write-only errors.
 * @returns Recovery state if the error is a recoverable FS access error, otherwise undefined.
 */
export const getFileSystemAccessRecovery = (
  error: unknown,
  options?: { operation?: FileSystemAccessOperation },
): FileSystemAccessRecovery | undefined => {
  const recovery = parseFileSystemAccessRecovery(error);

  if (!recovery) {
    return undefined;
  }

  if (options?.operation !== undefined && options.operation !== recovery.operation) {
    return undefined;
  }

  return recovery;
};
