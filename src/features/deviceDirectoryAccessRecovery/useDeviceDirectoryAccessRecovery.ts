import { useDeviceDirectoryAccessRecoveryState } from '@entity/deviceDirectoryAccess';
import { useMainServiceClient } from '@shared/service';
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
    fileSystem: { getDeviceDirectoryAccessRequest, resolveDeviceDirectoryAccessRequest },
  } = useMainServiceClient();

  const isGrantLoading = ref(false);
  const message = ref<string>();
  const pendingRequest = ref<
    | {
        id: string;
        name: string;
        handle: FileSystemDirectoryHandle;
        mode: 'readwrite';
      }
    | undefined
  >();

  watch(
    () => state.value?.requestId,
    async (requestId) => {
      pendingRequest.value = undefined;
      message.value = undefined;

      if (!requestId) {
        return;
      }

      pendingRequest.value = await getDeviceDirectoryAccessRequest(requestId);
    },
    { immediate: true },
  );

  const grantDisabled = computed(() => !pendingRequest.value || isGrantLoading.value);

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
        id: request.id,
        permissionState,
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

  return {
    grantAccess,
    grantDisabled,
    isGrantLoading,
    message,
    pendingRequest,
    recoveryState: computed(() => toValue(state)),
  };
};
