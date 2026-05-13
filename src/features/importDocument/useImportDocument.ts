import { createSafeErrorCause, DomainError } from '@shared/lib/error';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { useMainServiceClient } from '@shared/service';
import { fileOpen } from 'browser-fs-access';
import { zodCFRDocumentContent } from '@shared/lib/cfrDocument';
import { ImportDocumentErrorCode } from './importDocumentErrorCode';

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

      if (error instanceof DomainError) {
        throw error;
      }

      throw new DomainError('Could not open the selected file', {
        cause: createSafeErrorCause('Selected file open operation failed'),
        code: ImportDocumentErrorCode.fileOpenFailed,
      });
    }

    let text: string;

    try {
      text = await file.text();
    } catch {
      throw new DomainError('Could not import the document', {
        cause: createSafeErrorCause('Selected file read failed'),
        code: ImportDocumentErrorCode.fileReadFailed,
      });
    }

    let data: unknown;

    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new DomainError('The selected file is not valid JSON', {
        cause: error,
        code: ImportDocumentErrorCode.invalidJson,
      });
    }

    let initialValue: ReturnType<typeof zodCFRDocumentContent.parse>;

    try {
      initialValue = zodCFRDocumentContent.parse(data);
    } catch (error) {
      throw new DomainError('The selected JSON file is not a Beaver document', {
        cause: error,
        code: ImportDocumentErrorCode.invalidDocumentFormat,
      });
    }

    try {
      const documentId = await createDocument(path, initialValue);

      return documentId;
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }

      throw new DomainError('Could not import the document', {
        cause: createSafeErrorCause('Document repository write operation failed'),
        code: ImportDocumentErrorCode.documentImportFailed,
      });
    }
  };

  return {
    importJsonFile,
  };
};
