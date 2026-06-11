import { DomainError } from '@shared/lib/error';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { getFileSystemAccessRecovery } from '@shared/lib/fileSystem';
import { captureDiagnosticException } from '@shared/lib/diagnostics';
import { useMainServiceClient } from '@shared/service';
import { RepositoryImportErrorCode } from '@shared/service';
import { useFileSystemAccessPermissionBroker } from '@shared/serviceClient/fileSystem';
import { useDialog } from '@shared/ui/Dialog';
import { useSnackbar } from '@shared/ui/Snackbar';
import { ImportDocumentErrorCode } from './importDocumentErrorCode';
import type { ImportedDocumentDraft } from './useImportDocument';
import { useImportDocument } from './useImportDocument';

const shouldSkipImportErrorReport = (error: unknown) =>
  isUserFileSelectionCancel(error) ||
  (error instanceof DomainError &&
    (error.code === ImportDocumentErrorCode.invalidJson ||
      error.code === ImportDocumentErrorCode.invalidDocumentFormat ||
      error.code === RepositoryImportErrorCode.invalidJson ||
      error.code === RepositoryImportErrorCode.invalidDocumentFormat));

/**
 * Runs the document JSON import flow with shared snackbar and diagnostics behavior.
 * @returns Shared import action for feature callers that import a document into a directory.
 */
export const useImportDocumentAction = () => {
  const { createImportedDocument, readImportDocumentDraft } = useImportDocument();
  const {
    repositories: { importDocumentFromJsonPath },
  } = useMainServiceClient();
  const { addSnackbar } = useSnackbar();
  const { confirm } = useDialog();
  const { requestAccess } = useFileSystemAccessPermissionBroker();

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

    const result = await requestAccess(recovery);

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

  /**
   * Runs a draft-based import with write-access recovery and retry, then shows a success snackbar.
   * @param path - Target directory path.
   * @param draft - Validated document draft from the file picker.
   * @param diagnosticsAction - Action label for diagnostics reporting.
   * @returns The created document ID, or `undefined` when cancelled or on a handled error.
   */
  const runDraftImport = async (
    path: string,
    draft: ImportedDocumentDraft,
    diagnosticsAction: string,
  ): Promise<string | undefined> => {
    try {
      let documentId: string | undefined;

      try {
        documentId = await createImportedDocument(path, draft);
      } catch (error) {
        documentId = await withWriteAccessRecovery(error, () =>
          createImportedDocument(path, draft),
        );
      }

      if (!documentId) {
        return undefined;
      }

      addSnackbar({ text: 'Document imported into this Mioframe folder' });

      return documentId;
    } catch (error) {
      reportImportError(error, diagnosticsAction);
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
  const runJsonPathImport = async (
    targetDirectoryPath: string,
    sourceFilePath: string,
  ): Promise<string | undefined> => {
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

      addSnackbar({ text: 'Document imported into this Mioframe folder' });

      return documentId;
    } catch (error) {
      reportImportError(error, 'importDocumentFromPath');
      return undefined;
    }
  };

  const importDocument = async (path: string): Promise<string | undefined> => {
    // Read draft ONCE outside the retry — the file picker must not reopen on write-access retry.
    let draft: Awaited<ReturnType<typeof readImportDocumentDraft>>;

    try {
      draft = await readImportDocumentDraft();
    } catch (error) {
      reportImportError(error, 'importDocumentJson');
      return undefined;
    }

    if (!draft) {
      return undefined;
    }

    return runDraftImport(path, draft, 'importDocumentJson');
  };

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

    return runJsonPathImport(targetDirectoryPath, sourceFilePath);
  };

  return {
    importDocument,
    importDocumentFromPath,
  };
};
