import { createEntry } from './entry';
import { createFileEntry } from './fileEntry';
import type { DirectoryEntry, DirectoryList } from './types';

export const createDirectoryEntry = (
  currentHandle: FileSystemDirectoryHandle,
  parentEntry?: DirectoryEntry,
): DirectoryEntry => {
  const currentEntry = createEntry(currentHandle, parentEntry);

  const entityList: DirectoryList = new Map();

  const getDirectoryList = async () => {
    entityList.clear();
    for await (const [name, handle] of currentHandle.entries()) {
      switch (handle.kind) {
        case 'directory':
          entityList.set(
            name,
            createDirectoryEntry(handle, currentDirectoryEntry),
          );
          break;
        case 'file':
          entityList.set(name, createFileEntry(handle, currentDirectoryEntry));
          break;
      }
    }
    return entityList;
  };

  const createDirectory = async (name: string) => {
    const directoryHandle = await currentHandle.getDirectoryHandle(name, {
      create: true,
    });

    return createDirectoryEntry(directoryHandle, parentEntry);
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
    return createFileEntry(newFileHandle, currentDirectoryEntry);
  };

  const removeByName = async (name: string) => {
    await currentHandle.removeEntry(name);
  };

  const copyTo = async (dest: DirectoryEntry) => {
    const newDirectoryEntry = await dest.createDirectory(currentEntry.name);

    const directoryList = await getDirectoryList();

    for (const [, entry] of directoryList) {
      await entry.copyTo(newDirectoryEntry);
    }

    return newDirectoryEntry;
  };

  const moveTo = async (dest: DirectoryEntry) => {
    const newDirectoryEntry = await dest.createDirectory(currentEntry.name);

    const directoryList = await getDirectoryList();

    for (const [, entry] of directoryList) {
      await entry.moveTo(newDirectoryEntry);
    }

    await currentEntry.remove();

    return newDirectoryEntry;
  };

  const rename = async (newName: string) => {
    if (parentEntry) {
      const newDirectoryEntry = await parentEntry.createDirectory(newName);
      const directoryList = await getDirectoryList();

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
    getDirectoryList,
    createDirectory,
    writeFile,
    removeByName,
    copyTo,
    moveTo,
    rename,
  };

  return currentDirectoryEntry;
};
