import {
  createLocalDirectory,
  type RefLocalDirectory,
} from '../../shared/lib/localFileSystem';

const DOCUMENT_FOLDER_NAME = 'Documents';

export const useOriginPrivateFSDirectory = () => {
  const openOriginPrivateFS = async (): Promise<RefLocalDirectory> => {
    const rootDirectoryHandle = await navigator.storage.getDirectory();

    const documentsDirectoryHandle =
      await rootDirectoryHandle.getDirectoryHandle(DOCUMENT_FOLDER_NAME, {
        create: true,
      });

    return createLocalDirectory(documentsDirectoryHandle);
  };

  return {
    openOriginPrivateFS,
  };
};
