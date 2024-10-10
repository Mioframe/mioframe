import { createLocalEntry } from './entry';
import { createLocalFile } from './file';
import type { LocalDirectory, LocalDirectoryContent } from './types';

export const createLocalDirectory = (
  currentHandle: FileSystemDirectoryHandle,
  parentEntry?: LocalDirectory,
): LocalDirectory => {
  const currentEntry = createLocalEntry(currentHandle, parentEntry);

  const getList = async () => {
    const nowEntryList: LocalDirectoryContent = new Map();
    for await (const [name, handle] of currentHandle.entries()) {
      switch (handle.kind) {
        case 'directory':
          nowEntryList.set(
            name,
            createLocalDirectory(handle, currentDirectoryEntry),
          );
          break;
        case 'file':
          nowEntryList.set(
            name,
            createLocalFile(handle, currentDirectoryEntry),
          );
          break;
      }
    }

    return nowEntryList;
  };

  const createDirectory = async (name: string) => {
    const directoryHandle = await currentHandle.getDirectoryHandle(name, {
      create: true,
    });

    const directoryEntry = createLocalDirectory(
      directoryHandle,
      currentDirectoryEntry,
    );

    void triggerWatchers();

    return directoryEntry;
  };

  const writeFile = async (name: string, file?: FileSystemWriteChunkType) => {
    const newFileHandle = await currentHandle.getFileHandle(name, {
      create: true,
    });
    if (file) {
      const writable = await newFileHandle.createWritable();
      await writable.write(file);
      await writable.close();
    }

    const fileEntry = createLocalFile(newFileHandle, currentDirectoryEntry);

    void triggerWatchers();

    return fileEntry;
  };

  const removeByName = async (name: string) => {
    await currentHandle.removeEntry(name, { recursive: true });
    void triggerWatchers();
  };

  const copyTo = async (dest: LocalDirectory) => {
    const currentPath = currentEntry.getPath();

    const destPath = dest.getPath();

    if (childHasParent(destPath, currentPath)) {
      throw new Error(
        `impossible to copy "${currentPath.join('/')}" to "${destPath.join('/')}"`,
      );
    }

    const currentEntryName = currentEntry.getName();

    const newDirectoryEntry = await dest.createDirectory(currentEntryName);

    const directoryList = await currentDirectoryEntry.get();

    for (const [, entry] of directoryList) {
      await entry.copyTo(newDirectoryEntry);
    }

    return newDirectoryEntry;
  };

  const moveTo = async (dest: LocalDirectory) => {
    const parentPath = parentEntry?.getPath() ?? [];

    if (childHasParent(dest.getPath(), parentPath)) {
      throw new Error(
        `impossible to move "${currentEntry.getName()}" from "${parentPath.join('/')}" to "${dest.getPath().join('/')}"`,
      );
    }

    const newDirectoryEntry = await dest.createDirectory(
      currentEntry.getName(),
    );

    const directoryList = await currentDirectoryEntry.get();

    for (const [, entry] of directoryList) {
      await entry.moveTo(newDirectoryEntry);
    }

    await currentEntry.remove();

    return newDirectoryEntry;
  };

  const rename = async (newName: string) => {
    if (!parentEntry) {
      throw new Error('root Entry cannot be renamed');
    }

    const directoryList = await currentDirectoryEntry.get();

    if (directoryList.has(newName)) {
      throw new Error(
        `"${parentEntry.getName()}" already contains "${newName}"`,
      );
    }

    const newDirectoryEntry = await parentEntry.createDirectory(newName);

    for (const [, entry] of directoryList) {
      await entry.moveTo(newDirectoryEntry);
    }

    await currentEntry.remove();

    return newDirectoryEntry;
  };

  const childHasParent = (
    childPath: string[],
    parentPath: string[],
  ): boolean => {
    if (parentPath.length > childPath.length) {
      return false;
    }

    for (let i = 0; i < parentPath.length; i++) {
      if (childPath[i] !== parentPath[i]) {
        return false;
      }
    }

    return true;
  };

  const watchersSet = new Set<(list: LocalDirectoryContent) => unknown>();

  const addWatcher = (handler: (list: LocalDirectoryContent) => unknown) => {
    watchersSet.add(handler);
  };

  const removeWatcher = (handler: (list: LocalDirectoryContent) => unknown) => {
    watchersSet.delete(handler);
  };

  const triggerWatchers = async () => {
    if (watchersSet.size > 0) {
      const directoryList = await currentDirectoryEntry.get();

      watchersSet.forEach((watcher) => watcher(directoryList));
    }
  };

  const currentDirectoryEntry: LocalDirectory = {
    ...currentEntry,
    createDirectory,
    writeFile,
    removeByName,
    copyTo,
    moveTo,
    rename,
    get: getList,
    addWatcher,
    removeWatcher,
  };

  return currentDirectoryEntry;
};
