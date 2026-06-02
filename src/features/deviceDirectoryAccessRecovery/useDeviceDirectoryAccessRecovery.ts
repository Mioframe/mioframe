import { useDeviceDirectoryAccessRecoveryState } from '@entity/deviceDirectoryAccess';
import { type FileSystemAccessOperation } from '@shared/lib/fileSystem';
import { useFileSystemAccessPermissionBroker } from '@shared/service/fileSystem';
import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';

/**
 * Feature-owned permission recovery flow for remembered local directories.
 * @param errors - Current errors for the rendered repository path.
 * @returns Recovery state, status message, and user-triggered grant action.
 */
export const useDeviceDirectoryAccessRecovery = ({
  errors,
  operation,
  deniedMessage,
  defaultRecoveryMessage,
}: {
  errors: MaybeRefOrGetter<unknown[]>;
  operation?: MaybeRefOrGetter<FileSystemAccessOperation | undefined>;
  deniedMessage?: string | undefined;
  defaultRecoveryMessage?:
    | ((state: { operation: FileSystemAccessOperation; spaceName: string }) => string)
    | undefined;
}) => {
  const { state } = useDeviceDirectoryAccessRecoveryState({ errors, operation });
  const { clearPreparedRequest, hasPreparedRequest, prepareAccessRequest, requestPreparedAccess } =
    useFileSystemAccessPermissionBroker();

  const isGrantLoading = ref(false);
  const message = ref<string>();
  let pendingRequestLoadVersion = 0;
  const recoveryState = computed(() => toValue(state));

  watch(
    () => recoveryState.value,
    async (nextState, _previousState, onCleanup) => {
      const currentLoadVersion = ++pendingRequestLoadVersion;

      onCleanup(() => {
        pendingRequestLoadVersion += 1;
        clearPreparedRequest(nextState);
      });

      message.value = undefined;
      clearPreparedRequest(nextState);

      if (!nextState) {
        return;
      }

      const request = await prepareAccessRequest(nextState);

      if (currentLoadVersion !== pendingRequestLoadVersion) {
        clearPreparedRequest(nextState);
        return;
      }

      if (!request) {
        message.value = 'Could not prepare browser permission. Try again from this action.';
      }
    },
    { immediate: true },
  );

  const grantDisabled = computed(
    () => !recoveryState.value || !hasPreparedRequest.value || isGrantLoading.value,
  );
  const recoveryMessage = computed(() => {
    if (message.value) {
      return message.value;
    }

    const currentState = recoveryState.value;

    if (!currentState) {
      return '';
    }

    return (
      defaultRecoveryMessage?.(currentState) ??
      `Mioframe remembers "${currentState.spaceName}", but your browser requires permission before opening it.`
    );
  });

  const grantAccess = async () => {
    const request = recoveryState.value;

    if (!request || isGrantLoading.value) {
      return { status: 'missing' as const };
    }

    isGrantLoading.value = true;

    try {
      const result = await requestPreparedAccess(request);

      if (result.status === 'granted') {
        message.value = undefined;
        return result;
      }

      if (result.status === 'error') {
        message.value = 'Could not request browser permission. Try again from this action.';
        void prepareAccessRequest(request);
        return result;
      }

      message.value =
        deniedMessage ??
        'Mioframe still cannot open this space because your browser did not grant permission.';
      void prepareAccessRequest(request);

      return result;
    } finally {
      isGrantLoading.value = false;
    }
  };

  return {
    grantAccess,
    grantDisabled,
    isGrantLoading,
    message,
    recoveryState,
    recoveryMessage,
  };
};
