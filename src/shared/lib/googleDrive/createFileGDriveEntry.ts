import type { DirectoryFSEntry, FileFSEntry } from '../fileSystem';
import { copyFileTo, moveFileTo } from '../fileSystem/utils';
import type { AdvancedGDrive } from '../googleApi/types';
import { createGDriveEntry } from './gDriveEntry';
import type {
  DirectoryGDriveEntry,
  FileGDriveEntry,
  GDriveSpace,
} from './types';

export const createFileGDriveEntry = (
  gDrive: AdvancedGDrive,
  fileId: string,
  name: string,
  parentEntry: DirectoryGDriveEntry,
  space: GDriveSpace,
): FileGDriveEntry => {
  const currentFileId = fileId;
  const currentName = name;

  const currentEntry = createGDriveEntry(gDrive, name, fileId, parentEntry);

  const rename = async (newName: string): Promise<FileGDriveEntry> => {
    await currentEntry.rename(newName);

    return currentFileGDriveEntry;
  };

  const read = async (): Promise<File> =>
    await gDrive.downloadFile(currentFileId, currentName);

  const copyTo = async (
    dest: DirectoryFSEntry | DirectoryGDriveEntry,
  ): Promise<FileFSEntry> => {
    if ('gDrive' in dest) {
      const {
        result: { id: newFileId, name: newName },
      } = await dest.gDrive.files.copy({
        fileId: currentFileId,
        resource: {
          name: currentName,
          parents: [dest.gDriveFileId],
        },
      });

      if (newFileId && newName) {
        return createFileGDriveEntry(gDrive, newFileId, newName, dest, space);
      }
    }
    return await copyFileTo(dest, currentFileGDriveEntry);
  };

  const moveTo = async (
    dest: DirectoryFSEntry | DirectoryGDriveEntry,
  ): Promise<FileFSEntry> => {
    if ('gDrive' in dest) {
      await dest.gDrive.files.update(
        {
          fileId: currentFileId,
          addParents: dest.gDriveFileId,
        },
        {},
      );

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
    gDrive,
    get gDriveFileId() {
      return currentFileId;
    },
    gDriveSpace: space,
  };

  return currentFileGDriveEntry;
};
