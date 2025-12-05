import { from, some } from 'ix/Ix.asynciterable';
import { createLocalEntry } from './entry';
import type {
  DirectoryLocalEntry,
  FileLocalEntry,
  WritableDirectoryLocalEntry,
} from './types';
import { moveFileTo } from '../fileSystem/utils';
import { DomainError } from '../error';
import { pathToString } from '@shared/service/directories';

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

    if (!('writeFile' in parentRefDirectory)) {
      throw new DomainError(
        `"${pathToString(parentRefDirectory.path)}" don't have writeFile method`,
      );
    }

    const newEntry = await parentRefDirectory.writeFile(newName, file);
    await currentEntry.remove();
    return newEntry;
  };

  const copyTo = async (dest: WritableDirectoryLocalEntry) => {
    const file = await read();
    return await dest.writeFile(currentEntry.name, file);
  };

  const moveTo = async (dest: WritableDirectoryLocalEntry) => {
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
