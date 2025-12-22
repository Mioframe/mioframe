import { pathToString } from '@shared/service/directories';
import { api, type GoogleAuthParams } from './api';
import type { DirectoryGDriveEntry, RootGDriveEntry } from './types';
import { DomainError } from '../error';

export const createGDriveEntry = (
  auth: GoogleAuthParams,
  name: string,
  fileId?: string,
  parentEntry?: DirectoryGDriveEntry | RootGDriveEntry,
) => {
  let currentName = name;

  const remove = async () => {
    if (!parentEntry) {
      throw new Error('Cannot remove root directory');
    }

    if (!('removeByName' in parentEntry)) {
      throw new Error(
        `don\'t have "removeByName" method in ${pathToString(parentEntry.path)}`,
      );
    }
    await parentEntry.removeByName(currentName);
  };

  const rename = async (newName: string): Promise<void> => {
    if (!fileId) {
      throw new DomainError('You cannot rename an entry without a fileId.');
    }
    await api.files.update(auth, fileId, {
      name: newName,
    });

    currentName = newName;
  };

  return {
    remove,
    get path() {
      return parentEntry?.path.concat([currentName]) ?? [currentName];
    },
    rename,
    get name() {
      return currentName;
    },
  };
};
