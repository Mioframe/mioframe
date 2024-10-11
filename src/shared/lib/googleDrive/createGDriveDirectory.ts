import { createGDriveFile as createGDriveFile } from './createGDriveFile';
import type { AdvancedGDrive } from './getGDrive';
import type { GDriveDirectoryContent, GDriveFile } from './types';
import { GOOGLE_FOLDER_MIME_TYPE, type GDriveDirectory } from './types';

export enum SPACE {
  // user drive
  MyDrive,
  // drive with shared data
  SharedWithMe,
}

export const createGDriveDirectory = (
  gdrive: AdvancedGDrive,
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
    } = await gdrive.files.create({
      resource: {
        name,
        mimeType: GOOGLE_FOLDER_MIME_TYPE,
        parents: [currentGDriveFolderId],
      },
    });

    if (folderId) {
      void triggerWatchers();
      return createGDriveDirectory(gdrive, { gDriveFolderId: folderId, name });
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

    void triggerWatchers();
    return currentGDriveDirectory;
  };

  const getName = () => currentName;

  const remove = async () => {
    await gdrive.files.delete({ fileId: currentGDriveFolderId });
    void triggerWatchers();
  };

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
    } = await gdrive.files.list({
      q,
      fields: 'files(id, name, mimeType)',
      spaces,
    });

    files?.forEach(({ name, id, mimeType }) => {
      if (name && id && mimeType)
        if (mimeType === GOOGLE_FOLDER_MIME_TYPE) {
          contentMap.set(
            name,
            createGDriveDirectory(gdrive, { gDriveFolderId: id, name }),
          );
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
      await gdrive.uploadFile(fileId, file);
    }
    void triggerWatchers();
    return createGDriveFile(gdrive, fileId, name);
  };

  const removeByName = async (name: string) => {
    const list = await getMap();
    const file = list.get(name);
    await file?.remove();
    void triggerWatchers();
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

  const triggerWatchers = async () => {
    if (watchersSet.size > 0) {
      const directoryList = await currentGDriveDirectory.get();

      watchersSet.forEach((watcher) => watcher(directoryList));
    }
  };

  const currentGDriveDirectory: GDriveDirectory = {
    createDirectory,
    rename,
    getName,
    remove,
    get: getMap,
    writeFile,
    removeByName,
    addWatcher,
    removeWatcher,
  };

  return currentGDriveDirectory;
};
