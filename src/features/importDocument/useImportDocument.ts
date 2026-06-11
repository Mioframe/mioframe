import { DomainError } from '@shared/lib/error';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { fileOpen } from 'browser-fs-access';
import { ImportDocumentErrorCode } from './importDocumentErrorCode';

/**
 * Creates a file-picker action for selecting a Mioframe JSON file.
 * @returns The file-picker action.
 */
export const useImportDocument = () => {
  /**
   * Opens a JSON file picker and returns the selected file.
   * @returns The selected `File`, or `undefined` when the user cancels.
   */
  const pickJsonFile = async (): Promise<File | undefined> => {
    try {
      return await fileOpen({
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
  };

  return { pickJsonFile };
};
