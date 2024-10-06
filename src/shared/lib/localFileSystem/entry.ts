import type { LocalDirectory, LocalEntry } from './types';

export const createLocalEntry = (
  currentHandle: FileSystemHandle,
  parentLocalDirectory?: LocalDirectory,
): LocalEntry => {
  const remove = async () => {
    if (parentLocalDirectory) {
      await parentLocalDirectory.removeByName(currentHandle.name);
    } else {
      throw new Error('root Entry cannot be remove');
    }
  };

  const getPath = () => {
    const parentPath = parentLocalDirectory?.getPath() ?? [];

    return parentPath.concat([getName()]);
  };

  const getName = () => currentHandle.name;

  return {
    getName,
    remove,
    getPath,
  };
};
