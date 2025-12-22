import type { WritableDirectoryFSEntry } from '../fileSystem';
import { DRIVE_GOOGLE_SCOPE, type GOOGLE_SCOPE } from '../googleApi';
import { objectEntries } from '../objectEntries';
import { createDirectoryGDriveEntry } from './createDirectoryGDriveEntry';
import {
  type RootGDriveEntry,
  GOOGLE_DRIVE_SPACE,
  zodGOOGLE_DRIVE_SPACE,
} from './types';

export const createRootGDriveEntry = (
  userToken: string,
  scopes: ReadonlySet<GOOGLE_SCOPE>,
  name: string,
  onGetError: (e: Error) => unknown,
): RootGDriveEntry => {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  const token = userToken;

  const get = (name: string) => {
    const space = zodGOOGLE_DRIVE_SPACE.parse(name);

    const folderId =
      space === GOOGLE_DRIVE_SPACE.appDataFolder
        ? 'appDataFolder'
        : space === GOOGLE_DRIVE_SPACE.MyDrive
          ? 'root'
          : undefined;

    return createDirectoryGDriveEntry(name, gDriveRootEntry, {
      apiKey,
      folderId,
      space,
      token,
      onGetError,
    });
  };

  function* entries(): IterableIterator<[string, WritableDirectoryFSEntry]> {
    for (const [, space] of objectEntries(GOOGLE_DRIVE_SPACE)) {
      if (
        (space === GOOGLE_DRIVE_SPACE.appDataFolder &&
          scopes.has(DRIVE_GOOGLE_SCOPE.appdata)) ||
        ((space === GOOGLE_DRIVE_SPACE.appDataFolder ||
          space === GOOGLE_DRIVE_SPACE.SharedWithMe) &&
          (scopes.has(DRIVE_GOOGLE_SCOPE.all) ||
            scopes.has(DRIVE_GOOGLE_SCOPE.readonly) ||
            scopes.has(DRIVE_GOOGLE_SCOPE.file)))
      ) {
        yield [space, get(space)] as const;
      }
    }
  }

  const gDriveRootEntry: RootGDriveEntry = {
    type: 'directory',
    entries,
    get,
    name,
    path: [name],
  };

  return gDriveRootEntry;
};
