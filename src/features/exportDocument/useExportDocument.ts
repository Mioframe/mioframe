import type { AMDocumentId } from '@shared/lib/automerge';
import { DomainError } from '@shared/lib/error';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { useMainServiceClient } from '@shared/service';
import { stringify } from 'safe-stable-stringify';
import { fileSave } from 'browser-fs-access';
import { ExportDocumentErrorCode } from './exportDocumentErrorCode';

/**
 * Creates JSON document export actions for a document in a directory.
 * @returns Export actions for Mioframe JSON documents.
 */
export const useExportDocument = () => {
  const {
    documents: { cfrDocumentState },
  } = useMainServiceClient();

  /**
   * Exports a Mioframe document to a JSON file chosen by the user.
   * @param path - The directory path that owns the document.
   * @param documentId - The document id to export.
   * @returns `true` when the export succeeds, or `false` when the user cancels the save dialog.
   */
  const saveJsonFile = async (path: string, documentId: AMDocumentId) => {
    let documentState: Awaited<ReturnType<typeof cfrDocumentState.fetch>>;

    try {
      documentState = await cfrDocumentState.fetch({
        path,
        documentId,
      });
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }

      throw new DomainError('Could not export JSON', {
        cause: error,
        code: ExportDocumentErrorCode.documentExportFailed,
      });
    }

    if (!documentState) {
      throw new DomainError('The document is not available for export', {
        code: ExportDocumentErrorCode.documentExportUnavailable,
      });
    }

    const jsonString = stringify(documentState);

    const extension = 'json';

    const mimeType = `application/${extension}`;

    try {
      await fileSave(new Blob([jsonString], { type: mimeType }), {
        fileName: `${documentId}.${extension}`,
        extensions: [`.${extension}`],
        mimeTypes: [mimeType],
      });

      return true;
    } catch (error) {
      if (isUserFileSelectionCancel(error)) {
        return false;
      }

      if (error instanceof DomainError) {
        throw error;
      }

      throw new DomainError('Could not export JSON', {
        cause: error,
        code: ExportDocumentErrorCode.documentExportFailed,
      });
    }
  };

  return {
    saveJsonFile,
  };
};
