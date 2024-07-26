import { reactive } from 'vue';
import { createEntry } from './entry';
import { createFileEntry } from './fileEntry';
import type { DirectoryEntry, DirectoryList } from './types';
import { difference } from 'lodash-es';

export const createDirectoryEntry = (
  currentHandle: FileSystemDirectoryHandle,
  parentEntry?: DirectoryEntry,
): DirectoryEntry => {
  const currentEntry = createEntry(currentHandle, parentEntry);

  const stateEntryList = reactive<DirectoryList>(new Map());

  const updateDirectoryList = async () => {
    const nowEntryList: DirectoryList = new Map();
    for await (const [name, handle] of currentHandle.entries()) {
      switch (handle.kind) {
        case 'directory':
          nowEntryList.set(
            name,
            createDirectoryEntry(handle, currentDirectoryEntry),
          );
          break;
        case 'file':
          nowEntryList.set(
            name,
            createFileEntry(handle, currentDirectoryEntry),
          );
          break;
      }
    }

    const stateNames = Array.from(stateEntryList.keys());
    const nowNames = Array.from(nowEntryList.keys());

    const deletedNames = difference(stateNames, nowNames);

    deletedNames.forEach((name) => stateEntryList.delete(name));
    nowEntryList.forEach((entry, name) => {
      if (!stateEntryList.has(name)) {
        stateEntryList.set(name, entry);
      }
    });
  };

  const createDirectory = async (name: string) => {
    const directoryHandle = await currentHandle.getDirectoryHandle(name, {
      create: true,
    });

    const directoryEntry = createDirectoryEntry(
      directoryHandle,
      currentDirectoryEntry,
    );

    stateEntryList.set(name, directoryEntry);

    return directoryEntry;
  };

  const writeFile = async (name: string, file?: File) => {
    const newFileHandle = await currentHandle.getFileHandle(name, {
      create: true,
    });
    if (file) {
      const writable = await newFileHandle.createWritable();
      await writable.write(file);
      await writable.close();
    }

    const fileEntry = createFileEntry(newFileHandle, currentDirectoryEntry);

    stateEntryList.set(name, fileEntry);

    return fileEntry;
  };

  const removeByName = async (name: string) => {
    await currentHandle.removeEntry(name);
    stateEntryList.delete(name);
  };

  const copyTo = async (dest: DirectoryEntry) => {
    const newDirectoryEntry = await dest.createDirectory(currentEntry.name);

    const directoryList = currentDirectoryEntry.list;

    for (const [, entry] of directoryList) {
      await entry.copyTo(newDirectoryEntry);
    }

    return newDirectoryEntry;
  };

  const moveTo = async (dest: DirectoryEntry) => {
    const newDirectoryEntry = await dest.createDirectory(currentEntry.name);

    const directoryList = currentDirectoryEntry.list;

    for (const [, entry] of directoryList) {
      await entry.moveTo(newDirectoryEntry);
    }

    await currentEntry.remove();

    return newDirectoryEntry;
  };

  const rename = async (newName: string) => {
    if (parentEntry) {
      const newDirectoryEntry = await parentEntry.createDirectory(newName);
      const directoryList = currentDirectoryEntry.list;

      for (const [, entry] of directoryList) {
        await entry.moveTo(newDirectoryEntry);
      }

      await currentEntry.remove();

      return newDirectoryEntry;
    }
    throw new Error('root Entry cannot be renamed');
  };

  const currentDirectoryEntry = {
    ...currentEntry,
    createDirectory,
    writeFile,
    removeByName,
    copyTo,
    moveTo,
    rename,
    get list() {
      void updateDirectoryList();
      return stateEntryList;
    },
  };

  return currentDirectoryEntry;
};
