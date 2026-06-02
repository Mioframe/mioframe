import { type FileSystemAccessOperation } from '@shared/lib/fileSystem';
import { useMainServiceClient } from '@shared/service';

type FileSystemAccessRequestKey = {
  operation: FileSystemAccessOperation;
  spaceName: string;
};

const operationToMode = (
  operation: FileSystemAccessOperation,
): FileSystemHandlePermissionDescriptor['mode'] => (operation === 'write' ? 'readwrite' : 'read');

/**
 * Main-thread-only permission broker for remembered local spaces.
 * `requestPermission()` requires transient user activation, so the handle is
 * fetched from the service only for one explicit user action.
 * @returns One-shot access broker with no prepared-handle state.
 */
export const useFileSystemAccessPermissionBroker = () => {
  const {
    fileSystem: { getTemporaryFileSystemAccessHandle, resolveFileSystemAccessRequest },
  } = useMainServiceClient();

  const requestAccess = async (
    key: FileSystemAccessRequestKey,
  ): Promise<{ status: 'granted' | 'denied' | 'cancelled' | 'error' }> => {
    const request = await getTemporaryFileSystemAccessHandle(key);

    if (!request) {
      return { status: 'error' };
    }

    let handle: FileSystemDirectoryHandle | undefined = request.handle;
    let permissionState: PermissionState;

    try {
      permissionState = await handle.requestPermission({
        mode: operationToMode(request.operation),
      });
    } catch {
      return { status: 'error' };
    } finally {
      handle = undefined;
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
    requestAccess,
  };
};
