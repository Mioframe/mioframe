import { from, some } from 'ix/Ix.asynciterable';
import { createLocalEntry } from './entry';
import { createLocalFile } from './file';
import type { LocalDirectory, LocalDirectoryContent, LocalFile } from './types';
import { map } from 'ix/Ix.asynciterable.operators';
import { createLogger } from '../logger';

const { debug } = createLogger('directory');

export const createLocalDirectory = (
  currentHandle: FileSystemDirectoryHandle,
  parentEntry?: LocalDirectory,
): LocalDirectory => {
  const currentEntry = createLocalEntry(currentHandle, parentEntry);

  const createContentIterable = () => {
    return from(currentHandle.entries()).pipe(
      map(([name, handle]): [string, LocalDirectory | LocalFile] => {
        debug('createContentIterable map', [name, handle]);

        switch (handle.kind) {
          case 'directory':
            return [name, createLocalDirectory(handle, currentDirectoryEntry)];

          case 'file':
            return [name, createLocalFile(handle, currentDirectoryEntry)];
        }
      }),
    );
  };

  const createDirectory = async (name: string) => {
    const directoryHandle = await currentHandle.getDirectoryHandle(name, {
      create: true,
    });

    const directoryEntry = createLocalDirectory(
      directoryHandle,
      currentDirectoryEntry,
    );

    triggerWatchers();

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

    triggerWatchers();

    return fileEntry;
  };

  const removeByName = async (name: string) => {
    await currentHandle.removeEntry(name, { recursive: true });
    triggerWatchers();
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

    await from(currentDirectoryEntry.children).forEach(async ([, entry]) => {
      await entry.copyTo(newDirectoryEntry);
    });

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

    await from(currentDirectoryEntry.children).forEach(async ([, entry]) => {
      await entry.moveTo(newDirectoryEntry);
    });

    await currentEntry.remove();

    return newDirectoryEntry;
  };

  const rename = async (newName: string) => {
    if (!parentEntry) {
      throw new Error('root Entry cannot be renamed');
    }

    const isAlreadyContains = await some(from(currentDirectoryEntry.children), {
      predicate: ([name]) => name === newName,
    });

    if (isAlreadyContains) {
      throw new Error(
        `"${parentEntry.getName()}" already contains "${newName}"`,
      );
    }

    const newDirectoryEntry = await parentEntry.createDirectory(newName);

    await from(currentDirectoryEntry.children).forEach(async ([, entry]) => {
      await entry.moveTo(newDirectoryEntry);
    });

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

  const triggerWatchers = () => {
    if (watchersSet.size > 0) {
      watchersSet.forEach((watcher) => watcher(currentDirectoryEntry.children));
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
    get children() {
      return createContentIterable();
    },
    addWatcher,
    removeWatcher,
  };

  return currentDirectoryEntry;
};
