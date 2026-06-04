import { type FileSystemAccessOperation } from '@shared/lib/fileSystem';
import { reportHandledError } from '@shared/lib/reportHandledError';
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
    status:
      | 'granted'
      | 'grantedWithReplayFailures'
      | 'grantedWithStorageFailures'
      | 'denied'
      | 'cancelled'
      | 'error';
  }> => {
    try {
      const request = await getTemporaryFileSystemAccessHandle(key);

      if (!request) {
        reportHandledError(new Error('File system access request missing or already resolved'), {
          feature: 'writeAccessRecovery',
          action: 'requestAccess',
          metadata: {
            recoveryStage: 'accessRequestPrepare',
            classification: 'staleRequest',
            operation: key.operation,
          },
        });
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

        const resolvedStatus = result.status === 'missing' ? 'error' : result.status;

        if (result.status === 'missing') {
          reportHandledError(
            new Error('File system access request resolved as missing after permission prompt'),
            {
              feature: 'writeAccessRecovery',
              action: 'resolveAccessRequest',
              metadata: {
                recoveryStage: 'accessRequestResolved',
                classification: 'staleRequest',
                operation: key.operation,
                permissionState,
              },
            },
          );
        } else if (result.status === 'grantedWithStorageFailures') {
          reportHandledError(
            new Error('Write access granted but pending save replay hit a storage failure'),
            {
              feature: 'writeAccessRecovery',
              action: 'resolveAccessRequest',
              metadata: {
                recoveryStage: 'accessRequestResolved',
                classification: 'storageFailure',
                operation: key.operation,
                resultStatus: result.status,
              },
            },
          );
        }

        return { status: resolvedStatus };
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
