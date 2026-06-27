import { DomainError } from '@shared/lib/error';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { getFileSystemAccessRecovery } from '@shared/lib/fileSystem';
import { captureDiagnosticException } from '@shared/lib/diagnostics';
import { useMainServiceClient } from '@shared/service';
import { RepositoryImportErrorCode } from '@shared/service';
import { useDiagnosticsErrorPromptTrigger } from '@feature/diagnosticsErrorPrompt';
import { useFileSystemAccessPermissionBroker } from '@shared/serviceClient/fileSystem';
import { useDialog } from '@shared/ui/Dialog';
import { useSnackbar } from '@shared/ui/Snackbar';
import { ImportDocumentErrorCode } from './importDocumentErrorCode';
import { useImportDocument } from './useImportDocument';

const shouldSkipImportErrorReport = (error: unknown) =>
  isUserFileSelectionCancel(error) ||
  (error instanceof DomainError &&
    (error.code === RepositoryImportErrorCode.invalidJson ||
      error.code === RepositoryImportErrorCode.invalidDocumentFormat));

/**
 * Runs the document JSON import flow with shared snackbar and diagnostics behavior.
 * @returns Shared import action for feature callers that import a document into a directory.
 */
export const useImportDocumentAction = () => {
  const { pickJsonFile } = useImportDocument();
  const {
    repositories: { importDocumentFromJsonPath, importDocumentFromJsonFile },
  } = useMainServiceClient();
  const { addSnackbar } = useSnackbar();
  const { confirm } = useDialog();
  const { requestAccess } = useFileSystemAccessPermissionBroker();
  const { requestDiagnosticsErrorPrompt } = useDiagnosticsErrorPromptTrigger();

  const reportImportError = (error: unknown, diagnosticsAction: string) => {
    const recovery = getFileSystemAccessRecovery(error, { operation: 'write' });

    addSnackbar({
      text: recovery
        ? 'Grant write access to import documents into this remembered space.'
        : error instanceof DomainError
          ? error.message
          : 'Could not import the document',
    });

    if (!shouldSkipImportErrorReport(error)) {
      const reportError =
        error instanceof DomainError
          ? error
          : new DomainError('Could not import the document', {
              cause: error,
              code: ImportDocumentErrorCode.documentImportFailed,
            });
      captureDiagnosticException(reportError, {
        feature: 'documentImport',
        action: diagnosticsAction,
      });
      requestDiagnosticsErrorPrompt({ source: 'documentImport', placement: 'home' });
    }
  };

  /**
   * Handles write-access recovery for a failed create operation and retries once after granting
   * access. Throws the original error when it is not a write-access recovery error, so the caller
   * can propagate it through the unified error handler.
   * @param error - The error that triggered the recovery attempt.
   * @param retry - Operation to retry after access is granted.
   * @returns The retry result, or `undefined` when the user cancelled or access was denied.
   */
  const withWriteAccessRecovery = async (
    error: unknown,
    retry: () => Promise<string | undefined>,
  ): Promise<string | undefined> => {
    const recovery = getFileSystemAccessRecovery(error, { operation: 'write' });

    if (!recovery) {
      throw error;
    }

    const shouldGrantAccess = await confirm({
      headline: 'Grant write access',
      supportingText: `Mioframe remembers "${recovery.spaceName}", but your browser requires write access before importing a document into it.`,
      confirmLabel: 'Grant access',
      cancelLabel: 'Not now',
    });

    if (!shouldGrantAccess) {
      addSnackbar({
        text: 'Grant write access to import documents into this remembered space.',
      });
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
      addSnackbar({
        text:
          result.status === 'denied'
            ? 'Importing documents is not allowed in this remembered space because your browser denied write access.'
            : 'Could not request browser permission. Try again from this action.',
      });
      return undefined;
    }

    return retry();
  };

  const importDocument = async (path: string): Promise<string | undefined> => {
    // Pick the file ONCE outside the retry — the file picker must not reopen on write-access retry.
    let file: File | undefined;

    try {
      file = await pickJsonFile();
    } catch (error) {
      reportImportError(error, 'importDocumentJson');
      return undefined;
    }

    if (file === undefined) {
      return undefined;
    }

    try {
      let documentId: string | undefined;

      try {
        documentId = await importDocumentFromJsonFile(path, file);
      } catch (error) {
        documentId = await withWriteAccessRecovery(error, () =>
          importDocumentFromJsonFile(path, file),
        );
      }

      if (!documentId) {
        return undefined;
      }

      addSnackbar({ text: 'JSON imported as a new Mioframe document.' });

      return documentId;
    } catch (error) {
      reportImportError(error, 'importDocumentJson');
      return undefined;
    }
  };

  /**
   * Runs a VFS path-based import with write-access recovery and retry, then shows a success
   * snackbar.
   * @param targetDirectoryPath - Target repository directory path.
   * @param sourceFilePath - Absolute VFS path to the source JSON file.
   * @returns The created document ID, or `undefined` when cancelled or on a handled error.
   */
  const importDocumentFromPath = async (
    targetDirectoryPath: string,
    sourceFilePath: string,
  ): Promise<string | undefined> => {
    const shouldImport = await confirm({
      headline: 'Import document',
      supportingText: 'Import this JSON file as a new Mioframe document in the current folder?',
      confirmLabel: 'Import',
      cancelLabel: 'Cancel',
    });

    if (!shouldImport) {
      return undefined;
    }

    try {
      let documentId: string | undefined;

      try {
        documentId = await importDocumentFromJsonPath(targetDirectoryPath, sourceFilePath);
      } catch (error) {
        documentId = await withWriteAccessRecovery(error, () =>
          importDocumentFromJsonPath(targetDirectoryPath, sourceFilePath),
        );
      }

      if (!documentId) {
        return undefined;
      }

      addSnackbar({ text: 'JSON imported as a new Mioframe document.' });

      return documentId;
    } catch (error) {
      reportImportError(error, 'importDocumentFromPath');
      return undefined;
    }
  };

  return {
    importDocument,
    importDocumentFromPath,
  };
};
