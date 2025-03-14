import { shallowRef, readonly } from 'vue';
import {
  createLocalDirectory,
  type LocalDirectoryEntry,
} from '../../shared/lib/localFileSystem';
import { uniqueId } from 'lodash-es';

export const usePickLocalDirectory = (
  mode: FileSystemPermissionMode = 'read',
) => {
  const pickedLocalDirectory = shallowRef<LocalDirectoryEntry>();

  const openLocalDirectoryPicker = async (): Promise<LocalDirectoryEntry> => {
    const fileSystemDirectoryHandle = await showDirectoryPicker({
      mode,
    });

    pickedLocalDirectory.value = createLocalDirectory(
      fileSystemDirectoryHandle,
      undefined,
      uniqueId(fileSystemDirectoryHandle.name),
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
