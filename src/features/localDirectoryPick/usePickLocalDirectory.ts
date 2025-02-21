import { shallowRef, readonly } from 'vue';
import {
  createLocalDirectory,
  type RefLocalDirectory,
} from '../../shared/lib/localFileSystem';

export const usePickLocalDirectory = (
  mode: FileSystemPermissionMode = 'read',
) => {
  const pickedLocalDirectory = shallowRef<RefLocalDirectory>();

  const openLocalDirectoryPicker = async (): Promise<RefLocalDirectory> => {
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
