import type {
  DirectoryEntryEventMap,
  DirectoryFSEntry,
} from '../fileSystem/DirectoryFSEntry';
import { copyDirectoryTo, moveDirectoryTo } from '../fileSystem/utils';
import type { AdvancedGDrive } from '../googleApi/types';
import { WeakValueMap } from '../WeakValueMap';
import { createFileGDriveEntry } from './createFileGDriveEntry';
import { createGDriveEntry } from './gDriveEntry';
import {
  GOOGLE_FOLDER_MIME_TYPE,
  type DirectoryGDriveEntry,
  type FileGDriveEntry,
} from './types';

export enum SPACE {
  // user drive
  MyDrive,
  // drive with shared data
  SharedWithMe,
}

const cacheDirectories = new WeakValueMap<string, DirectoryGDriveEntry>();

export const createDirectoryGDriveEntry = (
  gDrive: AdvancedGDrive,
  gDriveFolderId = 'root',
  name = 'root',
  parentEntry?: DirectoryGDriveEntry,
  space = SPACE.MyDrive,
): DirectoryGDriveEntry => {
  const currentGDriveFolderId = gDriveFolderId;
  const currentName = name;

  const currentEntry = createGDriveEntry(
    gDrive,
    name,
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

    for (const { name, id: fileId, mimeType } of files) {
      if (name && fileId && mimeType)
        if (mimeType === GOOGLE_FOLDER_MIME_TYPE) {
          yield [
            name,
            createDirectoryGDriveEntry(
              gDrive,
              fileId,
              name,
              currentDirectoryGDriveEntry,
              space,
            ),
          ];
        } else {
          yield [
            name,
            createFileGDriveEntry(
              gDrive,
              fileId,
              name,
              currentDirectoryGDriveEntry,
            ),
          ];
        }
    }
  }

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
      const directoryEntry = createDirectoryGDriveEntry(
        gDrive,
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

    const fileEntry: FileGDriveEntry = createFileGDriveEntry(
      gDrive,
      fileId,
      name,
      currentDirectoryGDriveEntry,
    );

    setForListenersOfAddingEntry.forEach((listener) =>
      listener(name, fileEntry),
    );

    return fileEntry;
  };

  const removeByName = async (name: string) => {
    for await (const [fileName, entry] of entries()) {
      if (fileName === name) {
        await entry.remove();
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
    if ('gDrive' in dest) {
      await dest.gDrive.files.update(
        {
          fileId: currentGDriveFolderId,
          addParents: dest.gDriveFolderId,
        },
        {},
      );

      return currentDirectoryGDriveEntry;
    }

    return await moveDirectoryTo(dest, currentDirectoryGDriveEntry);
  };

  const copyTo = async (
    dest: DirectoryFSEntry | DirectoryGDriveEntry,
  ): Promise<DirectoryFSEntry> => {
    if ('gDrive' in dest) {
      const {
        result: { id: fileId, name },
      } = await dest.gDrive.files.copy({
        fileId: currentGDriveFolderId,
        resource: {
          name: currentName,
          parents: [dest.gDriveFolderId],
        },
      });

      return createDirectoryGDriveEntry(
        gDrive,
        fileId,
        name,
        dest,
        dest.gDriveSpace,
      );
    } else {
      return await copyDirectoryTo(dest, currentDirectoryGDriveEntry);
    }
  };

  const currentDirectoryGDriveEntry: DirectoryGDriveEntry = {
    ...currentEntry,
    get name() {
      return currentName;
    },
    get path() {
      return currentEntry.path;
    },
    entries,
    createDirectory,
    writeFile,
    removeByName,
    rename,
    off,
    on,
    copyTo,
    moveTo,
    gDrive,
    gDriveFolderId,
    gDriveSpace: space,
  };

  cacheDirectories.set(stringPath, currentDirectoryGDriveEntry);

  return currentDirectoryGDriveEntry;
};
