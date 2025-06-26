import type { ShallowReactive } from 'vue';
import {
  computed,
  reactive,
  ref,
  shallowReactive,
  type MaybeRefOrGetter,
} from 'vue';
import type { DirectoryFSEntry } from './DirectoryFSEntry';
import type { FileFSEntry } from './FileFSEntry';
import {
  createGlobalWeakCache,
  defineGlobalWeakCacheRef,
} from '../globalWeakCache';
import { tryOnScopeDispose } from '@vueuse/core';
import { once } from 'es-toolkit';

/**
 * @deprecated - use useDirectoryRef
 * @param directoryFSEntry
 * @returns
 */
export const useDirectory = (
  directoryFSEntry: MaybeRefOrGetter<DirectoryFSEntry | undefined>,
) => {
  const cache = useDirectoryFSEntryRef(directoryFSEntry);

  const createDirectory = async (name: string): Promise<DirectoryFSEntry> => {
    if (!cache.value) {
      throw new Error('missing directory');
    }

    const newEntry = await cache.value.createDirectory(name);

    return newEntry;
  };

  const writeFile = async (
    name: string,
    file?: FileSystemWriteChunkType,
  ): Promise<FileFSEntry> => {
    if (!cache.value) {
      throw new Error('missing directory');
    }

    const newEntry = await cache.value.writeFile(name, file);

    return newEntry;
  };

  const removeByName = async (name: string): Promise<void> => {
    if (!cache.value) {
      throw new Error('missing directory');
    }

    await cache.value.removeByName(name);
  };

  const useDirectoryInterface = reactive({
    entries: computed(() => cache.value?.entries),
    loading: computed(() => cache.value?.loading),
    error: computed(() => cache.value?.error),
    reload: () => cache.value?.reload(),
    createDirectory,
    writeFile,
    removeByName,
    ready: computed(() => cache.value?.ready),
  });

  return useDirectoryInterface;
};

type DirectoryFSEntryRef = {
  entries: ShallowReactive<Map<string, FileFSEntry | DirectoryFSEntry>>;
  loading: boolean;
  error: Error | undefined;
  ready: boolean;
  reload: () => Promise<void>;
  writeFile: (
    name: string,
    file?: FileSystemWriteChunkType,
  ) => Promise<FileFSEntry>;
  removeByName: (name: string) => Promise<void>;
  createDirectory: (name: string) => Promise<DirectoryFSEntry>;
};

export const useDirectoryFSEntryCache = createGlobalWeakCache(
  (directoryFSEntry: DirectoryFSEntry): DirectoryFSEntryRef => {
    const readyRef = ref(false);
    const loadingRef = ref(false);
    const errorRef = ref<Error>();
    const entriesReactiveState = shallowReactive<
      Map<string, DirectoryFSEntry | FileFSEntry>
    >(new Map());

    const loadDirectory = async () => {
      readyRef.value = false;

      loadingRef.value = true;
      errorRef.value = undefined;
      entriesReactiveState.clear();

      try {
        for await (const [key, entry] of directoryFSEntry.entries()) {
          entriesReactiveState.set(key, entry);
        }
      } catch (err) {
        errorRef.value = err instanceof Error ? err : new Error(String(err));
      } finally {
        loadingRef.value = false;
        readyRef.value = true;
      }
    };

    const onAdd = (key: string, value: DirectoryFSEntry | FileFSEntry) => {
      entriesReactiveState.set(key, value);
    };

    const onRemove = (key: string) => {
      entriesReactiveState.delete(key);
    };

    const addListeners = () => {
      directoryFSEntry.on('add', onAdd);
      directoryFSEntry.on('remove', onRemove);
    };

    const writeFile = async (
      name: string,
      file?: FileSystemWriteChunkType,
    ): Promise<FileFSEntry> => {
      const newEntry = await directoryFSEntry.writeFile(name, file);

      entriesReactiveState.set(name, newEntry);

      return newEntry;
    };

    const removeByName = async (name: string): Promise<void> => {
      await directoryFSEntry.removeByName(name);

      entriesReactiveState.delete(name);
    };

    const createDirectory = async (name: string): Promise<DirectoryFSEntry> => {
      const newEntry = await directoryFSEntry.createDirectory(name);

      entriesReactiveState.set(name, newEntry);

      return newEntry;
    };

    const onDisposeCache = () => {
      directoryFSEntry.off('add', onAdd);
      directoryFSEntry.off('remove', onRemove);
    };

    tryOnScopeDispose(onDisposeCache);

    const onceInit = once(() => {
      addListeners();
      void loadDirectory();
    });

    const directoryCacheApiRef: DirectoryFSEntryRef = reactive({
      get entries() {
        onceInit();
        return entriesReactiveState;
      },
      loading: loadingRef,
      error: errorRef,
      ready: readyRef,
      reload: loadDirectory,
      writeFile,
      removeByName,
      createDirectory,
    });

    return directoryCacheApiRef;
  },
);

export const useDirectoryFSEntryRef = defineGlobalWeakCacheRef(
  useDirectoryFSEntryCache,
);
