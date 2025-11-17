import { strictRecordSet, type StrictRecord } from '@shared/lib/strictRecord';
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval';
import { OPFSName } from './types';
import { createGlobalState } from '@vueuse/core';
import { computed } from 'vue';

export const useLocalFileSystemDirectoryHandleStoreService = createGlobalState(
  () => {
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

    return {
      store: computed(() => store.value),
      add,
    };
  },
);
