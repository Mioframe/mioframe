import { createLogModule } from '../logger';
import { createGDriveFileApi } from './createGDriveFileApi';
import type { AdvancedGDrive } from './getGDrive';
import type { FileGDriveApi } from './types';
import { GOOGLE_FOLDER_MIME_TYPE, type DirectoryGDriveApi } from './types';

const { debug } = createLogModule('createGDriveDirectoryApi');

export const createGDriveDirectoryApi = (
  gdrive: AdvancedGDrive,
  folderId: string,
  name: string,
): DirectoryGDriveApi => {
  const currentFolderId = folderId;
  let currentName = name;

  const createDirectory = async (name: string) => {
    const {
      result: { id: folderId },
    } = await gdrive.files.create({
      resource: {
        name,
        mimeType: GOOGLE_FOLDER_MIME_TYPE,
        parents: [currentFolderId],
      },
    });

    if (folderId) {
      return createGDriveDirectoryApi(gdrive, folderId, name);
    }
    throw new Error('failed to create directory');
  };

  const rename = async (newName: string): Promise<DirectoryGDriveApi> => {
    await gdrive.files.update(
      { fileId: currentFolderId },
      {
        name: newName,
      },
    );

    currentName = newName;

    return currentApi;
  };

  const getName = () => currentName;

  const remove = async () => {
    await gdrive.files.delete({ fileId: currentFolderId });
  };

  const getList = async (): Promise<
    Map<string, DirectoryGDriveApi | FileGDriveApi>
  > => {
    const contentMap: Map<string, DirectoryGDriveApi | FileGDriveApi> =
      new Map();

    const {
      result: { files },
    } = await gdrive.files.list({
      q: `'${folderId}' in parents`,
      fields: 'files(id, name, mimeType)',
    });

    files?.forEach(({ name, id, mimeType }) => {
      if (name && id && mimeType)
        if (mimeType === GOOGLE_FOLDER_MIME_TYPE) {
          contentMap.set(name, createGDriveDirectoryApi(gdrive, id, name));
        } else {
          contentMap.set(name, createGDriveFileApi(gdrive, id, name));
        }
    });

    return contentMap;
  };

  const writeFile = async (
    name: string,
    file?: FileSystemWriteChunkType,
  ): Promise<FileGDriveApi> => {
    const {
      result: { id: fileId },
    } = await gdrive.files.create({
      resource: {
        name,
        parents: [currentFolderId],
      },
    });
    if (!fileId) {
      throw new Error('failed to create file');
    }
    if (file) {
      const { result } = await gdrive.uploadFile(fileId, file);
      debug('result', result);
    }
    return createGDriveFileApi(gdrive, fileId, name);
  };

  const removeByName = async (name: string) => {
    const list = await getList();
    const file = list.get(name);
    await file?.remove();
  };

  const currentApi: DirectoryGDriveApi = {
    createDirectory,
    rename,
    getName,
    remove,
    getList,
    writeFile,
    removeByName,
  };

  return currentApi;
};
