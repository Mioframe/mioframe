import { computed, ref } from 'vue';
import { captureDiagnosticException } from '@shared/lib/diagnostics';
import { DomainError } from '@shared/lib/error';
import { getFileSystemAccessRecovery, isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { ZipArchiveErrorCode } from '@shared/lib/zipArchive';
import { useMainServiceClient } from '@shared/service';
import { getZipImportPartialFailureDetails, RepositoryZipErrorCode } from '@shared/service';
import type { ZipImportProgress, ZipImportSummary } from '@shared/service';
import { useDiagnosticsErrorPromptTrigger } from '@feature/diagnosticsErrorPrompt';
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
  getFileSystemAccessRecovery(error) !== undefined ||
  (error instanceof DomainError &&
    (error.code === ZipArchiveErrorCode.unsafeEntryPath ||
      error.code === ZipArchiveErrorCode.archiveDamaged ||
      error.code === RepositoryZipErrorCode.importConflict ||
      error.code === RepositoryZipErrorCode.importResourceLimitExceeded));

/**
 * Runs the directory ZIP import flow with shared snackbar and diagnostics behavior. Stops before
 * any write when the archive has conflicts with existing files. Surfaces a distinct terminal
 * state when a write fails at or after the mutation phase starts, since the target folder may
 * then hold a partial import; the user retries by starting a new import into an empty directory.
 * @returns The import action plus reactive progress and running state.
 */
export const useImportZipAction = () => {
  const { pickZipFile } = useImportZip();
  const {
    repositories: { importDirectoryZip },
  } = useMainServiceClient();
  const { addSnackbar } = useSnackbar();
  const { requestHomeDiagnosticsPromptAfterHandledError } = useDiagnosticsErrorPromptTrigger();

  const state = ref<ImportZipDialogState>({ status: 'idle' });
  const operationRunning = ref(false);
  const isRunning = computed(() => operationRunning.value);
  let contextGeneration = 0;

  const resolveImportErrorMessage = (error: unknown): string => {
    const recovery = getFileSystemAccessRecovery(error);
    if (recovery?.operation === 'write') {
      return 'Write access is required. Open "Save failed", choose "Grant write access", then start the import again.';
    }
    if (recovery?.operation === 'read') {
      return 'Folder access is required. Restore access to this remembered local space, then start the import again.';
    }
    return error instanceof DomainError ? error.message : 'Could not import the ZIP archive';
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

  const showImportResult = (result: Awaited<ReturnType<typeof importDirectoryZip>>) => {
    if (result.status === 'conflicts') {
      state.value = { status: 'conflicts', ...result.report };
      return false;
    }
    state.value = { status: 'success', summary: result.summary };
    return true;
  };

  /**
   * Runs one import attempt against the given target and archive. Leaves the dialog state in
   * `success`, `conflicts`, `partial`, or `error` on completion instead of hiding it immediately,
   * so the caller can show the final result until the user closes the dialog.
   * @param targetPath - Absolute path to the directory to import into.
   * @param archiveFile - The user-selected ZIP archive file.
   * @returns Whether the import succeeded.
   */
  const runImport = async (targetPath: string, archiveFile: File): Promise<boolean> => {
    const generation = contextGeneration;
    operationRunning.value = true;
    state.value = { status: 'running' };
    const onProgress = (nextProgress: ZipImportProgress) => {
      if (generation === contextGeneration)
        state.value = { status: 'running', progress: nextProgress };
    };
    try {
      const result = await importDirectoryZip(targetPath, archiveFile, onProgress);
      return generation === contextGeneration ? showImportResult(result) : false;
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

  /**
   * Picks a ZIP archive and imports it into the target directory. Ignores repeated calls while
   * an import is already running for this action instance.
   * @param path - Absolute path to the directory to import into.
   * @returns `true` when the import succeeds, `false` when cancelled, ignored as a duplicate
   * call, or on a handled error.
   */
  const importDirectoryZipArchive = async (path: string): Promise<boolean> => {
    if (operationRunning.value) {
      return false;
    }

    let archiveFile: File | undefined;
    try {
      archiveFile = await pickZipFile();
    } catch (error) {
      // No dialog is open yet at this point, so a picker error is reported through the snackbar.
      addSnackbar({ text: resolveImportErrorMessage(error) });
      reportImportDiagnostics(error, 'importDirectoryZip');
      return false;
    }

    if (archiveFile === undefined) {
      return false;
    }
    return runImport(path, archiveFile);
  };

  /**
   * Closes the import ZIP dialog. Does nothing while the import is running. `partial` and
   * `conflicts` are both terminal results with no resume guarantee, so closing them is always
   * safe.
   */
  const closeImportZipDialog = () => {
    if (operationRunning.value) {
      return;
    }

    state.value = { status: 'idle' };
  };

  /** Invalidates in-flight progress delivery when the visible target context changes. */
  const invalidateImportZipContext = () => {
    contextGeneration += 1;
    state.value = { status: 'idle' };
  };

  return {
    importDirectoryZip: importDirectoryZipArchive,
    state,
    isRunning,
    closeImportZipDialog,
    invalidateImportZipContext,
  };
};
