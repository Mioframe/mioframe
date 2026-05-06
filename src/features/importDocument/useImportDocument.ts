import { DomainError } from '@shared/lib/error';
import { useMainServiceClient } from '@shared/service';
import { fileOpen } from 'browser-fs-access';
import { zodCFRDocumentContent } from '@shared/lib/cfrDocument';

/**
 * Detects when the user dismisses the native file picker without selecting a file.
 * @param error - The thrown picker error.
 * @returns Whether the error represents a user cancellation.
 */
const isUserFileSelectionCancel = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError';

/**
 * Creates JSON document import actions for a target directory.
 * @returns Import actions for Beaver JSON documents.
 */
export const useImportDocument = () => {
  const {
    repositories: { createDocument },
  } = useMainServiceClient();

  /**
   * Imports a Beaver document from a selected JSON file into the target directory.
   * @param path - The directory path where the imported document should be created.
   * @returns The created document id, or `undefined` when the user cancels file selection.
   */
  const importJsonFile = async (path: string) => {
    let file: File;

    try {
      file = await fileOpen({
        description: 'JSON files',
        extensions: ['.json'],
        mimeTypes: ['application/json'],
      });
    } catch (error) {
      if (isUserFileSelectionCancel(error)) {
        return;
      }

      throw error;
    }

    const text = await file.text();
    let data: unknown;

    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new DomainError('The selected file is not valid JSON', { cause: error });
    }

    let initialValue: ReturnType<typeof zodCFRDocumentContent.parse>;

    try {
      initialValue = zodCFRDocumentContent.parse(data);
    } catch (error) {
      throw new DomainError('The selected JSON file is not a Beaver document', {
        cause: error,
      });
    }

    try {
      const documentId = await createDocument(path, initialValue);

      return documentId;
    } catch (error) {
      throw new DomainError('Could not import the document', { cause: error });
    }
  };

  return {
    importJsonFile,
  };
};
