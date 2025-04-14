import type { DirectoryLocalEntry, GeneralLocalEntry } from './types';

export const createLocalEntry = (
  currentHandle: FileSystemHandle,
  parentLocalDirectory?: DirectoryLocalEntry,
  rootName?: string,
): GeneralLocalEntry => {
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
