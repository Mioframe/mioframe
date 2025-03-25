import type { LocalDirectoryEntry, LocalGeneralEntry } from './types';

export const createLocalEntry = (
  currentHandle: FileSystemHandle,
  parentLocalDirectory?: LocalDirectoryEntry,
  rootName?: string,
): LocalGeneralEntry => {
  const remove = async () => {
    if (parentLocalDirectory) {
      await parentLocalDirectory.removeByName(currentHandle.name);
    } else {
      throw new Error('root Entry cannot be remove');
    }
  };

  const getPath = () => {
    const parentPath = parentLocalDirectory?.path ?? [];

    return parentPath.concat([getName()]);
  };

  const getName = () => rootName ?? currentHandle.name;

  return {
    remove,
    get name() {
      return getName();
    },
    get path() {
      return getPath();
    },
  };
};
