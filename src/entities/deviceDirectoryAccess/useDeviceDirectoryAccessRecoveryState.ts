import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import {
  getFileSystemAccessRecovery,
  type FileSystemAccessOperation,
  type FileSystemAccessRecovery,
} from '@shared/lib/fileSystem';

/**
 * Finds the first access-required error emitted for a remembered local space.
 * @param errors - Query errors collected for the current repo path.
 * @returns The first matching access-required error, if present.
 */
const getDeviceDirectoryAccessRecovery = (
  errors: unknown[],
): FileSystemAccessRecovery | undefined => {
  for (const error of errors) {
    const recovery = getFileSystemAccessRecovery(error);

    if (recovery) {
      return recovery;
    }
  }

  return undefined;
};

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
    const recovery = getDeviceDirectoryAccessRecovery(toValue(errors));

    if (!recovery) {
      return undefined;
    }

    const requiredOperation = toValue(operation);

    if (requiredOperation !== undefined && recovery.operation !== requiredOperation) {
      return undefined;
    }

    return recovery;
  });

  return {
    state,
  };
};
