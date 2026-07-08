import { computed, ref } from 'vue';
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

/**
 * Explicit lifecycle state for the ZIP import dialog. Distinguishes running progress from a
 * final success or error result so the dialog can stay open after completion until the user
 * closes it.
 */
export type ImportZipDialogState =
  | { status: 'idle' }
  | { status: 'running'; progress?: ZipImportProgress }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

const shouldSkipImportErrorReport = (error: unknown) =>
  isUserFileSelectionCancel(error) ||
  (error instanceof DomainError &&
    (error.code === ZipArchiveErrorCode.unsafeEntryPath ||
      error.code === ZipArchiveErrorCode.archiveDamaged ||
      error.code === RepositoryZipErrorCode.importConflict));

/**
 * Runs the directory ZIP import flow with shared snackbar, write-access recovery, and diagnostics
 * behavior. Stops before any write when the archive has conflicts with existing files. Surfaces a
 * distinct message when a write fails after an earlier write in the same import already
 * succeeded, since the target folder may then hold a partial import.
 * @returns The import action plus reactive progress and running state.
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

  const state = ref<ImportZipDialogState>({ status: 'idle' });
  const isRunning = computed(() => state.value.status === 'running');

  // A partial-write DomainError's message already says the target folder may hold a partial
  // import (see RepositoryZipErrorCode.importWritePartiallyFailed), so no special-casing is
  // needed here beyond the existing DomainError message passthrough.
  const resolveImportErrorMessage = (error: unknown): string => {
    const recovery = getFileSystemAccessRecovery(error, { operation: 'write' });

    return recovery
      ? 'Grant write access to import a ZIP archive into this remembered space.'
      : error instanceof DomainError
        ? error.message
        : 'Could not import the ZIP archive';
  };

  const reportImportDiagnostics = (error: unknown, diagnosticsAction: string) => {
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
   * Sets the import dialog to its final error state and reports diagnostics when applicable.
   * @param error - The error that ended the import.
   * @param diagnosticsAction - Diagnostics action tag for the reported exception.
   */
  const failImportDialog = (error: unknown, diagnosticsAction: string) => {
    state.value = { status: 'error', message: resolveImportErrorMessage(error) };
    reportImportDiagnostics(error, diagnosticsAction);
  };

  /**
   * Handles write-access recovery for a failed import and retries once after granting access.
   * Throws the original error when it is not a write-access recovery error, so the caller can
   * propagate it through the unified error handler. Recovery decline/denial is shown as a final
   * dialog error state rather than a snackbar, since the import dialog is already open by then.
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
      state.value = {
        status: 'error',
        message: 'Grant write access to import a ZIP archive into this remembered space.',
      };
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
      state.value = {
        status: 'error',
        message:
          result.status === 'denied'
            ? 'Importing a ZIP archive is not allowed in this remembered space because your browser denied write access.'
            : 'Could not request browser permission. Try again from this action.',
      };
      return false;
    }

    await retry();
    return true;
  };

  /**
   * Picks a ZIP archive and imports it into the target directory. Ignores repeated calls while
   * an import is already running for this action instance. Leaves the dialog state in `success`
   * or `error` on completion instead of hiding it immediately, so the caller can show the final
   * result until the user closes the dialog.
   * @param path - Absolute path to the directory to import into.
   * @returns `true` when the import succeeds, `false` when cancelled, ignored as a duplicate
   * call, or on a handled error.
   */
  const importDirectoryZipArchive = async (path: string): Promise<boolean> => {
    if (state.value.status === 'running') {
      return false;
    }

    let file: File | undefined;

    try {
      file = await pickZipFile();
    } catch (error) {
      // No dialog is open yet at this point, so a picker error is reported through the snackbar.
      addSnackbar({ text: resolveImportErrorMessage(error) });
      reportImportDiagnostics(error, 'importDirectoryZip');
      return false;
    }

    if (file === undefined) {
      return false;
    }

    state.value = { status: 'running' };

    const onProgress = (nextProgress: ZipImportProgress) => {
      state.value = { status: 'running', progress: nextProgress };
    };

    try {
      let succeeded = false;

      try {
        await importDirectoryZip(path, file, onProgress);
        succeeded = true;
      } catch (error) {
        succeeded = await withWriteAccessRecovery(error, () =>
          importDirectoryZip(path, file, onProgress),
        );
      }

      if (!succeeded) {
        return false;
      }

      state.value = { status: 'success', message: 'ZIP archive imported into this folder.' };
      return true;
    } catch (error) {
      failImportDialog(error, 'importDirectoryZip');
      return false;
    }
  };

  /**
   * Closes the import ZIP dialog. Does nothing while the import is running; only `success` and
   * `error` states can be dismissed.
   */
  const closeImportZipDialog = () => {
    if (state.value.status === 'running') {
      return;
    }

    state.value = { status: 'idle' };
  };

  return {
    importDirectoryZip: importDirectoryZipArchive,
    state,
    isRunning,
    closeImportZipDialog,
  };
};
