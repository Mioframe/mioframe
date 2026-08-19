import { computed, type Ref } from 'vue';
import { isNotNil } from 'es-toolkit';
import { useGoogleDriveRecovery } from '@feature/googleDriveRecovery';
import { useLocalDirectoryRecoveryAction } from '@feature/localDirectoryRecovery';
import { useLocalDirectoryReconnectAction } from '@feature/localDirectoryReconnect';
import { getGoogleDriveAccessRecoveryError } from '@entity/googleDriveAccess';

/**
 * Arbitrates repository-explorer recovery precedence without pushing provider logic into the page.
 * Collects the screen's error candidates and passes them to the local-directory features, which
 * derive their own recovery; this widget only owns branch precedence and rendering.
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
    hasLocalDirectoryRecovery,
    isGrantLocalDirectoryAccessDisabled,
    isGrantLocalDirectoryAccessPending,
    localDirectoryRecoveryMessage,
  } = useLocalDirectoryRecoveryAction({
    errors: recoveryErrors,
  });
  const {
    hasUnavailableRootRecovery,
    isReconnectDisabled,
    isReconnectPending,
    reconnectFolder,
    reconnectMessage,
  } = useLocalDirectoryReconnectAction({
    errors: recoveryErrors,
  });

  return {
    grantFullAccess,
    grantReadOnlyAccess,
    hasLocalDirectoryRecovery,
    hasUnavailableRootRecovery,
    googleDriveRecovery,
    hasGoogleDriveRecovery,
    isGrantLocalDirectoryAccessDisabled,
    isGrantLocalDirectoryAccessPending,
    isReconnectDisabled,
    isReconnectPending,
    localDirectoryRecoveryMessage,
    reconnectFolder,
    reconnectMessage,
    recoveryErrors,
  };
};
