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
 * `requestPermission(descriptor?)` and `queryPermission(descriptor?)` accept an optional
 * descriptor whose `mode` is `'read'` or `'readwrite'`; the permission prompt still must run
 * inside the explicit user action that requested recovery.
 * @returns One-shot access broker with no prepared-handle state.
 */
export const useFileSystemAccessPermissionBroker = () => {
  const {
    fileSystem: { getTemporaryFileSystemAccessHandle, resolveFileSystemAccessRequest },
  } = useMainServiceClient();

  const requestAccess = async (
    key: FileSystemAccessRequestKey,
  ): Promise<{
    status: 'granted' | 'grantedWithReplayFailures' | 'denied' | 'cancelled' | 'error';
  }> => {
    try {
      const request = await getTemporaryFileSystemAccessHandle(key);

      if (!request) {
        return { status: 'error' };
      }

      let handle: FileSystemDirectoryHandle | undefined = request.handle;

      try {
        const permissionState = await handle.requestPermission({
          mode: operationToMode(request.operation),
        });

        const result = await resolveFileSystemAccessRequest({
          operation: request.operation,
          permissionState,
          spaceName: request.spaceName,
        });

        return {
          status: result.status === 'missing' ? 'error' : result.status,
        };
      } finally {
        handle = undefined;
      }
    } catch {
      return { status: 'error' };
    }
  };

  return {
    requestAccess,
  };
};
