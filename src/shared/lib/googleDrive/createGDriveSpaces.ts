import type { AdvancedGDrive } from '../googleApi/types';
import { createGDriveDirectory, SPACE } from './createGDriveDirectory';
import type { GDriveDirectory, GDriveSpaces } from './types';

export const createGDriveSpaces = (gdrive: AdvancedGDrive): GDriveSpaces => {
  let spacesMap: Map<string, GDriveDirectory> | undefined;

  const getSpaces = (): Map<string, GDriveDirectory> => {
    if (!spacesMap) {
      spacesMap = new Map();

      spacesMap.set(
        'Shared with me',
        createGDriveDirectory(gdrive, {
          space: SPACE.SharedWithMe,
        }),
      );

      spacesMap.set(
        'My Drive',
        createGDriveDirectory(gdrive, {
          space: SPACE.MyDrive,
        }),
      );
    }
    return spacesMap;
  };

  return {
    get: getSpaces,
  };
};
