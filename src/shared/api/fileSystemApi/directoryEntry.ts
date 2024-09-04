import { createEntryApi } from './entry';
import { createFileEntryApi } from './fileEntry';
import type { DirectoryEntryApi, DirectoryList } from '../types';

/*
для каждого провайдера своя точка входа в api.
у api одинаковый интерфейс, пока этого достаточно для реализации.
промежуточную обработку поведенческих ошибок сделать позже, оно касается бизнес процессов
*/

export const createDirectoryEntryApi = (
  currentHandle: FileSystemDirectoryHandle,
  parentEntry?: DirectoryEntryApi,
): DirectoryEntryApi => {
  const currentEntry = createEntryApi(currentHandle, parentEntry);

  const getList = async () => {
    const nowEntryList: DirectoryList = new Map();
    for await (const [name, handle] of currentHandle.entries()) {
      switch (handle.kind) {
        case 'directory':
          nowEntryList.set(
            name,
            createDirectoryEntryApi(handle, currentDirectoryEntry),
          );
          break;
        case 'file':
          nowEntryList.set(
            name,
            createFileEntryApi(handle, currentDirectoryEntry),
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

    const directoryEntry = createDirectoryEntryApi(
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

    const fileEntry = createFileEntryApi(newFileHandle, currentDirectoryEntry);

    void triggerWatchers();

    return fileEntry;
  };

  const removeByName = async (name: string) => {
    await currentHandle.removeEntry(name, { recursive: true });
    void triggerWatchers();
  };

  const copyTo = async (dest: DirectoryEntryApi) => {
    const currentPath = currentEntry.getPath();

    const destPath = dest.getPath();

    if (childHasParent(destPath, currentPath)) {
      throw new Error(
        `impossible to copy "${currentPath.join('/')}" to "${destPath.join('/')}"`,
      );
    }

    const currentEntryName = currentEntry.getName();

    const newDirectoryEntry = await dest.createDirectory(currentEntryName);

    const directoryList = await currentDirectoryEntry.getList();

    for (const [, entry] of directoryList) {
      await entry.copyTo(newDirectoryEntry);
    }

    return newDirectoryEntry;
  };

  const moveTo = async (dest: DirectoryEntryApi) => {
    const parentPath = parentEntry?.getPath() ?? [];

    if (childHasParent(dest.getPath(), parentPath)) {
      throw new Error(
        `impossible to move "${currentEntry.getName()}" from "${parentPath.join('/')}" to "${dest.getPath().join('/')}"`,
      );
    }

    const newDirectoryEntry = await dest.createDirectory(
      currentEntry.getName(),
    );

    const directoryList = await currentDirectoryEntry.getList();

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

    const directoryList = await currentDirectoryEntry.getList();

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

  const watchersSet = new Set<(list: DirectoryList) => unknown>();

  const addWatcher = (handler: (list: DirectoryList) => unknown) => {
    watchersSet.add(handler);
  };

  const removeWatcher = (handler: (list: DirectoryList) => unknown) => {
    watchersSet.delete(handler);
  };

  const triggerWatchers = async () => {
    if (watchersSet.size > 0) {
      const directoryList = await currentDirectoryEntry.getList();

      watchersSet.forEach((watcher) => watcher(directoryList));
    }
  };

  const currentDirectoryEntry: DirectoryEntryApi = {
    ...currentEntry,
    createDirectory,
    writeFile,
    removeByName,
    copyTo,
    moveTo,
    rename,
    getList,
    addWatcher,
    removeWatcher,
  };

  return currentDirectoryEntry;
};
