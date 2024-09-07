import { reactive, computed, shallowRef, watch } from 'vue';
import type {
  DirectoryEntryFSApi,
  FileEntryFSApi,
} from '../../../shared/lib/fileSystemApi';
import { createDirectoryEntryApi } from '../../../shared/lib/fileSystemApi';
import type { DirectoryEntryRef, DirectoryList, FileEntryRef } from './types';
import { difference } from 'lodash-es';

const directoryRegistry = new WeakMap<DirectoryEntryRef, DirectoryEntryFSApi>();

const createFileEntryRef = (fileEntryApi: FileEntryFSApi): FileEntryRef => {
  const fileEntryApiRef = shallowRef(fileEntryApi);

  const label = computed(() => fileEntryApiRef.value.getName());
  const path = computed(() => fileEntryApiRef.value.getPath());
  const read = () => fileEntryApiRef.value.read();
  const remove = () => fileEntryApiRef.value.remove();

  const rename = async (newName: string) => {
    fileEntryApiRef.value = await fileEntryApiRef.value.rename(newName);
    return currentEntry;
  };

  const copyTo = async (dest: DirectoryEntryRef) => {
    const destApi = directoryRegistry.get(dest);

    if (destApi) {
      fileEntryApiRef.value = await fileEntryApiRef.value.copyTo(destApi);
      return currentEntry;
    } else {
      throw new Error('destination directory is missing');
    }
  };

  const moveTo = async (dest: DirectoryEntryRef) => {
    const destApi = directoryRegistry.get(dest);

    if (destApi) {
      fileEntryApiRef.value = await fileEntryApiRef.value.moveTo(destApi);
      return currentEntry;
    } else {
      throw new Error('destination directory is missing');
    }
  };

  const currentEntry: FileEntryRef = reactive({
    label,
    path,
    read,
    remove,
    rename,
    copyTo,
    moveTo,
  });

  return currentEntry;
};

const createDirectoryEntryRef = (
  directoryEntryApi: DirectoryEntryFSApi,
): DirectoryEntryRef => {
  const currentApiRef = shallowRef(directoryEntryApi);

  const stateDirectoryList: DirectoryList = reactive(new Map());

  const updateDirectoryList = async () => {
    const nowEntryList = await currentApiRef.value.getList();

    const stateNames = Array.from(stateDirectoryList.keys());
    const nowNames = Array.from(nowEntryList.keys());

    const deletedNames = difference(stateNames, nowNames);

    deletedNames.forEach((name) => stateDirectoryList.delete(name));
    nowEntryList.forEach((entry, name) => {
      if (!stateDirectoryList.has(name)) {
        if ('getList' in entry) {
          const directoryEntryRef = createDirectoryEntryRef(entry);
          stateDirectoryList.set(name, directoryEntryRef);
          directoryRegistry.set(directoryEntryRef, entry);
        } else {
          stateDirectoryList.set(name, createFileEntryRef(entry));
        }
      }
    });
  };

  watch(
    currentApiRef,
    (currentApiRef, oldCurrentApiRef) => {
      oldCurrentApiRef?.removeWatcher(updateDirectoryList);
      currentApiRef.addWatcher(updateDirectoryList);
    },
    { immediate: true },
  );

  const createDirectory = async (name: string): Promise<DirectoryEntryRef> => {
    const newDirectoryApi = await currentApiRef.value.createDirectory(name);
    const newDirectoryEntry = createDirectoryEntryRef(newDirectoryApi);

    directoryRegistry.set(newDirectoryEntry, newDirectoryApi);

    return newDirectoryEntry;
  };

  const copyTo = async (
    dest: DirectoryEntryRef,
  ): Promise<DirectoryEntryRef> => {
    const destApi = directoryRegistry.get(dest);

    if (destApi) {
      const newDirectoryApi = await currentApiRef.value.copyTo(destApi);

      const newDirectoryEntry = createDirectoryEntryRef(newDirectoryApi);

      directoryRegistry.set(newDirectoryEntry, newDirectoryApi);

      return newDirectoryEntry;
    } else {
      throw Error('destination directory is missing');
    }
  };

  const moveTo = async (
    dest: DirectoryEntryRef,
  ): Promise<DirectoryEntryRef> => {
    const destApi = directoryRegistry.get(dest);

    if (destApi) {
      const newDirectoryApi = await currentApiRef.value.moveTo(destApi);

      const newDirectoryEntry = createDirectoryEntryRef(newDirectoryApi);

      directoryRegistry.set(newDirectoryEntry, newDirectoryApi);

      return newDirectoryEntry;
    } else {
      throw Error('destination directory is missing');
    }
  };

  const remove = async () => {
    await currentApiRef.value.remove();
    directoryRegistry.delete(currentDirectoryEntry);
    currentApiRef.value.removeWatcher(updateDirectoryList);
  };

  const rename = async (newName: string): Promise<DirectoryEntryRef> => {
    const newDirectoryEntryApi = await currentApiRef.value.rename(newName);

    currentApiRef.value = newDirectoryEntryApi;

    directoryRegistry.set(currentDirectoryEntry, newDirectoryEntryApi);

    return currentDirectoryEntry;
  };

  const writeFile = async (
    name: string,
    file?: File,
  ): Promise<FileEntryRef> => {
    const fileApi = await currentApiRef.value.writeFile(name, file);

    const fileEntry = createFileEntryRef(fileApi);

    stateDirectoryList.set(name, fileEntry);

    return fileEntry;
  };

  const list = computed((): DirectoryList => stateDirectoryList);
  const label = computed(() => currentApiRef.value.getName());
  const path = computed(() => currentApiRef.value.getPath());

  const currentDirectoryEntry: DirectoryEntryRef = reactive({
    createDirectory,
    copyTo,
    get list() {
      if (!list.value.size) {
        void updateDirectoryList();
      }
      return list;
    },
    moveTo,
    label,
    path,
    remove,
    rename,
    writeFile,
  });

  return currentDirectoryEntry;
};

export const createRootDirectoryEntryRef = (
  rootHandler: FileSystemDirectoryHandle,
): DirectoryEntryRef => {
  const roodDirectoryEntryApi = createDirectoryEntryApi(rootHandler);

  const rootEntry = createDirectoryEntryRef(roodDirectoryEntryApi);

  return rootEntry;
};
