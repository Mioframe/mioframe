import type { AdvancedGDrive } from '../googleApi/types';
import { createGDriveDirectory, SPACE } from './createGDriveDirectory';
import type { GDriveDirectory, GDriveSpaces } from './types';

export const createGDriveSpaces = (gDrive: AdvancedGDrive): GDriveSpaces => {
  let spacesMap: Map<string, GDriveDirectory> | undefined;

  const getSpaces = (): Map<string, GDriveDirectory> => {
    if (!spacesMap) {
      spacesMap = new Map();

      spacesMap.set(
        'Shared with me',
        createGDriveDirectory(gDrive, {
          space: SPACE.SharedWithMe,
        }),
      );

      spacesMap.set(
        'My Drive',
        createGDriveDirectory(gDrive, {
          space: SPACE.MyDrive,
        }),
      );
    }
    return spacesMap;
  };

  return {
    children: getSpaces(),
  };
};
