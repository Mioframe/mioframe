import type { AdvancedGDrive } from '../googleApi/types';
import type { GDriveFile } from './types';

export const createGDriveFile = (
  gdrive: AdvancedGDrive,
  fileId: string,
  name: string,
): GDriveFile => {
  const currentFileId = fileId;
  let currentName = name;

  const getName = () => currentName;

  const rename = async (newName: string): Promise<GDriveFile> => {
    await gdrive.files.update(
      { fileId: currentFileId },
      {
        name: newName,
      },
    );

    currentName = newName;

    return currentGDriveFile;
  };

  const remove = async () => {
    await gdrive.files.delete({ fileId: currentFileId });
  };

  const read = async (): Promise<File> =>
    await gdrive.downloadFile(currentFileId, currentName);

  const currentGDriveFile: GDriveFile = {
    getName,
    rename,
    remove,
    read,
  };

  return currentGDriveFile;
};
