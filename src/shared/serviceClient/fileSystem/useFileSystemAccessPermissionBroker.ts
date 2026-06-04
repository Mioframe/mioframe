import { type FileSystemAccessOperation } from '@shared/lib/fileSystem';
import {
  DiagnosticClassification,
  DiagnosticFeature,
  DiagnosticOperation,
  DiagnosticResult,
  DiagnosticSeverity,
  DiagnosticStage,
  reportDiagnosticEvent,
} from '@shared/lib/diagnostics';
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
        reportDiagnosticEvent({
          severity: DiagnosticSeverity.warning,
          feature: DiagnosticFeature.writeAccessRecovery,
          operation: DiagnosticOperation.requestAccess,
          stage: DiagnosticStage.accessRequestPrepare,
          result: DiagnosticResult.staleRequest,
          classification: DiagnosticClassification.staleRequest,
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

        if (result.status === 'missing') {
          reportDiagnosticEvent({
            severity: DiagnosticSeverity.warning,
            feature: DiagnosticFeature.writeAccessRecovery,
            operation: DiagnosticOperation.resolveAccessRequest,
            stage: DiagnosticStage.accessRequestResolved,
            result: DiagnosticResult.staleRequest,
            classification: DiagnosticClassification.staleRequest,
          });
          return { status: 'error' };
        }

        if (result.status === 'grantedWithReplayFailures') {
          reportDiagnosticEvent({
            severity: DiagnosticSeverity.error,
            feature: DiagnosticFeature.writeAccessRecovery,
            operation: DiagnosticOperation.resolveAccessRequest,
            stage: DiagnosticStage.accessRequestResolved,
            result: DiagnosticResult.replayFailure,
            classification: DiagnosticClassification.storageFailure,
          });
        }

        if (result.status === 'grantedWithStorageFailures') {
          reportDiagnosticEvent({
            severity: DiagnosticSeverity.error,
            feature: DiagnosticFeature.writeAccessRecovery,
            operation: DiagnosticOperation.resolveAccessRequest,
            stage: DiagnosticStage.accessRequestResolved,
            result: DiagnosticResult.storageFailure,
            classification: DiagnosticClassification.storageFailure,
          });
        }

        return { status: result.status };
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
