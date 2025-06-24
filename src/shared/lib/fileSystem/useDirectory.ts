import { computed, ref, shallowReactive, type MaybeRefOrGetter } from 'vue';
import type { DirectoryFSEntry } from './DirectoryFSEntry';
import type { FileFSEntry } from './FileFSEntry';
import { createLogger } from '../logger';
import { defineGlobalWeakCache, useGlobalWeakCache } from '../globalWeakCache';

const { debug } = createLogger('useDirectory');

export const useDirectory = (
  directoryEntry: MaybeRefOrGetter<DirectoryFSEntry | undefined>,
) => {
  const { state: directoryRef } = useGlobalWeakCache(
    directoryRefCache,
    directoryEntry,
  );

  const createDirectory = async (name: string): Promise<DirectoryFSEntry> => {
    if (!directoryRef.value) {
      throw new Error('missing directory');
    }

    const newEntry = await directoryRef.value.createDirectory(name);

    return newEntry;
  };

  const writeFile = async (
    name: string,
    file?: FileSystemWriteChunkType,
  ): Promise<FileFSEntry> => {
    if (!directoryRef.value) {
      throw new Error('missing directory');
    }

    const newEntry = await directoryRef.value.writeFile(name, file);

    return newEntry;
  };

  const removeByName = async (name: string): Promise<void> => {
    debug('removeByName', { name });

    if (!directoryRef.value) {
      throw new Error('missing directory');
    }

    await directoryRef.value.removeByName(name);
  };

  const useDirectoryInterface = {
    entries: computed(() => directoryRef.value?.entries.value),
    loading: computed(() => directoryRef.value?.loading.value),
    error: computed(() => directoryRef.value?.error.value),
    reload: () => directoryRef.value?.reload(),
    createDirectory,
    writeFile,
    removeByName,
    ready: computed(() => directoryRef.value?.ready),
  };

  return useDirectoryInterface;
};

export const directoryRefCache = defineGlobalWeakCache(
  (directoryFSEntry: DirectoryFSEntry) => {
    let read = false;
    const readyRef = ref(false);
    const loadingRef = ref(false);
    const errorRef = ref<Error>();
    const entriesReactiveState = shallowReactive<
      Map<string, DirectoryFSEntry | FileFSEntry>
    >(new Map());

    const loadDirectory = async () => {
      read = true;

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

    const removeListeners = () => {
      directoryFSEntry.off('add', onAdd);
      directoryFSEntry.off('remove', onRemove);
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

    return {
      entries: computed(() => {
        if (!read) {
          void loadDirectory();
          read = true;
        }
        return entriesReactiveState;
      }),
      loading: computed(() => loadingRef.value),
      error: computed(() => errorRef.value),
      ready: computed(() => readyRef.value),
      reload: loadDirectory,
      addListeners,
      removeListeners,
      writeFile,
      removeByName,
      createDirectory,
    };
  },
  (_key, value) => {
    value.addListeners();
    void value.reload();
  },
  (_key, value) => {
    value?.removeListeners();
  },
);
