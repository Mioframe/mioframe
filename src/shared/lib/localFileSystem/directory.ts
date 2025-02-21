import { from, some } from 'ix/Ix.asynciterable';
import { createLocalEntry } from './entry';
import { createLocalFile } from './file';
import type { RefLocalDirectory, RefLocalFile } from './types';
import { map } from 'ix/Ix.asynciterable.operators';
import { createLogger } from '../logger';
import { reactive } from 'vue';
import { updateMap } from '../updateMap';

const { debug } = createLogger('directory');

export const createLocalDirectory = (
  currentHandle: FileSystemDirectoryHandle,
  parentRefDirectory?: RefLocalDirectory,
): RefLocalDirectory => {
  const currentEntry = createLocalEntry(currentHandle, parentRefDirectory);

  const stateEntries = reactive<Map<string, RefLocalDirectory | RefLocalFile>>(
    new Map(),
  );

  const updateEntries = async () => {
    const tempEntries = new Map<string, RefLocalDirectory | RefLocalFile>();
    await from(currentHandle.entries())
      .pipe(
        map(([name, handle]): [string, RefLocalDirectory | RefLocalFile] => {
          debug('createContentIterable map', [name, handle]);

          switch (handle.kind) {
            case 'directory':
              return [
                name,
                createLocalDirectory(handle, currentDirectoryEntry),
              ];

            case 'file':
              return [name, createLocalFile(handle, currentDirectoryEntry)];
          }
        }),
      )
      .forEach(([name, entry]) => {
        tempEntries.set(name, entry);
      });

    await updateMap(tempEntries, stateEntries);
  };

  const createDirectory = async (name: string) => {
    const directoryHandle = await currentHandle.getDirectoryHandle(name, {
      create: true,
    });

    const directoryEntry = createLocalDirectory(
      directoryHandle,
      currentDirectoryEntry,
    );

    stateEntries.set(name, directoryEntry);

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

    stateEntries.set(name, fileEntry);

    return fileEntry;
  };

  const removeByName = async (name: string) => {
    await currentHandle.removeEntry(name, { recursive: true });

    stateEntries.delete(name);
  };

  const copyTo = async (dest: RefLocalDirectory) => {
    const currentPath = currentEntry.path;

    const destPath = dest.path;

    if (childHasParent(destPath, currentPath)) {
      throw new Error(
        `impossible to copy "${currentPath.join('/')}" to "${destPath.join('/')}"`,
      );
    }

    const currentEntryName = currentEntry.name;

    const newDirectoryEntry = await dest.createDirectory(currentEntryName);

    await from(currentDirectoryEntry.entries).forEach(async ([, entry]) => {
      await entry.copyTo(newDirectoryEntry);
    });

    return newDirectoryEntry;
  };

  const moveTo = async (dest: RefLocalDirectory) => {
    const parentPath = parentRefDirectory?.path ?? [];

    if (childHasParent(dest.path, parentPath)) {
      throw new Error(
        `impossible to move "${currentEntry.name}" from "${parentPath.join('/')}" to "${dest.path.join('/')}"`,
      );
    }

    const newDirectoryEntry = await dest.createDirectory(currentEntry.name);

    await from(currentDirectoryEntry.entries).forEach(async ([, entry]) => {
      await entry.moveTo(newDirectoryEntry);
    });

    await currentEntry.remove();

    return newDirectoryEntry;
  };

  const rename = async (newName: string) => {
    if (!parentRefDirectory) {
      throw new Error('root Entry cannot be renamed');
    }

    const isAlreadyContains = await some(from(currentDirectoryEntry.entries), {
      predicate: ([name]) => name === newName,
    });

    if (isAlreadyContains) {
      throw new Error(
        `"${parentRefDirectory.name}" already contains "${newName}"`,
      );
    }

    const newDirectoryEntry = await parentRefDirectory.createDirectory(newName);

    await from(currentDirectoryEntry.entries).forEach(async ([, entry]) => {
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

  const currentDirectoryEntry: RefLocalDirectory = reactive({
    ...currentEntry,
    createDirectory,
    writeFile,
    removeByName,
    copyTo,
    moveTo,
    rename,
    get entries() {
      if (stateEntries.size === 0) {
        void updateEntries();
      }
      return stateEntries;
    },
  });

  return currentDirectoryEntry;
};
