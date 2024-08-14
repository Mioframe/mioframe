import type { DirectoryEntry, Entry } from './types';

export const createEntry = (
  currentHandle: FileSystemHandle,
  parentEntry?: DirectoryEntry,
): Entry => {
  const remove = async () => {
    if (parentEntry) {
      await parentEntry.removeByName(currentHandle.name);
    } else {
      throw new Error('root Entry cannot be remove');
    }
  };

  const path = (parentEntry?.path ?? []).concat([currentHandle.name]);

  return {
    get name() {
      return currentHandle.name;
    },
    remove,
    get path() {
      return path;
    },
  };
};
