import { createLogger } from '../logger';
import { createGDriveFile as createGDriveFile } from './createGDriveFile';
import type { AdvancedGDrive } from './getGDrive';
import type { GDriveFile } from './types';
import { GOOGLE_FOLDER_MIME_TYPE, type GDriveDirectory } from './types';

const { debug } = createLogger('createGDriveDirectory');

export const createGDriveDirectory = (
  gdrive: AdvancedGDrive,
  gDriveFolderId: string = 'root',
  name: string = 'root',
): GDriveDirectory => {
  const currentGDriveFolderId = gDriveFolderId;
  let currentName = name;

  const createDirectory = async (name: string) => {
    const {
      result: { id: folderId },
    } = await gdrive.files.create({
      resource: {
        name,
        mimeType: GOOGLE_FOLDER_MIME_TYPE,
        parents: [currentGDriveFolderId],
      },
    });

    if (folderId) {
      return createGDriveDirectory(gdrive, folderId, name);
    }
    throw new Error('failed to create directory');
  };

  const rename = async (newName: string): Promise<GDriveDirectory> => {
    await gdrive.files.update(
      { fileId: currentGDriveFolderId },
      {
        name: newName,
      },
    );

    currentName = newName;

    return currentGDriveDirectory;
  };

  const getName = () => currentName;

  const remove = async () => {
    await gdrive.files.delete({ fileId: currentGDriveFolderId });
  };

  const getList = async (): Promise<
    Map<string, GDriveDirectory | GDriveFile>
  > => {
    const contentMap: Map<string, GDriveDirectory | GDriveFile> = new Map();

    const {
      result: { files },
    } = await gdrive.files.list({
      q: `'${gDriveFolderId}' in parents`,
      fields: 'files(id, name, mimeType)',
    });

    files?.forEach(({ name, id, mimeType }) => {
      if (name && id && mimeType)
        if (mimeType === GOOGLE_FOLDER_MIME_TYPE) {
          contentMap.set(name, createGDriveDirectory(gdrive, id, name));
        } else {
          contentMap.set(name, createGDriveFile(gdrive, id, name));
        }
    });

    return contentMap;
  };

  const writeFile = async (
    name: string,
    file?: FileSystemWriteChunkType,
  ): Promise<GDriveFile> => {
    const {
      result: { id: fileId },
    } = await gdrive.files.create({
      resource: {
        name,
        parents: [currentGDriveFolderId],
      },
    });
    if (!fileId) {
      throw new Error('failed to create file');
    }
    if (file) {
      const { result } = await gdrive.uploadFile(fileId, file);
      debug('result', result);
    }
    return createGDriveFile(gdrive, fileId, name);
  };

  const removeByName = async (name: string) => {
    const list = await getList();
    const file = list.get(name);
    await file?.remove();
  };

  const currentGDriveDirectory: GDriveDirectory = {
    createDirectory,
    rename,
    getName,
    remove,
    getList,
    writeFile,
    removeByName,
  };

  return currentGDriveDirectory;
};
