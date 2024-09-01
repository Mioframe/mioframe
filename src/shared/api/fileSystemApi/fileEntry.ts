import { createEntryApi } from './entry';
import type { DirectoryEntryApi, FileEntryApi } from '../types';

export const createFileEntryApi = (
  currentHandle: FileSystemFileHandle,
  parentEntry: DirectoryEntryApi,
): FileEntryApi => {
  const currentEntry = createEntryApi(currentHandle, parentEntry);

  const read = async () => {
    return await currentHandle.getFile();
  };

  const rename = async (newName: string) => {
    const directoryList = await parentEntry.getList();

    if (directoryList.has(newName)) {
      throw new Error(
        `"${parentEntry.getName()}" already contains "${newName}"`,
      );
    }

    const file = await read();
    const newEntry = await parentEntry.writeFile(newName, file);
    await currentEntry.remove();
    return newEntry;
  };

  const copyTo = async (dest: DirectoryEntryApi) => {
    const file = await read();
    return await dest.writeFile(currentEntry.getName(), file);
  };

  const moveTo = async (dest: DirectoryEntryApi) => {
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
