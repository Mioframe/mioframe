import type { AdvancedGDrive } from '@shared/lib/googleApi/types';
import {
  createGDriveDirectory,
  type GDriveDirectory,
} from '@shared/lib/googleDrive';
import { createLogger } from '@shared/lib/logger';

const { debug } = createLogger('previouslyCreatedFolders');

export const createPreviouslyCreatedFolders = (gdrive: AdvancedGDrive) => {
  const get = async (): Promise<Map<string, GDriveDirectory>> => {
    debug('get');
    const foundMap: Map<string, GDriveDirectory> = new Map();

    const {
      result: { files },
    } = await gdrive.files.list({
      q: "name = 'storage-adapter-id' and mimeType != 'application/vnd.google-apps.folder'",
      fields: 'files(id, name, mimeType, parents)',
    });

    debug('get', { files });

    const parentFolderIds = new Set<string>();

    files?.forEach(({ parents }) => {
      parents?.forEach((parentId) => parentFolderIds.add(parentId));
    });

    for (const parentId of parentFolderIds) {
      const {
        result: { name: parentName },
      } = await gdrive.files.get({
        fileId: parentId,
        fields: 'id, name, mimeType',
      });

      if (parentName && parentId) {
        foundMap.set(
          parentName,
          createGDriveDirectory(gdrive, {
            gDriveFolderId: parentId,
            name: parentName,
          }),
        );
      }
    }

    debug('get', { foundMap });

    return foundMap;
  };

  return {
    get,
  };
};
