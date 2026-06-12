import { computed, type Ref } from 'vue';
import { isNotNil } from 'es-toolkit';
import { getFileSystemAccessRecovery } from '@shared/lib/fileSystem';
import { useGoogleDriveRecovery } from '@feature/googleDriveRecovery';
import { useLocalDirectoryRecoveryAction } from '@feature/localDirectoryRecovery';
import { getGoogleDriveAccessRecoveryError } from '@entity/googleDriveAccess';

/**
 * Arbitrates repository-explorer recovery precedence without pushing provider logic into the page.
 * @param options - Reactive repository explorer recovery inputs.
 * @returns Explicit recovery branches and actions for the widget template.
 */
export const useRepositoryExplorerRecovery = ({
  directoryPath,
  directoryStatError,
  errorMessage,
  repositoryRecoveryErrors,
}: {
  directoryPath: Ref<string>;
  directoryStatError: Ref<unknown>;
  errorMessage: Ref<string | undefined>;
  repositoryRecoveryErrors: Ref<unknown[]>;
}) => {
  const recoveryErrors = computed(() =>
    [...repositoryRecoveryErrors.value, directoryStatError.value].filter(isNotNil),
  );
  const localDirectoryRecovery = computed(() => {
    for (const error of recoveryErrors.value) {
      const recovery = getFileSystemAccessRecovery(error, { operation: 'read' });

      if (recovery) {
        return recovery;
      }
    }

    return undefined;
  });
  const hasGoogleDriveRecovery = computed(
    () =>
      !!errorMessage.value &&
      !!getGoogleDriveAccessRecoveryError(directoryPath.value, recoveryErrors.value),
  );
  const googleDriveRecovery = useGoogleDriveRecovery({
    path: directoryPath,
  });
  const {
    grantFullAccess,
    grantReadOnlyAccess,
    isGrantFullAccessLoading,
    isGrantLocalDirectoryAccessDisabled,
    isGrantReadOnlyAccessLoading,
    localDirectoryRecoveryMessage,
  } = useLocalDirectoryRecoveryAction({
    recovery: localDirectoryRecovery,
  });

  return {
    grantFullAccess,
    grantReadOnlyAccess,
    hasLocalDirectoryRecovery: computed(() => !!localDirectoryRecovery.value),
    googleDriveRecovery,
    hasGoogleDriveRecovery,
    isGrantFullAccessLoading,
    isGrantLocalDirectoryAccessDisabled,
    isGrantReadOnlyAccessLoading,
    localDirectoryRecovery,
    localDirectoryRecoveryMessage,
    recoveryErrors,
  };
};
