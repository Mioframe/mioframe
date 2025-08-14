import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { createGlobalState } from '@vueuse/core';
import { computed } from 'vue';
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval';
import { wrapStrictRecord, type StrictRecord } from '@shared/lib/strictRecord';
import { useReduceRecord } from '@shared/lib/useReduce';
import { createLocalDirectory } from '@shared/lib/localFileSystem';

type MountDescription = {
  fileSystemDirectoryHandle: FileSystemDirectoryHandle;
  description?: string;
};

export const useMountedDirectories = createGlobalState(() => {
  const { data: mountedStorage } = useIDBKeyval<
    StrictRecord<string, MountDescription>
  >('mountedStorage', {});

  const mountedMap = useReduceRecord<
    Map<string, { entry: DirectoryFSEntry; description?: string }>,
    string,
    MountDescription | undefined
  >(
    mountedStorage,
    (acc, value, key) => {
      if (value) {
        const { description, fileSystemDirectoryHandle } = value;
        acc.set(key, {
          description,
          entry: createLocalDirectory(
            fileSystemDirectoryHandle,
            undefined,
            fileSystemDirectoryHandle.name || key,
          ),
        });
      }
    },
    new Map(),
  );

  const mount = (mountDescription: MountDescription, customName?: string) => {
    const name = customName ?? mountDescription.fileSystemDirectoryHandle.name;

    wrapStrictRecord(mountedStorage.value).set(name, mountDescription);
  };

  const unmount = (name: string) => {
    wrapStrictRecord(mountedStorage.value).delete(name);
  };

  const get = (name: string) => {
    const entry = mountedMap.value.get(name);
    return entry;
  };

  return {
    mount,
    unmount,
    get,
    map: computed(() => mountedMap.value),
  };
});
