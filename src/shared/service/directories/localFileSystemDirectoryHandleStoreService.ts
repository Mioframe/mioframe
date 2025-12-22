import {
  strictRecordIterableEntries,
  strictRecordSet,
  type StrictRecord,
} from '@shared/lib/strictRecord';
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval';
import { OPFSName } from './types';
import { createGlobalState } from '@vueuse/core';
import { computed, watchEffect } from 'vue';
import { createLocalDirectory } from '@shared/lib/localFileSystem';
import { useDirectoryStoreService } from './directoriesStoreService';

const setupLocalFileSystemDirectoryHandleStoreService = () => {
  const { data: store } = useIDBKeyval<
    StrictRecord<string, FileSystemDirectoryHandle>
  >('RootFileSystemDirectories', {});

  const add = (handle: FileSystemDirectoryHandle, name: string): void => {
    strictRecordSet(store.value, name, handle);
  };

  const mountOPFS = async () => {
    if (!store.value[OPFSName]) {
      const directory = await navigator.storage.getDirectory();
      add(directory, OPFSName);
    }
  };

  setTimeout(() => {
    void mountOPFS();
  }, 100);

  const { mount, getRootDirectories } = useDirectoryStoreService();

  const mountFileSystemDirectoryHandleStore = () => {
    const rootDirectories = getRootDirectories();

    for (const [name, handle] of strictRecordIterableEntries(store.value)()) {
      if (!rootDirectories.includes(name)) {
        const directoryFSEntry = createLocalDirectory(handle, undefined, name);

        mount(directoryFSEntry);
      }
    }
  };

  watchEffect(mountFileSystemDirectoryHandleStore);

  return {
    store: computed(() => store.value),
    add,
  };
};

export const useLocalFileSystemDirectoryHandleStoreService = createGlobalState(
  setupLocalFileSystemDirectoryHandleStoreService,
);
