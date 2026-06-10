import { DomainError } from '@shared/lib/error';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { getFileSystemAccessRecovery } from '@shared/lib/fileSystem';
import { captureDiagnosticException } from '@shared/lib/diagnostics';
import { useFileSystemAccessPermissionBroker } from '@shared/serviceClient/fileSystem';
import { useDialog } from '@shared/ui/Dialog';
import { useSnackbar } from '@shared/ui/Snackbar';
import { ImportDocumentErrorCode } from './importDocumentErrorCode';
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
  const { createImportedDocument, readImportDocumentDraft } = useImportDocument();
  const { addSnackbar } = useSnackbar();
  const { confirm } = useDialog();
  const { requestAccess } = useFileSystemAccessPermissionBroker();

  const importDocument = async (path: string) => {
    try {
      const draft = await readImportDocumentDraft();

      if (!draft) {
        return undefined;
      }

      let documentId: string | undefined;

      try {
        documentId = await createImportedDocument(path, draft);
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

        documentId = await createImportedDocument(path, draft);
      }

      if (!documentId) {
        return undefined;
      }

      addSnackbar({ text: 'Document imported' });

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
          action: 'importDocumentJson',
        });
      }

      return undefined;
    }
  };

  return {
    importDocument,
  };
};
