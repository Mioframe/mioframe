import { useDeviceDirectoryAccessRecoveryState } from '@entity/deviceDirectoryAccess';
import { useMainServiceClient } from '@shared/service';
import type { WebFileSystemAccessMode } from '@shared/lib/webFileSystemProvider';
import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';

/**
 * Feature-owned permission recovery flow for remembered local directories.
 * @param errors - Current errors for the rendered repository path.
 * @returns Recovery state, status message, and user-triggered grant action.
 */
export const useDeviceDirectoryAccessRecovery = ({
  errors,
}: {
  errors: MaybeRefOrGetter<unknown[]>;
}) => {
  const { state } = useDeviceDirectoryAccessRecoveryState({ errors });
  const {
    fileSystem: {
      cancelDeviceDirectoryAccessRequest,
      getDeviceDirectoryAccessRequest,
      resolveDeviceDirectoryAccessRequest,
    },
  } = useMainServiceClient();

  const isGrantLoading = ref(false);
  const message = ref<string>();
  let pendingRequestLoadVersion = 0;
  const pendingRequest = ref<
    | {
        spaceName: string;
        handle: FileSystemDirectoryHandle;
        mode: WebFileSystemAccessMode;
      }
    | undefined
  >();

  watch(
    () => state.value,
    async (nextState, _previousState, onCleanup) => {
      const currentLoadVersion = ++pendingRequestLoadVersion;
      onCleanup(() => {
        pendingRequestLoadVersion += 1;
      });

      pendingRequest.value = undefined;
      message.value = undefined;

      if (!nextState) {
        return;
      }

      const request = await getDeviceDirectoryAccessRequest(nextState);

      if (currentLoadVersion !== pendingRequestLoadVersion) {
        return;
      }

      pendingRequest.value = request;
    },
    { immediate: true },
  );

  const grantDisabled = computed(() => !pendingRequest.value || isGrantLoading.value);
  const recoveryMessage = computed(() => {
    if (message.value) {
      return message.value;
    }

    const currentState = state.value;

    if (!currentState) {
      return '';
    }

    return `Mioframe remembers "${currentState.spaceName}", but your browser requires permission before opening it.`;
  });

  const grantAccess = async () => {
    const request = pendingRequest.value;

    if (!request || isGrantLoading.value) {
      return { status: 'missing' as const };
    }

    isGrantLoading.value = true;

    try {
      const permissionState = await request.handle.requestPermission({
        mode: request.mode,
      });
      const result = await resolveDeviceDirectoryAccessRequest({
        mode: request.mode,
        permissionState,
        spaceName: request.spaceName,
      });

      if (result.status === 'granted') {
        message.value = undefined;
        return result;
      }

      message.value =
        'Mioframe still cannot open this space because your browser did not grant permission.';
      pendingRequest.value = result.request ?? request;

      return result;
    } finally {
      isGrantLoading.value = false;
    }
  };

  const cancelAccess = async () => {
    const currentState = state.value;

    if (!currentState) {
      return false;
    }

    await cancelDeviceDirectoryAccessRequest(currentState);
    pendingRequest.value = undefined;
    message.value = undefined;

    return true;
  };

  return {
    cancelAccess,
    grantAccess,
    grantDisabled,
    isGrantLoading,
    message,
    pendingRequest,
    recoveryState: computed(() => toValue(state)),
    recoveryMessage,
  };
};
