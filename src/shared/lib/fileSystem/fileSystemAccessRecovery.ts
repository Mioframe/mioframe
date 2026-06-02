import { WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE } from '@shared/lib/webFileSystemProvider';

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
  if (!(error instanceof Error)) return undefined;
  if (!('code' in error) || error.code !== WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE) return undefined;
  if (!('spaceName' in error) || typeof error.spaceName !== 'string') return undefined;
  if (!('mode' in error)) return undefined;

  const operation: FileSystemAccessOperation | undefined =
    error.mode === 'read' ? 'read' : error.mode === 'readwrite' ? 'write' : undefined;

  if (operation === undefined) return undefined;

  if (options?.operation !== undefined && options.operation !== operation) return undefined;

  return { operation, spaceName: error.spaceName };
};
