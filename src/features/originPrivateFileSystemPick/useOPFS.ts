import { reactive, toRef } from 'vue';
import {
  createLocalDirectory,
  type RefLocalDirectory,
} from '../../shared/lib/localFileSystem';

const DOCUMENT_FOLDER_NAME = 'Origin private file system';

export const useOriginPrivateFSDirectory = () => {
  const openOriginPrivateFS = async (): Promise<RefLocalDirectory> => {
    const rootDirectoryHandle = await navigator.storage.getDirectory();

    // const documentsDirectoryHandle =
    //   await rootDirectoryHandle.getDirectoryHandle(DOCUMENT_FOLDER_NAME, {
    //     create: true,
    //   });

    return reactive({
      ...createLocalDirectory(rootDirectoryHandle),
      name: toRef(() => DOCUMENT_FOLDER_NAME),
    });
  };

  return {
    openOriginPrivateFS,
  };
};
