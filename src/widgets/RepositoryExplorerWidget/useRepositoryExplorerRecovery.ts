import { computed, type Ref } from 'vue';
import { isNotNil } from 'es-toolkit';
import { useDeviceDirectoryAccessRecovery } from '@feature/deviceDirectoryAccessRecovery';
import { useGoogleDriveRecovery } from '@feature/googleDriveRecovery';
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
  const deviceDirectoryAccess = useDeviceDirectoryAccessRecovery({
    errors: recoveryErrors,
    operation: 'read',
  });
  const hasGoogleDriveRecovery = computed(
    () =>
      !!errorMessage.value &&
      !!getGoogleDriveAccessRecoveryError(directoryPath.value, recoveryErrors.value),
  );
  const googleDriveRecovery = useGoogleDriveRecovery({
    path: directoryPath,
  });

  return {
    deviceDirectoryAccess,
    googleDriveRecovery,
    hasGoogleDriveRecovery,
    recoveryErrors,
  };
};
