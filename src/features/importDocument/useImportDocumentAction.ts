import { DomainError } from '@shared/lib/error';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { getFileSystemAccessRecovery } from '@shared/lib/fileSystem';
import { captureDiagnosticException } from '@shared/lib/diagnostics';
import { RepositoryImportErrorCode } from '@shared/service';
import { useFileSystemAccessPermissionBroker } from '@shared/serviceClient/fileSystem';
import { useDialog } from '@shared/ui/Dialog';
import { useSnackbar } from '@shared/ui/Snackbar';
import { ImportDocumentErrorCode } from './importDocumentErrorCode';
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
  const { createImportedDocument, readImportDocumentDraft, importDocumentFromJsonPath } =
    useImportDocument();
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
   * Runs `performCreate` with write-access recovery and retry, then shows a success snackbar.
   * Errors that are not write-access errors bubble to the caller for unified error handling.
   * @param performCreate
   * @param diagnosticsAction
   */
  const runImport = async (
    performCreate: () => Promise<string | undefined>,
    diagnosticsAction: string,
  ): Promise<string | undefined> => {
    try {
      let documentId: string | undefined;

      try {
        documentId = await performCreate();
      } catch (error) {
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

        documentId = await performCreate();
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

    return runImport(() => createImportedDocument(path, draft), 'importDocumentJson');
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

    return runImport(
      () => importDocumentFromJsonPath(targetDirectoryPath, sourceFilePath),
      'importDocumentFromPath',
    );
  };

  return {
    importDocument,
    importDocumentFromPath,
  };
};
