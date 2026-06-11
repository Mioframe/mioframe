import { DomainError } from '@shared/lib/error';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { getFileSystemAccessRecovery } from '@shared/lib/fileSystem';
import { captureDiagnosticException } from '@shared/lib/diagnostics';
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
      error.code === ImportDocumentErrorCode.invalidDocumentFormat));

/**
 * Runs the document JSON import flow with shared snackbar and diagnostics behavior.
 * @returns Shared import action for feature callers that import a document into a directory.
 */
export const useImportDocumentAction = () => {
  const { createImportedDocument, readImportDocumentDraft, readImportDocumentDraftFromPath } =
    useImportDocument();
  const { addSnackbar } = useSnackbar();
  const { confirm } = useDialog();
  const { requestAccess } = useFileSystemAccessPermissionBroker();

  const runImport = async (
    targetPath: string,
    readDraft: () => Promise<ImportedDocumentDraft | undefined>,
    diagnosticsAction: string,
  ): Promise<string | undefined> => {
    try {
      const draft = await readDraft();

      if (!draft) {
        return undefined;
      }

      let documentId: string | undefined;

      try {
        documentId = await createImportedDocument(targetPath, draft);
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

        documentId = await createImportedDocument(targetPath, draft);
      }

      if (!documentId) {
        return undefined;
      }

      addSnackbar({ text: 'Document imported into this Mioframe folder' });

      return documentId;
    } catch (error) {
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

      return undefined;
    }
  };

  const importDocument = async (path: string): Promise<string | undefined> => {
    return runImport(path, readImportDocumentDraft, 'importDocumentJson');
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
      targetDirectoryPath,
      () => readImportDocumentDraftFromPath(sourceFilePath),
      'importDocumentFromPath',
    );
  };

  return {
    importDocument,
    importDocumentFromPath,
  };
};
