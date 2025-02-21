import { from, some } from 'ix/Ix.asynciterable';
import { createLocalEntry } from './entry';
import type { RefLocalDirectory, RefLocalFile } from './types';
import { reactive } from 'vue';

export const createLocalFile = (
  currentHandle: FileSystemFileHandle,
  parentRefDirectory: RefLocalDirectory,
): RefLocalFile => {
  const currentEntry = createLocalEntry(currentHandle, parentRefDirectory);

  const read = async () => {
    return await currentHandle.getFile();
  };

  const rename = async (newName: string) => {
    const isAlreadyContains = await some(from(parentRefDirectory.entries), {
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

  const copyTo = async (dest: RefLocalDirectory) => {
    const file = await read();
    return await dest.writeFile(currentEntry.name, file);
  };

  const moveTo = async (dest: RefLocalDirectory) => {
    const newEntry = await copyTo(dest);
    await currentEntry.remove();
    return newEntry;
  };

  return reactive({
    ...currentEntry,
    rename,
    read,
    copyTo,
    moveTo,
  });
};
