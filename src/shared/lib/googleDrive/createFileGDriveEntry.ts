import type { WritableDirectoryFSEntry, FileFSEntry } from '../fileSystem';
import { copyFileTo, moveFileTo } from '../fileSystem/utils';
import { api, type GoogleAuthParams } from './api';
import { createGDriveEntry } from './gDriveEntry';
import type {
  DirectoryGDriveEntry,
  FileGDriveEntry,
  GDriveSpace,
} from './types';

export const createFileGDriveEntry = (
  auth: GoogleAuthParams,
  fileId: string,
  name: string,
  parentEntry: DirectoryGDriveEntry,
  space: GDriveSpace,
): FileGDriveEntry => {
  const currentFileId = fileId;
  const currentName = name;

  const currentEntry = createGDriveEntry(auth, name, fileId, parentEntry);

  const rename = async (newName: string): Promise<FileGDriveEntry> => {
    await currentEntry.rename(newName);

    return currentFileGDriveEntry;
  };

  const read = async (): Promise<File> =>
    await api.files.download(auth, currentFileId, currentName);

  const copyTo = async (
    dest: WritableDirectoryFSEntry | DirectoryGDriveEntry,
  ): Promise<FileFSEntry> => {
    if ('gDriveFileId' in dest) {
      const {
        result: { id: newFileId, name: newName },
      } = await api.files.copy(auth, currentFileId, {
        resource: {
          name: currentName,
          parents: [dest.gDriveFileId],
        },
      });

      if (newFileId && newName) {
        return createFileGDriveEntry(auth, newFileId, newName, dest, space);
      }
    }
    return await copyFileTo(dest, currentFileGDriveEntry);
  };

  const moveTo = async (
    dest: WritableDirectoryFSEntry | DirectoryGDriveEntry,
  ): Promise<FileFSEntry> => {
    if ('gDriveFileId' in dest) {
      await api.files.update(auth, currentFileId, {
        addParents: [dest.gDriveFileId],
      });

      return currentFileGDriveEntry;
    }

    return await moveFileTo(dest, currentFileGDriveEntry);
  };

  const currentFileGDriveEntry: FileGDriveEntry = {
    type: 'file',
    ...currentEntry,
    get name() {
      return currentName;
    },
    get path() {
      return currentEntry.path;
    },
    rename,
    read,
    copyTo,
    moveTo,
    get gDriveFileId() {
      return currentFileId;
    },
    gDriveSpace: space,
  };

  return currentFileGDriveEntry;
};
