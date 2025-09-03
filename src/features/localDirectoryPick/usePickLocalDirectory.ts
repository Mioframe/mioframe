import { shallowRef, readonly } from 'vue';
import {
  createLocalDirectory,
  type DirectoryLocalEntry,
} from '../../shared/lib/localFileSystem';
import { sessionUniqueId } from '@shared/lib/uniqueId';

export const usePickLocalDirectory = (
  mode: FileSystemPermissionMode = 'read',
) => {
  const pickedLocalDirectory = shallowRef<DirectoryLocalEntry>();

  const openLocalDirectoryPicker = async (): Promise<DirectoryLocalEntry> => {
    const fileSystemDirectoryHandle = await showDirectoryPicker({
      mode,
    });

    pickedLocalDirectory.value = createLocalDirectory(
      fileSystemDirectoryHandle,
      undefined,
      sessionUniqueId(fileSystemDirectoryHandle.name),
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
