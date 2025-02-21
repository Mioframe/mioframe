import { computed, reactive } from 'vue';
import type { RefLocalDirectory, RefLocalEntry } from './types';

export const createLocalEntry = (
  currentHandle: FileSystemHandle,
  parentLocalDirectory?: RefLocalDirectory,
): RefLocalEntry => {
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

  const getName = () => currentHandle.name;

  return reactive({
    remove,
    name: computed(() => getName()),
    path: computed(() => getPath()),
  });
};
