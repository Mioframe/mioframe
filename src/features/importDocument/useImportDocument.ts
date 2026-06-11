import { DomainError } from '@shared/lib/error';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { fileOpen } from 'browser-fs-access';
import { ImportDocumentErrorCode } from './importDocumentErrorCode';

/**
 * Creates a file-picker action for reading a Mioframe JSON file selected by the user.
 * @returns The file-picker read action.
 */
export const useImportDocument = () => {
  /**
   * Opens a JSON file picker and reads the selected file's text content.
   * @returns The raw text content of the selected file, or `undefined` when the user cancels.
   */
  const readJsonFileText = async (): Promise<string | undefined> => {
    let file: File;

    try {
      file = await fileOpen({
        description: 'JSON files',
        extensions: ['.json'],
        mimeTypes: ['application/json'],
      });
    } catch (error) {
      if (isUserFileSelectionCancel(error)) {
        return undefined;
      }

      if (error instanceof DomainError) {
        throw error;
      }

      throw new DomainError('Could not open the selected file', {
        cause: error,
        code: ImportDocumentErrorCode.fileOpenFailed,
      });
    }

    try {
      return await file.text();
    } catch (error) {
      throw new DomainError('Could not import the document', {
        cause: error,
        code: ImportDocumentErrorCode.fileReadFailed,
      });
    }
  };

  return { readJsonFileText };
};
