import { createSafeErrorCause, DomainError } from '@shared/lib/error';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { getFileSystemAccessRecovery } from '@shared/lib/fileSystem';
import { reportHandledError } from '@shared/lib/reportHandledError';
import { useMainServiceClient } from '@shared/service';
import { useDialog } from '@shared/ui/Dialog';
import { useSnackbar } from '@shared/ui/Snackbar';
import { ImportDocumentErrorCode } from './importDocumentErrorCode';
import { useImportDocument } from './useImportDocument';

const shouldSkipImportErrorReport = (error: unknown) =>
  isUserFileSelectionCancel(error) ||
  (error instanceof DomainError &&
    (error.code === ImportDocumentErrorCode.invalidJson ||
      error.code === ImportDocumentErrorCode.invalidDocumentFormat));

const toSafeImportReportError = () => {
  return new DomainError('Could not import the document', {
    cause: createSafeErrorCause('Document JSON import failed'),
    code: ImportDocumentErrorCode.documentImportFailed,
  });
};

/**
 * Runs the document JSON import flow with shared snackbar and diagnostics behavior.
 * @returns Shared import action for feature callers that import a document into a directory.
 */
export const useImportDocumentAction = () => {
  const { createImportedDocument, readImportDocumentDraft } = useImportDocument();
  const { addSnackbar } = useSnackbar();
  const { confirm } = useDialog();
  const {
    fileSystem: { requestFileSystemAccess },
  } = useMainServiceClient();

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
            text: 'Grant write access to edit this remembered space.',
          });
          return undefined;
        }

        const result = await requestFileSystemAccess(recovery);

        if (result.status !== 'granted') {
          addSnackbar({
            text:
              result.status === 'denied'
                ? 'Editing is not allowed in this remembered space because your browser denied write access.'
                : 'Grant write access to edit this remembered space.',
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
          ? 'Grant write access to edit this remembered space.'
          : error instanceof DomainError
            ? error.message
            : 'Could not import the document',
      });

      if (!shouldSkipImportErrorReport(error)) {
        reportHandledError(toSafeImportReportError(), {
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
