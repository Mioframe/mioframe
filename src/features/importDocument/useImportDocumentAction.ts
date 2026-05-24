import { createSafeErrorCause, DomainError } from '@shared/lib/error';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { reportHandledError } from '@shared/lib/reportHandledError';
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
  const { importJsonFile } = useImportDocument();
  const { addSnackbar } = useSnackbar();

  const importDocument = async (path: string) => {
    try {
      const documentId = await importJsonFile(path);

      if (!documentId) {
        return undefined;
      }

      addSnackbar({ text: 'Document imported' });

      return documentId;
    } catch (error) {
      addSnackbar({
        text: error instanceof DomainError ? error.message : 'Could not import the document',
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
