import { shallowRef, readonly } from 'vue';
import {
  createLocalDirectory,
  type LocalDirectory,
} from '../../shared/lib/localFileSystem';

export const usePickLocalDirectory = (
  mode: FileSystemPermissionMode = 'read',
) => {
  const pickedLocalDirectory = shallowRef<LocalDirectory>();

  const openLocalDirectoryPicker = async (): Promise<LocalDirectory> => {
    const fileSystemDirectoryHandle = await showDirectoryPicker({
      mode,
    });

    pickedLocalDirectory.value = createLocalDirectory(
      fileSystemDirectoryHandle,
    );

    return pickedLocalDirectory.value;
  };

  const isSupport = typeof showDirectoryPicker === 'function';

  return {
    openLocalDirectoryPicker,
    pickedLocalDirectory: readonly(pickedLocalDirectory),
    isSupport,
  };
};
