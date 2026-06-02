import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import {
  WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
  WebFileSystemAccessRequiredError,
} from '@shared/lib/webFileSystemProvider';
import { type FileSystemAccessOperation } from '@shared/lib/fileSystem';

type DeviceDirectoryAccessRecoveryErrorLike = Error & {
  code: typeof WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE;
  mode: 'read' | 'readwrite';
  spaceName: string;
};

const isWebFileSystemAccessMode = (value: unknown): value is 'read' | 'readwrite' =>
  value === 'read' || value === 'readwrite';

/**
 * Returns whether the error payload matches the local-space access-recovery contract.
 * @param error - Error candidate emitted by file-system queries.
 * @returns Whether the error matches the remembered local-space access contract.
 */
const isDeviceDirectoryAccessRecoveryError = (
  error: unknown,
): error is DeviceDirectoryAccessRecoveryErrorLike =>
  error instanceof Error &&
  'code' in error &&
  error.code === WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE &&
  'spaceName' in error &&
  typeof error.spaceName === 'string' &&
  'mode' in error &&
  isWebFileSystemAccessMode(error.mode);

/**
 * Finds the first access-required error emitted for a remembered local space.
 * @param errors - Query errors collected for the current repo path.
 * @returns The first matching access-required error, if present.
 */
const getDeviceDirectoryAccessRecoveryError = (errors: unknown[]) => {
  for (const error of errors) {
    if (
      error instanceof WebFileSystemAccessRequiredError ||
      isDeviceDirectoryAccessRecoveryError(error)
    ) {
      return error;
    }
  }

  return undefined;
};

const modeToOperation = (mode: 'read' | 'readwrite'): FileSystemAccessOperation =>
  mode === 'readwrite' ? 'write' : 'read';

/**
 * Derives typed recovery state for remembered local-space permission prompts.
 * @param options - Reactive error sources for the current repo path.
 * @returns Reactive access-recovery state for the current repo path.
 */
export const useDeviceDirectoryAccessRecoveryState = ({
  errors,
  operation,
}: {
  errors: MaybeRefOrGetter<unknown[]>;
  operation?: MaybeRefOrGetter<FileSystemAccessOperation | undefined>;
}) => {
  /**
   * Current recovery payload for the active repo path, if one exists.
   */
  const state = computed(() => {
    const error = getDeviceDirectoryAccessRecoveryError(toValue(errors));

    if (!error) {
      return undefined;
    }

    const errorOperation = modeToOperation(error.mode);
    const requiredOperation = toValue(operation);

    if (requiredOperation !== undefined && errorOperation !== requiredOperation) {
      return undefined;
    }

    return {
      operation: errorOperation,
      spaceName: error.spaceName,
    };
  });

  return {
    state,
  };
};
