import { find } from 'ix/Ix.asynciterable';
import type {
  DirectoryEntryEventMap,
  DirectoryFSEntry,
  WritableDirectoryFSEntry,
} from '../fileSystem/DirectoryFSEntry';
import { copyDirectoryTo, moveDirectoryTo } from '../fileSystem/utils';
import { WeakValueMap } from '../WeakValueMap';
import { createFileGDriveEntry } from './createFileGDriveEntry';
import { createGDriveEntry } from './gDriveEntry';
import type { RootGDriveEntry } from './types';
import {
  GOOGLE_DRIVE_SPACE,
  GOOGLE_FOLDER_MIME_TYPE,
  type DirectoryGDriveEntry,
  type FileGDriveEntry,
} from './types';
import { files as googleFiles, SPACE } from './api';
import { DomainError } from '../error';
import { pathToString } from '@shared/service/directories';

const cacheDirectories = new WeakValueMap<string, DirectoryGDriveEntry>();

export const createDirectoryGDriveEntry = (
  name: string,
  parentEntry: DirectoryGDriveEntry | RootGDriveEntry,
  {
    apiKey,
    folderId,
    space,
    token,
    onGetError,
  }: {
    apiKey?: string;
    token: string;
    space: GOOGLE_DRIVE_SPACE;
    folderId?: string;
    onGetError: (e: Error) => unknown;
  },
): DirectoryGDriveEntry => {
  const currentEntry = createGDriveEntry(
    { ACCESS_TOKEN: token, API_KEY: apiKey },
    name,
    folderId,
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
    let q = folderId ? `'${folderId}' in parents` : undefined;
    if (space === GOOGLE_DRIVE_SPACE.SharedWithMe) {
      q = 'sharedWithMe=true';
    }

    try {
      const {
        result: { files = [] },
      } = await googleFiles.list(
        {
          API_KEY: apiKey,
          ACCESS_TOKEN: token,
        },
        {
          q,
          spaces:
            space !== GOOGLE_DRIVE_SPACE.SharedWithMe
              ? [
                  space === GOOGLE_DRIVE_SPACE.MyDrive
                    ? SPACE.drive
                    : SPACE.appDataFolder,
                ]
              : undefined,
        },
      );

      for (const { name, id, mimeType } of files) {
        if (name && id && mimeType)
          if (mimeType === GOOGLE_FOLDER_MIME_TYPE) {
            yield [
              name,
              createDirectoryGDriveEntry(name, currentDirectoryGDriveEntry, {
                apiKey,
                folderId: id,
                space,
                token,
                onGetError,
              }),
            ];
          } else {
            yield [
              name,
              createFileGDriveEntry(
                { ACCESS_TOKEN: token, API_KEY: apiKey },
                id,
                name,
                currentDirectoryGDriveEntry,
                space,
              ),
            ];
          }
      }
    } catch (e: unknown) {
      console.debug('onGetError', e);
      // onGetError(e);
      throw e;
    }
  }

  const createDirectory = async (name: string) => {
    if (!folderId) {
      throw new DomainError(
        'You cannot create directories in a folder without an id.',
      );
    }

    const {
      result: { id },
    } = await googleFiles.create(
      { API_KEY: apiKey, ACCESS_TOKEN: token },
      {
        name,
        mimeType: GOOGLE_FOLDER_MIME_TYPE,
        parents: [folderId],
      },
    );

    if (id) {
      const directoryEntry = createDirectoryGDriveEntry(
        name,
        currentDirectoryGDriveEntry,
        { apiKey, token, space, folderId: id, onGetError },
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
    if (!folderId) {
      throw new DomainError('You cannot write file in a folder without an id.');
    }

    const {
      result: { id },
    } = await googleFiles.create(
      { API_KEY: apiKey, ACCESS_TOKEN: token },
      {
        name,
        parents: [folderId],
      },
    );
    if (!id) {
      throw new Error('failed to create file');
    }
    if (file) {
      await googleFiles.upload(
        { ACCESS_TOKEN: token, API_KEY: apiKey },
        id,
        file,
      );
    }

    const fileEntry: FileGDriveEntry = createFileGDriveEntry(
      { ACCESS_TOKEN: token, API_KEY: apiKey },
      id,
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
        if (!entry.gDriveId) {
          throw new DomainError(
            'You cannot delete an entry that does not have an id.',
          );
        }

        await googleFiles.delete(
          { ACCESS_TOKEN: token, API_KEY: apiKey },
          entry.gDriveId,
        );

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
    dest: WritableDirectoryFSEntry | DirectoryGDriveEntry,
  ): Promise<DirectoryFSEntry> => {
    if ('gDriveId' in dest) {
      try {
        if (!folderId) {
          throw new DomainError(
            'You cannot move directories that do not have an id.',
          );
        }

        if (!('gDriveId' in dest) || !dest.gDriveId) {
          throw new DomainError(
            'You cannot move files to a directory without an id.',
          );
        }

        await googleFiles.update(
          { ACCESS_TOKEN: token, API_KEY: apiKey },
          folderId,
          {
            addParents: [dest.gDriveId],
          },
        );

        return currentDirectoryGDriveEntry;
      } catch (cause) {
        throw new DomainError(
          `couldn't move "${pathToString(currentDirectoryGDriveEntry.path)}" to "${pathToString(dest.path)}"`,
          { cause },
        );
      }
    }

    return await moveDirectoryTo(dest, currentDirectoryGDriveEntry);
  };

  const copyTo = async (
    dest: WritableDirectoryFSEntry | DirectoryGDriveEntry,
  ): Promise<DirectoryFSEntry> => {
    if ('gDriveId' in dest) {
      if (!folderId) {
        throw new DomainError(
          'You cannot copy directories that do not have an id.',
        );
      }

      if (!dest.gDriveId) {
        throw new DomainError(
          'You cannot copy files to a directory without an id.',
        );
      }

      const {
        result: { id, name: newName },
      } = await googleFiles.copy(
        { ACCESS_TOKEN: token, API_KEY: apiKey },
        folderId,
        {
          resource: {
            name,
            parents: [dest.gDriveId],
          },
        },
      );

      return createDirectoryGDriveEntry(newName, dest, {
        apiKey,
        folderId: id,
        space,
        token,
        onGetError,
      });
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
      return name;
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
    gDriveId: folderId,
    gDriveSpace: space,
  };

  cacheDirectories.set(stringPath, currentDirectoryGDriveEntry);

  return currentDirectoryGDriveEntry;
};
