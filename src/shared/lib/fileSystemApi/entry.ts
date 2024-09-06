import type { DirectoryEntryFSApi, EntryFileSystemApi } from './types';

export const createEntryApi = (
  currentHandle: FileSystemHandle,
  parentEntryApi?: DirectoryEntryFSApi,
): EntryFileSystemApi => {
  const remove = async () => {
    if (parentEntryApi) {
      await parentEntryApi.removeByName(currentHandle.name);
    } else {
      throw new Error('root Entry cannot be remove');
    }
  };

  const getPath = () => {
    const parentPath = parentEntryApi?.getPath() ?? [];

    return parentPath.concat([getName()]);
  };

  const getName = () => currentHandle.name;

  return {
    getName,
    remove,
    getPath,
  };
};
