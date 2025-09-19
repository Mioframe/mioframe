import { from, some } from 'ix/Ix.asynciterable';
import { createLocalEntry } from './entry';
import type { DirectoryLocalEntry, FileLocalEntry } from './types';
import { moveFileTo } from '../fileSystem/utils';

export const createLocalFile = (
  currentHandle: FileSystemFileHandle,
  parentRefDirectory: DirectoryLocalEntry,
): FileLocalEntry => {
  const currentEntry = createLocalEntry(currentHandle, parentRefDirectory);

  const read = async () => {
    return await currentHandle.getFile();
  };

  const rename = async (newName: string) => {
    const isAlreadyContains = await some(from(parentRefDirectory.entries()), {
      predicate: ([name]) => name === newName,
    });

    if (isAlreadyContains) {
      throw new Error(
        `"${parentRefDirectory.name}" already contains "${newName}"`,
      );
    }

    const file = await read();
    const newEntry = await parentRefDirectory.writeFile(newName, file);
    await currentEntry.remove();
    return newEntry;
  };

  const copyTo = async (dest: DirectoryLocalEntry) => {
    const file = await read();
    return await dest.writeFile(currentEntry.name, file);
  };

  const moveTo = async (dest: DirectoryLocalEntry) => {
    return await moveFileTo(dest, currentLocalFileEntry);
  };

  const currentLocalFileEntry: FileLocalEntry = {
    ...currentEntry,
    type: 'file',
    rename,
    read,
    copyTo,
    moveTo,
  };

  return currentLocalFileEntry;
};
