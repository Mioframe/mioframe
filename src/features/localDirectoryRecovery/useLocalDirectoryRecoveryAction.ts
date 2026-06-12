import type { FileSystemAccessRecovery } from '@shared/lib/fileSystem';
import {
  useFileSystemAccessPermissionBroker,
  type FileSystemAccessPermissionRequest,
} from '@shared/serviceClient/fileSystem';
import { computed, ref, watch, type Ref } from 'vue';

type RequestedMode = FileSystemAccessPermissionRequest['requestedMode'];
type RequestAccessResult = Awaited<
  ReturnType<ReturnType<typeof useFileSystemAccessPermissionBroker>['requestAccess']>
>;

/**
 * Owns the user-triggered permission recovery action for remembered local directories.
 * Keeps browser permission mode selection and loading state out of widgets/pages.
 * @param recovery - Current local-directory recovery request exposed by the detecting layer.
 * @returns Explicit action handlers and UI-facing state for the recovery controls.
 */
export const useLocalDirectoryRecoveryAction = ({
  recovery,
}: {
  recovery: Ref<FileSystemAccessRecovery | undefined>;
}) => {
  const { requestAccess } = useFileSystemAccessPermissionBroker();
  const activeRequestedMode = ref<RequestedMode>();
  const recoveryMessageOverride = ref<string>();

  watch(
    recovery,
    () => {
      recoveryMessageOverride.value = undefined;
    },
    { immediate: true },
  );

  const grantAccess = async (requestedMode: RequestedMode): Promise<RequestAccessResult> => {
    const currentRecovery = recovery.value;

    if (!currentRecovery || activeRequestedMode.value) {
      return { status: 'error' };
    }

    activeRequestedMode.value = requestedMode;

    try {
      const result = await requestAccess({
        operation: currentRecovery.operation,
        requestedMode,
        spaceName: currentRecovery.spaceName,
      });

      if (result.status === 'granted' || result.status === 'grantedWithReplayFailures') {
        recoveryMessageOverride.value = undefined;
        return result;
      }

      recoveryMessageOverride.value =
        result.status === 'error'
          ? 'Could not request browser permission. Try again from this action.'
          : 'Mioframe still cannot open this space because your browser did not grant permission.';

      return result;
    } finally {
      activeRequestedMode.value = undefined;
    }
  };

  return {
    grantFullAccess: () => grantAccess('readwrite'),
    grantReadOnlyAccess: () => grantAccess('read'),
    isGrantFullAccessLoading: computed(() => activeRequestedMode.value === 'readwrite'),
    isGrantReadOnlyAccessLoading: computed(() => activeRequestedMode.value === 'read'),
    isGrantLocalDirectoryAccessDisabled: computed(
      () => !recovery.value || activeRequestedMode.value !== undefined,
    ),
    localDirectoryRecoveryMessage: computed(
      () =>
        recoveryMessageOverride.value ??
        (recovery.value
          ? `Mioframe remembers "${recovery.value.spaceName}", but your browser requires permission before opening it.`
          : ''),
    ),
  };
};
