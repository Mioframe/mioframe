import { DomainError } from '@shared/lib/error';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { fileOpen } from 'browser-fs-access';
import { ImportZipErrorCode } from './importZipErrorCode';

/**
 * Creates a file-picker action for selecting a ZIP archive.
 * @returns The file-picker action.
 */
export const useImportZip = () => {
  /**
   * Opens a ZIP file picker and returns the selected file.
   * @returns The selected `File`, or `undefined` when the user cancels.
   */
  const pickZipFile = async (): Promise<File | undefined> => {
    try {
      return await fileOpen({
        description: 'ZIP archives',
        extensions: ['.zip'],
        mimeTypes: ['application/zip'],
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
        code: ImportZipErrorCode.fileOpenFailed,
      });
    }
  };

  return { pickZipFile };
};
