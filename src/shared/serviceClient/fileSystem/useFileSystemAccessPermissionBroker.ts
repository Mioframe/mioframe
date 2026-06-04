import { type FileSystemAccessOperation } from '@shared/lib/fileSystem';
import {
  DiagnosticClassification,
  DiagnosticFeature,
  DiagnosticOperation,
  DiagnosticProviderKind,
  DiagnosticResult,
  DiagnosticSeverity,
  DiagnosticStage,
  reportDiagnosticEvent,
  sanitizeDiagnosticError,
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
    const attemptId = crypto.randomUUID();

    try {
      const request = await getTemporaryFileSystemAccessHandle(key);

      if (!request) {
        reportDiagnosticEvent({
          severity: DiagnosticSeverity.Warning,
          feature: DiagnosticFeature.WriteAccessRecovery,
          operation: DiagnosticOperation.RequestAccess,
          stage: DiagnosticStage.AccessRequestPrepare,
          result: DiagnosticResult.StaleRequest,
          classification: DiagnosticClassification.StaleRequest,
          providerKind: DiagnosticProviderKind.WebFileSystem,
          attemptId,
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
            severity: DiagnosticSeverity.Warning,
            feature: DiagnosticFeature.WriteAccessRecovery,
            operation: DiagnosticOperation.ResolveAccessRequest,
            stage: DiagnosticStage.AccessRequestResolved,
            result: DiagnosticResult.StaleRequest,
            classification: DiagnosticClassification.StaleRequest,
            providerKind: DiagnosticProviderKind.WebFileSystem,
            attemptId,
          });
          return { status: 'error' };
        }

        if (result.status === 'grantedWithReplayFailures') {
          reportDiagnosticEvent({
            severity: DiagnosticSeverity.Error,
            feature: DiagnosticFeature.WriteAccessRecovery,
            operation: DiagnosticOperation.ResolveAccessRequest,
            stage: DiagnosticStage.AccessRequestResolved,
            result: DiagnosticResult.ReplayFailure,
            classification: DiagnosticClassification.StorageFailure,
            providerKind: DiagnosticProviderKind.WebFileSystem,
            attemptId,
          });
        }

        if (result.status === 'grantedWithStorageFailures') {
          reportDiagnosticEvent({
            severity: DiagnosticSeverity.Error,
            feature: DiagnosticFeature.WriteAccessRecovery,
            operation: DiagnosticOperation.ResolveAccessRequest,
            stage: DiagnosticStage.AccessRequestResolved,
            result: DiagnosticResult.StorageFailure,
            classification: DiagnosticClassification.StorageFailure,
            providerKind: DiagnosticProviderKind.WebFileSystem,
            attemptId,
          });
        }

        if (result.status === 'denied' && key.operation === 'write') {
          reportDiagnosticEvent({
            severity: DiagnosticSeverity.Warning,
            feature: DiagnosticFeature.WriteAccessRecovery,
            operation: DiagnosticOperation.ResolveAccessRequest,
            stage: DiagnosticStage.AccessRequestResolved,
            result: DiagnosticResult.PermissionDenied,
            classification: DiagnosticClassification.AccessDenied,
            providerKind: DiagnosticProviderKind.WebFileSystem,
            attemptId,
          });
        }

        return { status: result.status };
      } finally {
        handle = undefined;
      }
    } catch (error) {
      reportDiagnosticEvent({
        severity: DiagnosticSeverity.Error,
        feature: DiagnosticFeature.WriteAccessRecovery,
        operation: DiagnosticOperation.RequestAccess,
        stage: DiagnosticStage.AccessRequestPrepare,
        result: DiagnosticResult.ProviderFailure,
        classification: DiagnosticClassification.ProviderFailure,
        providerKind: DiagnosticProviderKind.WebFileSystem,
        attemptId,
        error: sanitizeDiagnosticError(error),
      });
      return { status: 'error' };
    }
  };

  return {
    requestAccess,
  };
};
