import type { DirectoryGDriveEntry, RootGDriveEntry } from './types';
import { DomainError } from '../error';
import type { GoogleAuthParams } from './api';
import { update } from './api/simplifiedAPI';

/**
 * Creates a Google Drive entry facade with remove and rename operations.
 * @param auth - Google authentication parameters.
 * @param name - Entry name.
 * @param fileId - Google Drive file identifier, if available.
 * @param parentEntry - Parent directory entry, if available.
 * @returns A Google Drive entry facade.
 */
export const createGDriveEntry = (
  auth: GoogleAuthParams,
  name: string,
  fileId?: string,
  parentEntry?: DirectoryGDriveEntry | RootGDriveEntry,
) => {
  let currentName = name;

  const remove = async () => {
    if (!parentEntry) {
      throw new DomainError('Could not remove the item', {
        cause: new Error('Cannot remove root directory'),
      });
    }

    if (!('removeByName' in parentEntry)) {
      throw new DomainError('Could not remove the item', {
        cause: new Error('The parent entry does not support removal by name'),
      });
    }
    await parentEntry.removeByName(currentName);
  };

  const rename = async (newName: string): Promise<void> => {
    if (!fileId) {
      throw new DomainError('Could not rename the item', {
        cause: new Error('The selected item does not support renaming'),
      });
    }
    await update(auth, fileId, {
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
