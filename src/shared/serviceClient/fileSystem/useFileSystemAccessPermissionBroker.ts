import { type FileSystemAccessOperation } from '@shared/lib/fileSystem';
import { captureDiagnosticException } from '@shared/lib/diagnostics';
import type { WebFileSystemAccessMode } from '@shared/lib/webFileSystemProvider';
import { useMainServiceClient } from '@shared/service';
import {
  addWriteAccessPermissionPromptStartBreadcrumb,
  addWriteAccessPermissionResolvedBreadcrumb,
  addWriteAccessRequestStartBreadcrumb,
  reportWriteAccessMissingRequest,
  reportWriteAccessPermissionDenied,
  reportWriteAccessProviderFailure,
  reportWriteAccessReplayFailure,
  reportWriteAccessStaleResolve,
  reportWriteAccessStorageFailure,
} from './writeAccessRecoveryDiagnostics';

type FileSystemAccessRequestKey = {
  operation: FileSystemAccessOperation;
  requestedMode: WebFileSystemAccessMode;
  spaceName: string;
};

/**
 * Main-thread-only permission broker for remembered local spaces.
 * `requestPermission(descriptor?)` and `queryPermission(descriptor?)` accept an optional
 * descriptor whose `mode` is `'read'` or `'readwrite'`; the permission prompt still must run
 * inside the explicit user action that requested recovery.
 * The blocked operation identifies the pending recovery request. `requestedMode` identifies the
 * browser permission mode chosen by the user for this attempt.
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
    const attemptId = crypto.randomUUID();

    try {
      addWriteAccessRequestStartBreadcrumb();
      const request = await getTemporaryFileSystemAccessHandle(key);

      if (!request) {
        reportWriteAccessMissingRequest({ attemptId });
        return { status: 'error' };
      }

      let handle: FileSystemDirectoryHandle | undefined = request.handle;

      try {
        addWriteAccessPermissionPromptStartBreadcrumb();
        const permissionState = await handle.requestPermission({
          mode: key.requestedMode,
        });
        addWriteAccessPermissionResolvedBreadcrumb({ permissionState });

        const result = await resolveFileSystemAccessRequest({
          operation: request.operation,
          permissionState,
          spaceName: request.spaceName,
        });

        if (result.status === 'missing') {
          reportWriteAccessStaleResolve({ attemptId });
          return { status: 'error' };
        }

        if (result.status === 'grantedWithReplayFailures') {
          reportWriteAccessReplayFailure({ attemptId, replay: result.replay });
        }

        if (result.status === 'grantedWithStorageFailures') {
          reportWriteAccessStorageFailure({ attemptId, replay: result.replay });
        }

        if (result.status === 'denied' && key.operation === 'write') {
          reportWriteAccessPermissionDenied({ attemptId });
        }

        return { status: result.status };
      } finally {
        handle = undefined;
      }
    } catch (error) {
      captureDiagnosticException(error, {
        operation: 'requestAccess',
        feature: 'writeAccessRecovery',
      });
      reportWriteAccessProviderFailure({ attemptId });
      return { status: 'error' };
    }
  };

  return {
    requestAccess,
  };
};
