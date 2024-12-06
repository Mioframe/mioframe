import type { AdvancedGDrive } from '../googleApi/types';
import { createGDriveFile as createGDriveFile } from './createGDriveFile';
import type { GDriveDirectoryContent, GDriveFile } from './types';
import { GOOGLE_FOLDER_MIME_TYPE, type GDriveDirectory } from './types';

export enum SPACE {
  // user drive
  MyDrive,
  // drive with shared data
  SharedWithMe,
}

export const createGDriveDirectory = (
  gDrive: AdvancedGDrive,
  {
    gDriveFolderId = 'root',
    name = 'root',
    space = SPACE.MyDrive,
  }: {
    gDriveFolderId?: string;
    name?: string;
    space?: SPACE;
  } = {},
): GDriveDirectory => {
  const currentGDriveFolderId = gDriveFolderId;
  let currentName = name;

  const createDirectory = async (name: string) => {
    const {
      result: { id: folderId },
    } = await gDrive.files.create({
      resource: {
        name,
        mimeType: GOOGLE_FOLDER_MIME_TYPE,
        parents: [currentGDriveFolderId],
      },
    });

    if (folderId) {
      triggerWatchers();
      return createGDriveDirectory(gDrive, { gDriveFolderId: folderId, name });
    }
    throw new Error('failed to create directory');
  };

  const rename = async (newName: string): Promise<GDriveDirectory> => {
    await gDrive.files.update(
      { fileId: currentGDriveFolderId },
      {
        name: newName,
      },
    );

    currentName = newName;

    triggerWatchers();
    return currentGDriveDirectory;
  };

  const getName = () => currentName;

  const remove = async () => {
    await gDrive.files.delete({ fileId: currentGDriveFolderId });
    triggerWatchers();
  };

  async function* childrenIterator(): AsyncIterator<
    [string, GDriveDirectory | GDriveFile]
  > {
    const spaces = space === SPACE.MyDrive ? 'drive' : undefined;

    let q = `'${gDriveFolderId}' in parents`;
    if (space === SPACE.SharedWithMe && gDriveFolderId === 'root') {
      q = 'sharedWithMe';
    }

    const {
      result: { files = [] },
    } = await gDrive.files.list({
      q,
      fields: 'files(id, name, mimeType)',
      spaces,
    });

    for (const { name, id, mimeType } of files) {
      if (name && id && mimeType)
        if (mimeType === GOOGLE_FOLDER_MIME_TYPE) {
          yield [
            name,
            createGDriveDirectory(gDrive, {
              gDriveFolderId: id,
              name,
            }),
          ];
        } else {
          yield [name, createGDriveFile(gDrive, id, name)];
        }
    }
  }

  const getMap = async (): Promise<
    Map<string, GDriveDirectory | GDriveFile>
  > => {
    const contentMap: Map<string, GDriveDirectory | GDriveFile> = new Map();

    const spaces = space === SPACE.MyDrive ? 'drive' : undefined;

    let q = `'${gDriveFolderId}' in parents`;
    if (space === SPACE.SharedWithMe && gDriveFolderId === 'root') {
      q = 'sharedWithMe';
    }

    const {
      result: { files },
    } = await gDrive.files.list({
      q,
      fields: 'files(id, name, mimeType)',
      spaces,
    });

    files?.forEach(({ name, id, mimeType }) => {
      if (name && id && mimeType)
        if (mimeType === GOOGLE_FOLDER_MIME_TYPE) {
          contentMap.set(
            name,
            createGDriveDirectory(gDrive, { gDriveFolderId: id, name }),
          );
        } else {
          contentMap.set(name, createGDriveFile(gDrive, id, name));
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
    } = await gDrive.files.create({
      resource: {
        name,
        parents: [currentGDriveFolderId],
      },
    });
    if (!fileId) {
      throw new Error('failed to create file');
    }
    if (file) {
      await gDrive.uploadFile(fileId, file);
    }
    triggerWatchers();
    return createGDriveFile(gDrive, fileId, name);
  };

  const removeByName = async (name: string) => {
    const list = await getMap();
    const file = list.get(name);
    await file?.remove();
    triggerWatchers();
  };

  const watchersSet = new Set<(list: GDriveDirectoryContent) => unknown>();

  const addWatcher = (handler: (list: GDriveDirectoryContent) => unknown) => {
    watchersSet.add(handler);
  };

  const removeWatcher = (
    handler: (list: GDriveDirectoryContent) => unknown,
  ) => {
    watchersSet.delete(handler);
  };

  const triggerWatchers = () => {
    if (watchersSet.size > 0) {
      watchersSet.forEach((watcher) =>
        watcher(currentGDriveDirectory.children),
      );
    }
  };

  const currentGDriveDirectory: GDriveDirectory = {
    createDirectory,
    rename,
    getName,
    remove,
    children: {
      [Symbol.asyncIterator]: childrenIterator,
    },
    writeFile,
    removeByName,
    addWatcher,
    removeWatcher,
  };

  return currentGDriveDirectory;
};
