import {
  createLocalDirectory,
  type LocalDirectoryEntry,
} from '../../shared/lib/localFileSystem';

const DOCUMENT_FOLDER_NAME = 'Origin private file system';

export const useOriginPrivateFSDirectory = () => {
  const openOriginPrivateFS = async (): Promise<LocalDirectoryEntry> => {
    const rootDirectoryHandle = await navigator.storage.getDirectory();

    return createLocalDirectory(
      rootDirectoryHandle,
      undefined,
      DOCUMENT_FOLDER_NAME,
    );
  };

  return {
    openOriginPrivateFS,
  };
};
