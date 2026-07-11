import { computed, ref } from 'vue';
import { captureDiagnosticException } from '@shared/lib/diagnostics';
import { DomainError } from '@shared/lib/error';
import { getFileSystemAccessRecovery, isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { ZipArchiveErrorCode } from '@shared/lib/zipArchive';
import { useMainServiceClient } from '@shared/service';
import { getZipImportPartialFailureDetails, RepositoryZipErrorCode } from '@shared/service';
import type { ZipImportOptions, ZipImportProgress, ZipImportSummary } from '@shared/service';
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
  | { status: 'conflicts'; total: number; paths: string[]; truncated: boolean }
  | { status: 'success'; summary: ZipImportSummary }
  | { status: 'partial'; summary: ZipImportSummary }
  | { status: 'error'; message: string };

/** Visible-only import ZIP dialog states. The dialog component must never render `idle`. */
export type ImportZipVisibleDialogState = Exclude<
  ImportZipDialogState,
  {
    /** Discriminant excluded from the visible dialog state. */
    status: 'idle';
  }
>;

const shouldSkipImportErrorReport = (error: unknown) =>
  isUserFileSelectionCancel(error) ||
  (error instanceof DomainError &&
    (error.code === ZipArchiveErrorCode.unsafeEntryPath ||
      error.code === ZipArchiveErrorCode.archiveDamaged ||
      error.code === RepositoryZipErrorCode.importConflict ||
      error.code === RepositoryZipErrorCode.importResourceLimitExceeded));

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
  const operationRunning = ref(false);
  const isRunning = computed(() => operationRunning.value);
  let contextGeneration = 0;

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
   * @param canContinue - Whether the visible target context still owns this operation.
   * @returns Whether the retry ran and completed successfully.
   */
  const withWriteAccessRecovery = async <T>(
    error: unknown,
    retry: () => Promise<T>,
    canContinue: () => boolean,
  ): Promise<T | undefined> => {
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

    if (!canContinue()) return undefined;

    if (!shouldGrantAccess) {
      state.value = {
        status: 'error',
        message: 'Grant write access to import a ZIP archive into this remembered space.',
      };
      return undefined;
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
      return undefined;
    }

    return await retry();
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
  let selectedFile: File | undefined;
  let selectedPath: string | undefined;

  const showImportResult = (result: Awaited<ReturnType<typeof importDirectoryZip>>) => {
    if (result.status === 'conflicts') {
      state.value = { status: 'conflicts', ...result.report };
      return false;
    }
    state.value = { status: 'success', summary: result.summary };
    return true;
  };

  const runImport = async (options: ZipImportOptions): Promise<boolean> => {
    if (!selectedFile || !selectedPath) return false;
    const archiveFile = selectedFile;
    const targetPath = selectedPath;
    const generation = contextGeneration;
    operationRunning.value = true;
    state.value = { status: 'running' };
    const onProgress = (nextProgress: ZipImportProgress) => {
      if (generation === contextGeneration)
        state.value = { status: 'running', progress: nextProgress };
    };
    try {
      try {
        const result = await importDirectoryZip(targetPath, archiveFile, onProgress, options);
        return generation === contextGeneration ? showImportResult(result) : false;
      } catch (error) {
        const recoveredResult = await withWriteAccessRecovery(
          error,
          () => importDirectoryZip(targetPath, archiveFile, onProgress, options),
          () => generation === contextGeneration,
        );
        return recoveredResult && generation === contextGeneration
          ? showImportResult(recoveredResult)
          : false;
      }
    } catch (error) {
      if (generation !== contextGeneration) return false;
      const partial = getZipImportPartialFailureDetails(error);
      if (partial) {
        state.value = { status: 'partial', summary: partial.importSummary };
        reportImportDiagnostics(error, 'importDirectoryZipPartial');
      } else failImportDialog(error, 'importDirectoryZip');
      return false;
    } finally {
      operationRunning.value = false;
      if (generation !== contextGeneration) state.value = { status: 'idle' };
    }
  };

  const importDirectoryZipArchive = async (path: string): Promise<boolean> => {
    if (operationRunning.value) {
      return false;
    }

    try {
      selectedFile = await pickZipFile();
    } catch (error) {
      // No dialog is open yet at this point, so a picker error is reported through the snackbar.
      addSnackbar({ text: resolveImportErrorMessage(error) });
      reportImportDiagnostics(error, 'importDirectoryZip');
      return false;
    }

    if (selectedFile === undefined) {
      return false;
    }
    selectedPath = path;
    return runImport({ conflictPolicy: 'abort' });
  };

  /**
   * Retries the retained ordinary conflict with skip-existing policy.
   * @returns Whether the retry completed successfully.
   */
  const retryImportSkippingExisting = async () => {
    if (operationRunning.value || state.value.status !== 'conflicts') return false;
    return runImport({ conflictPolicy: 'skipExisting' });
  };

  /**
   * Closes the import ZIP dialog. Does nothing while the import is running. `partial` is a
   * terminal result with no resume guarantee, so closing it is always safe.
   */
  const closeImportZipDialog = () => {
    if (operationRunning.value) {
      return;
    }

    state.value = { status: 'idle' };
    selectedFile = undefined;
    selectedPath = undefined;
  };

  /** Invalidates retained retry state when the visible target context changes. */
  const invalidateImportZipContext = () => {
    contextGeneration += 1;
    state.value = { status: 'idle' };
    selectedFile = undefined;
    selectedPath = undefined;
  };

  return {
    importDirectoryZip: importDirectoryZipArchive,
    state,
    isRunning,
    retryImportSkippingExisting,
    closeImportZipDialog,
    invalidateImportZipContext,
  };
};
