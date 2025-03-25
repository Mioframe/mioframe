import type { AdvancedGDrive } from '../googleApi/types';
import type { DirectoryGDriveEntry } from './types';

export const createGDriveEntry = (
  gDrive: AdvancedGDrive,
  name: string,
  fileId: string,
  parentEntry?: DirectoryGDriveEntry,
) => {
  let currentName = name;

  const remove = async () => {
    if (!parentEntry) {
      throw new Error('Cannot remove root directory');
    }
    await parentEntry.removeByName(currentName);
  };

  const rename = async (newName: string): Promise<void> => {
    await gDrive.files.update(
      { fileId },
      {
        name: newName,
      },
    );

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
