import type { AdvancedGDrive } from './getGDrive';
import type { FileGDriveApi } from './types';

export const createGDriveFileApi = (
  gdrive: AdvancedGDrive,
  fileId: string,
  name: string,
): FileGDriveApi => {
  const currentFileId = fileId;
  let currentName = name;

  const getName = () => currentName;

  const rename = async (newName: string): Promise<FileGDriveApi> => {
    await gdrive.files.update(
      { fileId: currentFileId },
      {
        name: newName,
      },
    );

    currentName = newName;

    return currentApi;
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

  const currentApi: FileGDriveApi = {
    getName,
    rename,
    remove,
    read,
  };

  return currentApi;
};
