import {
  computed,
  ref,
  shallowReactive,
  toRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue';
import type { DirectoryFSEntry } from './DirectoryFSEntry';
import type { FileFSEntry } from './FileFSEntry';
import { tryOnScopeDispose } from '@vueuse/core';
import { createLogger } from '../logger';
import { uniqueId } from '../uniqueId';

const { debug } = createLogger('useDirectory');

export const useDirectory = (
  directoryEntry: MaybeRefOrGetter<DirectoryFSEntry | undefined>,
) => {
  const debugId = uniqueId('useDirectory');

  const directoryRef = toRef(() => toValue(directoryEntry));

  debug('start', { id: debugId, name: directoryRef.value?.name });

  const loadingRef = ref(false);
  const readyRef = ref(false);

  const errorRef = ref<Error>();

  const entriesReactiveState = shallowReactive<
    Map<string, DirectoryFSEntry | FileFSEntry>
  >(new Map());

  const currentLoadId = ref(0);

  async function loadDirectory() {
    debug('loadDirectory', { name: directoryRef.value?.name });
    currentLoadId.value++;
    const thisLoadId = currentLoadId.value;
    readyRef.value = false;

    const initialDir = toValue(directoryRef);
    if (!initialDir) {
      entriesReactiveState.clear();
      loadingRef.value = false;
      errorRef.value = undefined;
      return;
    }

    loadingRef.value = true;
    errorRef.value = undefined;
    entriesReactiveState.clear();

    try {
      for await (const [key, entry] of initialDir.entries()) {
        const currentDir = toValue(directoryRef);
        if (currentDir !== initialDir || currentLoadId.value !== thisLoadId) {
          break;
        }
        entriesReactiveState.set(key, entry);
      }
    } catch (err) {
      if (currentLoadId.value === thisLoadId) {
        errorRef.value = err instanceof Error ? err : new Error(String(err));
      }
    } finally {
      if (currentLoadId.value === thisLoadId) {
        loadingRef.value = false;
        readyRef.value = true;
      }
    }
  }

  const createDirectory = async (name: string): Promise<DirectoryFSEntry> => {
    if (!directoryRef.value) {
      throw new Error('missing directory');
    }

    const newEntry = await directoryRef.value.createDirectory(name);

    entriesReactiveState.set(name, newEntry);

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

    entriesReactiveState.set(name, newEntry);

    return newEntry;
  };

  const removeByName = async (name: string): Promise<void> => {
    debug('removeByName', { name });

    if (!directoryRef.value) {
      throw new Error('missing directory');
    }

    await directoryRef.value.removeByName(name);

    entriesReactiveState.delete(name);
  };

  const onAdd = (key: string, value: DirectoryFSEntry | FileFSEntry) => {
    entriesReactiveState.set(key, value);
  };
  const onRemove = (key: string) => {
    entriesReactiveState.delete(key);
  };

  let read = false;

  const useDirectoryInterface = {
    entries: computed(() => {
      if (!read) {
        void loadDirectory();
        read = true;
      }
      return entriesReactiveState;
    }),
    loading: computed(() => loadingRef.value),
    error: computed(() => errorRef.value),
    reload: loadDirectory,
    createDirectory,
    writeFile,
    removeByName,
    ready: computed(() => readyRef.value),
  };

  watch(
    directoryRef,
    (directory, oldDirectory) => {
      if (read) {
        void loadDirectory();
      }
      if (oldDirectory) {
        oldDirectory.off('add', onAdd);
        oldDirectory.off('remove', onRemove);
      }
      if (directory) {
        directory.on('add', onAdd);
        directory.on('remove', onRemove);
      }
    },
    { immediate: true },
  );

  tryOnScopeDispose(() => {
    const directory = toValue(directoryRef);
    if (directory) {
      directory.off('add', onAdd);
      directory.off('remove', onRemove);
    }
  });

  return useDirectoryInterface;
};
