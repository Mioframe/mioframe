import { createEntry } from './entry';
import type { DirectoryEntry, FileEntry } from './types';

export const createFileEntry = (
  currentHandle: FileSystemFileHandle,
  parentEntry: DirectoryEntry,
): FileEntry => {
  const currentEntry = createEntry(currentHandle, parentEntry);

  const read = async () => {
    return await currentHandle.getFile();
  };

  const rename = async (newName: string) => {
    const file = await read();
    const newEntry = await parentEntry.writeFile(newName, file);
    await currentEntry.remove();
    return newEntry;
  };

  const copyTo = async (dest: DirectoryEntry) => {
    const file = await read();
    return await dest.writeFile(currentEntry.name, file);
  };

  const moveTo = async (dest: DirectoryEntry) => {
    const newEntry = await copyTo(dest);
    await currentEntry.remove();
    return newEntry;
  };

  return {
    ...currentEntry,
    rename,
    read,
    copyTo,
    moveTo,
  };
};
