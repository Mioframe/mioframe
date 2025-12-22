import { pathToString } from '@shared/service/directories';
import { DomainError } from '../error';
import type { DirectoryLocalEntry, GeneralLocalEntry } from './types';

export const createLocalEntry = (
  currentHandle: FileSystemHandle,
  parentLocalDirectory?: DirectoryLocalEntry,
  rootName?: string,
): GeneralLocalEntry => {
  const remove = async () => {
    if (parentLocalDirectory) {
      if (!('removeByName' in parentLocalDirectory)) {
        throw new DomainError(
          `"${pathToString(parentLocalDirectory.path)}" don't have removeByName method`,
        );
      }

      await parentLocalDirectory.removeByName(currentHandle.name);
    } else {
      throw new DomainError('root Entry cannot be remove');
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
