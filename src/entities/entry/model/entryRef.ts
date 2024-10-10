import { reactive, computed, shallowRef, watch } from 'vue';
import type {
  LocalDirectory,
  LocalFile,
} from '../../../shared/lib/localFileSystem';
import { createLocalDirectory } from '../../../shared/lib/localFileSystem';
import type { LocalDirectoryRef, DirectoryList, LocalFileRef } from './types';
import { difference } from 'lodash-es';

const directoryRegistry = new WeakMap<LocalDirectoryRef, LocalDirectory>();

const createLocalFileRef = (localFile: LocalFile): LocalFileRef => {
  const localFileRef = shallowRef(localFile);

  const label = computed(() => localFileRef.value.getName());
  const path = computed(() => localFileRef.value.getPath());
  const read = () => localFileRef.value.read();
  const remove = () => localFileRef.value.remove();

  const rename = async (newName: string) => {
    localFileRef.value = await localFileRef.value.rename(newName);
    return currentEntry;
  };

  const copyTo = async (dest: LocalDirectoryRef) => {
    const destLocalDirectory = directoryRegistry.get(dest);

    if (destLocalDirectory) {
      localFileRef.value = await localFileRef.value.copyTo(destLocalDirectory);
      return currentEntry;
    } else {
      throw new Error('destination directory is missing');
    }
  };

  const moveTo = async (dest: LocalDirectoryRef) => {
    const destLocalDirectory = directoryRegistry.get(dest);

    if (destLocalDirectory) {
      localFileRef.value = await localFileRef.value.moveTo(destLocalDirectory);
      return currentEntry;
    } else {
      throw new Error('destination directory is missing');
    }
  };

  const currentEntry: LocalFileRef = reactive({
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

const createLocalDirectoryRef = (
  localDirectory: LocalDirectory,
): LocalDirectoryRef => {
  const localDirectoryRef = shallowRef(localDirectory);

  const stateDirectoryList: DirectoryList = reactive(new Map());

  const updateDirectoryList = async () => {
    const nowEntryList = await localDirectoryRef.value.get();

    const stateNames = Array.from(stateDirectoryList.keys());
    const nowNames = Array.from(nowEntryList.keys());

    const deletedNames = difference(stateNames, nowNames);

    deletedNames.forEach((name) => stateDirectoryList.delete(name));
    nowEntryList.forEach((entry, name) => {
      if (!stateDirectoryList.has(name)) {
        if ('get' in entry) {
          const directoryEntryRef = createLocalDirectoryRef(entry);
          stateDirectoryList.set(name, directoryEntryRef);
          directoryRegistry.set(directoryEntryRef, entry);
        } else {
          stateDirectoryList.set(name, createLocalFileRef(entry));
        }
      }
    });
  };

  watch(
    localDirectoryRef,
    (localDirectory, oldLocalDirectory) => {
      oldLocalDirectory?.removeWatcher(updateDirectoryList);
      localDirectory.addWatcher(updateDirectoryList);
    },
    { immediate: true },
  );

  const createDirectory = async (name: string): Promise<LocalDirectoryRef> => {
    const newLocalDirectory =
      await localDirectoryRef.value.createDirectory(name);
    const newDirectoryEntry = createLocalDirectoryRef(newLocalDirectory);

    directoryRegistry.set(newDirectoryEntry, newLocalDirectory);

    return newDirectoryEntry;
  };

  const copyTo = async (
    dest: LocalDirectoryRef,
  ): Promise<LocalDirectoryRef> => {
    const destLocalDirectory = directoryRegistry.get(dest);

    if (destLocalDirectory) {
      const newLocalDirectory =
        await localDirectoryRef.value.copyTo(destLocalDirectory);

      const newDirectoryEntry = createLocalDirectoryRef(newLocalDirectory);

      directoryRegistry.set(newDirectoryEntry, newLocalDirectory);

      return newDirectoryEntry;
    } else {
      throw Error('destination directory is missing');
    }
  };

  const moveTo = async (
    dest: LocalDirectoryRef,
  ): Promise<LocalDirectoryRef> => {
    const destLocalDirectory = directoryRegistry.get(dest);

    if (destLocalDirectory) {
      const newLocalDirectory =
        await localDirectoryRef.value.moveTo(destLocalDirectory);

      const newDirectoryEntry = createLocalDirectoryRef(newLocalDirectory);

      directoryRegistry.set(newDirectoryEntry, newLocalDirectory);

      return newDirectoryEntry;
    } else {
      throw Error('destination directory is missing');
    }
  };

  const remove = async () => {
    await localDirectoryRef.value.remove();
    directoryRegistry.delete(currentDirectoryEntry);
    localDirectoryRef.value.removeWatcher(updateDirectoryList);
  };

  const rename = async (newName: string): Promise<LocalDirectoryRef> => {
    const newLocalDirectory = await localDirectoryRef.value.rename(newName);

    localDirectoryRef.value = newLocalDirectory;

    directoryRegistry.set(currentDirectoryEntry, newLocalDirectory);

    return currentDirectoryEntry;
  };

  const writeFile = async (
    name: string,
    file?: File,
  ): Promise<LocalFileRef> => {
    const localFile = await localDirectoryRef.value.writeFile(name, file);

    const fileEntry = createLocalFileRef(localFile);

    stateDirectoryList.set(name, fileEntry);

    return fileEntry;
  };

  const list = computed((): DirectoryList => stateDirectoryList);
  const label = computed(() => localDirectoryRef.value.getName());
  const path = computed(() => localDirectoryRef.value.getPath());

  const currentDirectoryEntry: LocalDirectoryRef = reactive({
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
): LocalDirectoryRef => {
  const roodLocalDirectory = createLocalDirectory(rootHandler);

  const rootEntry = createLocalDirectoryRef(roodLocalDirectory);

  return rootEntry;
};
