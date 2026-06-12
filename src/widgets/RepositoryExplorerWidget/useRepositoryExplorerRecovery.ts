import { computed, ref, watch, type Ref } from 'vue';
import { isNotNil } from 'es-toolkit';
import { getFileSystemAccessRecovery } from '@shared/lib/fileSystem';
import type { WebFileSystemAccessMode } from '@shared/lib/webFileSystemProvider';
import { useFileSystemAccessPermissionBroker } from '@shared/serviceClient/fileSystem';
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
  const { requestAccess } = useFileSystemAccessPermissionBroker();
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
  const isGrantLoading = ref(false);
  const localDirectoryRecoveryMessage = ref<string>();

  watch(
    () => localDirectoryRecovery.value,
    () => {
      localDirectoryRecoveryMessage.value = undefined;
    },
    { immediate: true },
  );

  const hasGoogleDriveRecovery = computed(
    () =>
      !!errorMessage.value &&
      !!getGoogleDriveAccessRecoveryError(directoryPath.value, recoveryErrors.value),
  );
  const googleDriveRecovery = useGoogleDriveRecovery({
    path: directoryPath,
  });

  const grantLocalDirectoryAccess = async (requestedMode: WebFileSystemAccessMode) => {
    const recovery = localDirectoryRecovery.value;

    if (!recovery || isGrantLoading.value) {
      return { status: 'missing' as const };
    }

    isGrantLoading.value = true;

    try {
      const result = await requestAccess({
        operation: recovery.operation,
        requestedMode,
        spaceName: recovery.spaceName,
      });

      // Read recovery resolves to `granted` before any write-only replay/storage handlers can run.
      if (result.status === 'granted' || result.status === 'grantedWithReplayFailures') {
        localDirectoryRecoveryMessage.value = undefined;
        return result;
      }

      localDirectoryRecoveryMessage.value =
        result.status === 'error'
          ? 'Could not request browser permission. Try again from this action.'
          : 'Mioframe still cannot open this space because your browser did not grant permission.';

      return result;
    } finally {
      isGrantLoading.value = false;
    }
  };

  return {
    grantLocalDirectoryAccess,
    hasLocalDirectoryRecovery: computed(() => !!localDirectoryRecovery.value),
    googleDriveRecovery,
    hasGoogleDriveRecovery,
    isGrantLocalDirectoryAccessDisabled: computed(
      () => !localDirectoryRecovery.value || isGrantLoading.value,
    ),
    isGrantLocalDirectoryAccessLoading: isGrantLoading,
    localDirectoryRecovery,
    localDirectoryRecoveryMessage: computed(
      () =>
        localDirectoryRecoveryMessage.value ??
        (localDirectoryRecovery.value
          ? `Mioframe remembers "${localDirectoryRecovery.value.spaceName}", but your browser requires permission before opening it.`
          : ''),
    ),
    recoveryErrors,
  };
};
