import { createLocalDirectory } from '@shared/lib/localFileSystem';
import { defineSubscribeService } from '@shared/lib/remoteStore/subscribeService';
import { strictRecordSet, type StrictRecord } from '@shared/lib/strictRecord';
import {
  strictRecordGet,
  strictRecordIterableKeys,
} from '@shared/lib/strictRecord/wrapStrictRecord';
import { createGlobalState } from '@vueuse/core';
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval';
import { computed } from 'vue';

export const useMountDirectoriesService = createGlobalState(() => {
  const { data: mountedStorage } = useIDBKeyval<
    StrictRecord<string, FileSystemDirectoryHandle>
  >('mountedStorage', {});

  const set = (name: string, entry: FileSystemDirectoryHandle) => {
    strictRecordSet(mountedStorage.value, name, entry);
  };

  const nameList = computed(() =>
    Array.from(strictRecordIterableKeys(mountedStorage.value)()),
  );

  const get = (name: string) => {
    const handle = strictRecordGet(mountedStorage.value, name);
    if (handle) {
      return createLocalDirectory(handle, undefined, name);
    }
    return undefined;
  };

  return {
    set,
    nameListSubscribe: defineSubscribeService(nameList),
    get,
  };
});
