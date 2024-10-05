import type { AdvancedGDrive } from './getGDrive';
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

  const read = async (): Promise<File> => {
    const { body } = await gdrive.files.get({
      fileId: currentFileId,
      alt: 'media',
    });

    const file = new File([body], currentName);

    return file;
  };

  const currentGDriveFile: GDriveFile = {
    getName,
    rename,
    remove,
    read,
  };

  return currentGDriveFile;
};
