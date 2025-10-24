import { find } from 'ix/Ix.asynciterable';
import type {
  DirectoryEntryEventMap,
  DirectoryFSEntry,
} from '../fileSystem/DirectoryFSEntry';
import { copyDirectoryTo, moveDirectoryTo } from '../fileSystem/utils';
import { WeakValueMap } from '../WeakValueMap';
import { createFileGDriveEntry } from './createFileGDriveEntry';
import { createGDriveEntry } from './gDriveEntry';
import {
  GDriveSpace,
  GOOGLE_FOLDER_MIME_TYPE,
  type DirectoryGDriveEntry,
  type FileGDriveEntry,
} from './types';
import type { AuthParams } from './api';
import { api, SPACE } from './api';

const cacheDirectories = new WeakValueMap<string, DirectoryGDriveEntry>();

export const createDirectoryGDriveEntry = (
  auth: AuthParams,
  space = GDriveSpace.appDataFolder,
  gDriveFolderId?: string,
  name?: string,
  parentEntry?: DirectoryGDriveEntry,
): DirectoryGDriveEntry => {
  const currentGDriveFolderId =
    gDriveFolderId ??
    (space === GDriveSpace.appDataFolder
      ? 'appDataFolder'
      : space === GDriveSpace.MyDrive
        ? 'root'
        : 'root');

  const currentName = name ?? space;

  const currentEntry = createGDriveEntry(
    auth,
    currentName,
    currentGDriveFolderId,
    parentEntry,
  );

  const stringPath = currentEntry.path.join('/');

  const cachedDirectoryEntry = cacheDirectories.get(stringPath);

  if (cachedDirectoryEntry) {
    return cachedDirectoryEntry;
  }

  async function* entries(): AsyncIterableIterator<
    [string, DirectoryGDriveEntry | FileGDriveEntry]
  > {
    let q = `'${currentGDriveFolderId}' in parents`;
    if (
      space === GDriveSpace.SharedWithMe &&
      currentGDriveFolderId === 'root'
    ) {
      q = 'sharedWithMe';
    }

    const {
      result: { files = [] },
    } = await api.files.list(auth, {
      q,
      spaces:
        space !== GDriveSpace.SharedWithMe
          ? [space === GDriveSpace.MyDrive ? SPACE.drive : SPACE.appDataFolder]
          : undefined,
    });

    for (const { name, id: fileId, mimeType } of files) {
      if (name && fileId && mimeType)
        if (mimeType === GOOGLE_FOLDER_MIME_TYPE) {
          yield [
            name,
            createDirectoryGDriveEntry(
              auth,
              space,
              fileId,
              name,
              currentDirectoryGDriveEntry,
            ),
          ];
        } else {
          yield [
            name,
            createFileGDriveEntry(
              auth,
              fileId,
              name,
              currentDirectoryGDriveEntry,
              space,
            ),
          ];
        }
    }
  }

  const createDirectory = async (name: string) => {
    const {
      result: { id: folderId },
    } = await api.files.create(auth, {
      resource: {
        name,
        mimeType: GOOGLE_FOLDER_MIME_TYPE,
        parents: [currentGDriveFolderId],
      },
    });

    if (folderId) {
      const directoryEntry = createDirectoryGDriveEntry(
        auth,
        space,
        folderId,
        name,
        currentDirectoryGDriveEntry,
      );

      setForListenersOfAddingEntry.forEach((listener) =>
        listener(name, directoryEntry),
      );

      return directoryEntry;
    }
    throw new Error('failed to create directory');
  };

  const writeFile = async (
    name: string,
    file?: FileSystemWriteChunkType,
  ): Promise<FileGDriveEntry> => {
    const {
      result: { id: fileId },
    } = await api.files.create(auth, {
      resource: {
        name,
        parents: [currentGDriveFolderId],
      },
    });
    if (!fileId) {
      throw new Error('failed to create file');
    }
    if (file) {
      await api.files.upload(auth, fileId, file);
    }

    const fileEntry: FileGDriveEntry = createFileGDriveEntry(
      auth,
      fileId,
      name,
      currentDirectoryGDriveEntry,
      space,
    );

    setForListenersOfAddingEntry.forEach((listener) =>
      listener(name, fileEntry),
    );

    return fileEntry;
  };

  const removeByName = async (name: string) => {
    for await (const [fileName, entry] of entries()) {
      if (fileName === name) {
        await api.files.delete(auth, entry.gDriveFileId);

        setForListenersOfRemovingEntry.forEach((listener) => listener(name));

        return;
      }
    }
  };

  const rename = async (newName: string): Promise<DirectoryGDriveEntry> => {
    await currentEntry.rename(newName);
    return currentDirectoryGDriveEntry;
  };

  const setForListenersOfAddingEntry = new Set<DirectoryEntryEventMap['add']>();
  const setForListenersOfRemovingEntry = new Set<
    DirectoryEntryEventMap['remove']
  >();

  const on = <N extends keyof DirectoryEntryEventMap>(
    name: N,
    listener: DirectoryEntryEventMap[N],
  ) => {
    switch (name) {
      case 'add':
        setForListenersOfAddingEntry.add(listener);
        break;
      case 'remove':
        setForListenersOfRemovingEntry.add(
          <DirectoryEntryEventMap['remove']>listener,
        );
        break;
      default:
        throw new Error('unknown event name');
    }
  };

  const off = <N extends keyof DirectoryEntryEventMap>(
    name: N,
    listener: DirectoryEntryEventMap[N],
  ) => {
    switch (name) {
      case 'add':
        setForListenersOfAddingEntry.delete(listener);
        break;
      case 'remove':
        setForListenersOfRemovingEntry.delete(
          <DirectoryEntryEventMap['remove']>listener,
        );
        break;
      default:
        throw new Error('unknown event name');
    }
  };

  const moveTo = async (
    dest: DirectoryFSEntry | DirectoryGDriveEntry,
  ): Promise<DirectoryFSEntry> => {
    if ('gDriveFileId' in dest) {
      await api.files.update(auth, currentGDriveFolderId, {
        addParents: [dest.gDriveFileId],
      });

      return currentDirectoryGDriveEntry;
    }

    return await moveDirectoryTo(dest, currentDirectoryGDriveEntry);
  };

  const copyTo = async (
    dest: DirectoryFSEntry | DirectoryGDriveEntry,
  ): Promise<DirectoryFSEntry> => {
    if ('gDriveFileId' in dest) {
      const {
        result: { id: fileId, name },
      } = await api.files.copy(auth, currentGDriveFolderId, {
        resource: {
          name: currentName,
          parents: [dest.gDriveFileId],
        },
      });

      return createDirectoryGDriveEntry(
        auth,
        dest.gDriveSpace,
        fileId,
        name,
        dest,
      );
    } else {
      return await copyDirectoryTo(dest, currentDirectoryGDriveEntry);
    }
  };

  const get = async (name: string) => {
    // TODO: оптимизировать получение одного элемента
    const [, entry] =
      (await find(entries(), {
        predicate: ([nameEntry]) => nameEntry === name,
      })) ?? [];

    return entry;
  };

  const currentDirectoryGDriveEntry: DirectoryGDriveEntry = {
    type: 'directory',
    ...currentEntry,
    get name() {
      return currentName;
    },
    get path() {
      return currentEntry.path;
    },
    entries,
    get,
    createDirectory,
    writeFile,
    removeByName,
    rename,
    off,
    on,
    copyTo,
    moveTo,
    gDriveFileId: currentGDriveFolderId,
    gDriveSpace: space,
  };

  cacheDirectories.set(stringPath, currentDirectoryGDriveEntry);

  return currentDirectoryGDriveEntry;
};
