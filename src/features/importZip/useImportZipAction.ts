import { ref } from 'vue';
import { captureDiagnosticException } from '@shared/lib/diagnostics';
import { DomainError } from '@shared/lib/error';
import { getFileSystemAccessRecovery, isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { ZipArchiveErrorCode } from '@shared/lib/zipArchive';
import { useMainServiceClient } from '@shared/service';
import { RepositoryZipErrorCode } from '@shared/service';
import type { ZipImportProgress } from '@shared/service';
import { useDiagnosticsErrorPromptTrigger } from '@feature/diagnosticsErrorPrompt';
import { useFileSystemAccessPermissionBroker } from '@shared/serviceClient/fileSystem';
import { useDialog } from '@shared/ui/Dialog';
import { useSnackbar } from '@shared/ui/Snackbar';
import { ImportZipErrorCode } from './importZipErrorCode';
import { useImportZip } from './useImportZip';

const shouldSkipImportErrorReport = (error: unknown) =>
  isUserFileSelectionCancel(error) ||
  (error instanceof DomainError &&
    (error.code === ZipArchiveErrorCode.unsafeEntryPath ||
      error.code === ZipArchiveErrorCode.archiveDamaged ||
      error.code === RepositoryZipErrorCode.importConflict));

/**
 * Runs the directory ZIP import flow with shared snackbar, write-access recovery, and diagnostics
 * behavior. Stops before any write when the archive has conflicts with existing files.
 * @returns The import action plus reactive progress and running state for a progress sheet.
 */
export const useImportZipAction = () => {
  const { pickZipFile } = useImportZip();
  const {
    repositories: { importDirectoryZip },
  } = useMainServiceClient();
  const { addSnackbar } = useSnackbar();
  const { confirm } = useDialog();
  const { requestAccess } = useFileSystemAccessPermissionBroker();
  const { requestHomeDiagnosticsPromptAfterHandledError } = useDiagnosticsErrorPromptTrigger();

  const progress = ref<ZipImportProgress | undefined>(undefined);
  const isRunning = ref(false);

  const reportImportError = (error: unknown, diagnosticsAction: string) => {
    const recovery = getFileSystemAccessRecovery(error, { operation: 'write' });

    addSnackbar({
      text: recovery
        ? 'Grant write access to import a ZIP archive into this remembered space.'
        : error instanceof DomainError
          ? error.message
          : 'Could not import the ZIP archive',
    });

    if (!shouldSkipImportErrorReport(error)) {
      const reportError =
        error instanceof DomainError
          ? error
          : new DomainError('Could not import the ZIP archive', {
              cause: error,
              code: ImportZipErrorCode.directoryImportFailed,
            });
      captureDiagnosticException(reportError, { feature: 'importZip', action: diagnosticsAction });
      requestHomeDiagnosticsPromptAfterHandledError();
    }
  };

  /**
   * Handles write-access recovery for a failed import and retries once after granting access.
   * Throws the original error when it is not a write-access recovery error, so the caller can
   * propagate it through the unified error handler.
   * @param error - The error that triggered the recovery attempt.
   * @param retry - Operation to retry after access is granted.
   * @returns Whether the retry ran and completed successfully.
   */
  const withWriteAccessRecovery = async (
    error: unknown,
    retry: () => Promise<void>,
  ): Promise<boolean> => {
    const recovery = getFileSystemAccessRecovery(error, { operation: 'write' });

    if (!recovery) {
      throw error;
    }

    const shouldGrantAccess = await confirm({
      headline: 'Grant write access',
      supportingText: `Mioframe remembers "${recovery.spaceName}", but your browser requires write access before importing a ZIP archive into it.`,
      confirmLabel: 'Grant access',
      cancelLabel: 'Not now',
    });

    if (!shouldGrantAccess) {
      addSnackbar({
        text: 'Grant write access to import a ZIP archive into this remembered space.',
      });
      return false;
    }

    const result = await requestAccess({
      operation: recovery.operation,
      requestedMode: 'readwrite',
      spaceName: recovery.spaceName,
    });

    if (
      result.status !== 'granted' &&
      result.status !== 'grantedWithReplayFailures' &&
      result.status !== 'grantedWithStorageFailures'
    ) {
      addSnackbar({
        text:
          result.status === 'denied'
            ? 'Importing a ZIP archive is not allowed in this remembered space because your browser denied write access.'
            : 'Could not request browser permission. Try again from this action.',
      });
      return false;
    }

    await retry();
    return true;
  };

  /**
   * Picks a ZIP archive and imports it into the target directory.
   * @param path - Absolute path to the directory to import into.
   * @returns `true` when the import succeeds, `false` when cancelled or on a handled error.
   */
  const importDirectoryZipArchive = async (path: string): Promise<boolean> => {
    let file: File | undefined;

    try {
      file = await pickZipFile();
    } catch (error) {
      reportImportError(error, 'importDirectoryZip');
      return false;
    }

    if (file === undefined) {
      return false;
    }

    progress.value = undefined;

    try {
      isRunning.value = true;

      const archiveBytes = new Uint8Array(await file.arrayBuffer());
      const onProgress = (nextProgress: ZipImportProgress) => {
        progress.value = nextProgress;
      };

      let succeeded = false;

      try {
        await importDirectoryZip(path, archiveBytes, onProgress);
        succeeded = true;
      } catch (error) {
        succeeded = await withWriteAccessRecovery(error, () =>
          importDirectoryZip(path, archiveBytes, onProgress),
        );
      }

      if (!succeeded) {
        return false;
      }

      addSnackbar({ text: 'ZIP archive imported into this folder.' });
      return true;
    } catch (error) {
      reportImportError(error, 'importDirectoryZip');
      return false;
    } finally {
      isRunning.value = false;
    }
  };

  return { importDirectoryZip: importDirectoryZipArchive, progress, isRunning };
};
