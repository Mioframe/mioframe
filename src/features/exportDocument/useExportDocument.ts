import type { AMDocumentId } from '@shared/lib/automerge';
import { DomainError } from '@shared/lib/error';
import { useMainServiceClient } from '@shared/service';
import { stringify } from 'safe-stable-stringify';
import { fileSave } from 'browser-fs-access';

/**
 * Detects when the user dismisses the native save dialog without choosing a destination.
 * @param error - The thrown save dialog error.
 * @returns Whether the error represents a user cancellation.
 */
const isUserFileSelectionCancel = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError';

/**
 * Creates JSON document export actions for a document in a directory.
 * @returns Export actions for Beaver JSON documents.
 */
export const useExportDocument = () => {
  const {
    documents: { cfrDocumentState },
  } = useMainServiceClient();

  /**
   * Exports a Beaver document to a JSON file chosen by the user.
   * @param path - The directory path that owns the document.
   * @param documentId - The document id to export.
   * @returns `true` when the export succeeds, or `false` when the user cancels the save dialog.
   */
  const saveJsonFile = async (path: string, documentId: AMDocumentId) => {
    const documentState = await cfrDocumentState.fetch({
      path,
      documentId,
    });

    if (!documentState) {
      throw new DomainError('The document is not available for export');
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

      throw new DomainError('Could not export the document', { cause: error });
    }
  };

  return {
    saveJsonFile,
  };
};
