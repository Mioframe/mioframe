import { type FileSystemAccessOperation } from '@shared/lib/fileSystem';
import { useMainServiceClient } from '@shared/service';
import { computed, ref } from 'vue';

type FileSystemAccessRequestKey = {
  operation: FileSystemAccessOperation;
  spaceName: string;
};

type PreparedFileSystemAccessRequest = FileSystemAccessRequestKey & {
  handle: FileSystemDirectoryHandle;
};

const operationToMode = (
  operation: FileSystemAccessOperation,
): FileSystemHandlePermissionDescriptor['mode'] => (operation === 'write' ? 'readwrite' : 'read');

/**
 * Main-thread-only broker that temporarily holds a browser handle just long enough
 * to call requestPermission during a user-triggered access-recovery flow.
 * The service remains the source of truth for pending requests and provider refresh.
 * @returns Broker helpers for preparing, requesting, and clearing temporary permission handles.
 */
export const useFileSystemAccessPermissionBroker = () => {
  const {
    fileSystem: { prepareFileSystemAccessRequest, resolveFileSystemAccessRequest },
  } = useMainServiceClient();
  const preparedRequest = ref<PreparedFileSystemAccessRequest>();

  const matchesPreparedRequest = (
    key: FileSystemAccessRequestKey,
    request: PreparedFileSystemAccessRequest | undefined = preparedRequest.value,
  ) => request?.operation === key.operation && request.spaceName === key.spaceName;

  const clearPreparedRequest = (key?: FileSystemAccessRequestKey) => {
    if (!key || matchesPreparedRequest(key)) {
      preparedRequest.value = undefined;
    }
  };

  const prepareAccessRequest = async (key: FileSystemAccessRequestKey) => {
    clearPreparedRequest(key);

    const request = await prepareFileSystemAccessRequest(key);

    if (!request) {
      return undefined;
    }

    preparedRequest.value = request;

    return request;
  };

  const requestPreparedAccess = async (
    key: FileSystemAccessRequestKey,
  ): Promise<{ status: 'granted' | 'denied' | 'cancelled' | 'error' }> => {
    const request = matchesPreparedRequest(key)
      ? preparedRequest.value
      : await prepareAccessRequest(key);

    if (!request) {
      return { status: 'error' };
    }

    clearPreparedRequest(key);

    let permissionState: PermissionState;

    try {
      permissionState = await request.handle.requestPermission({
        mode: operationToMode(request.operation),
      });
    } catch {
      return { status: 'error' };
    }

    const result = await resolveFileSystemAccessRequest({
      operation: request.operation,
      permissionState,
      spaceName: request.spaceName,
    });

    return {
      status: result.status === 'missing' ? 'error' : result.status,
    };
  };

  return {
    clearPreparedRequest,
    hasPreparedRequest: computed(() => preparedRequest.value !== undefined),
    prepareAccessRequest,
    requestPreparedAccess,
  };
};
