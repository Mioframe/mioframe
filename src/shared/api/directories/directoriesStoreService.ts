import { computed, reactive, watchEffect } from 'vue';
import {
  directoryFSEntryRef,
  type WritableDirectoryFSEntryRef,
  type EntryPathString,
  type FileFSEntry,
} from '@shared/lib/fileSystem';
import type { EntryPath, DirectoryFSEntry } from '@shared/lib/fileSystem';
import { createLocalDirectory } from '@shared/lib/localFileSystem';
import { defineSubscribeService } from '@shared/lib/subscriptions';
import {
  strictRecordGet,
  strictRecordIterableEntries,
  strictRecordIterableKeys,
  strictRecordRemove,
  strictRecordSet,
  type StrictRecord,
} from '@shared/lib/strictRecord';
import { createGlobalState, until } from '@vueuse/core';
import { isBoolean } from 'es-toolkit';
import { isArray } from 'es-toolkit/compat';
import type { DirectoryDescription, EntryDescription } from './types';
import { EntryNotDirectoryError, EntryNotFoundError } from './types';
import { defineSubscribeByQueryService } from '@shared/lib/subscriptions/subscribeService';
import { DomainError } from '@shared/lib/error';
import { zodCheck } from '@shared/lib/validateZodScheme';
import { zodAutomergeFileName } from '@shared/lib/fsStorageAdapter';
import { entryPath, PATH_SEPARATOR, pathToString, stringPath } from './path';
import { useLocalFileSystemDirectoryHandleStoreService } from './localFileSystemDirectoryHandleStoreService';
import { useGoogleService } from '../google/useGoogleService';
import { createRootGDriveEntry } from '@shared/lib/googleDrive/createDirectoryGDriveEntry';
import type {
  DirectoryFSEntryRef,
  ReadonlyDirectoryFSEntryRef,
} from '@shared/lib/fileSystem/directoryFSEntryRef';
import type { StaticDirectoryFSEntry } from '@shared/lib/fileSystem/DirectoryFSEntry';

export const useDirectoryStoreService = createGlobalState(() => {
  const stateEntries: StrictRecord<
    EntryPathString,
    DirectoryFSEntryRef | FileFSEntry | DomainError
  > = reactive({});

  const loadingStatus: Set<EntryPathString> = reactive(new Set());

  function addCacheEntry(
    entry: DirectoryFSEntry | FileFSEntry | DirectoryFSEntryRef,
  ): DirectoryFSEntryRef | FileFSEntry;
  function addCacheEntry(
    entry: EntryNotFoundError,
    rawNotFoundPath: EntryPath | EntryPathString,
  ): void;
  function addCacheEntry(
    entry:
      | DirectoryFSEntry
      | FileFSEntry
      | DirectoryFSEntryRef
      | EntryNotFoundError,
    rawNotFoundPath?: EntryPath | EntryPathString,
  ) {
    if (entry instanceof DomainError && rawNotFoundPath) {
      strictRecordSet(stateEntries, stringPath(rawNotFoundPath), entry);
    } else if (!(entry instanceof DomainError)) {
      const pathString = pathToString(entry.path);

      const entryRefOrFile:
        | WritableDirectoryFSEntryRef
        | ReadonlyDirectoryFSEntryRef
        | FileFSEntry =
        entry.type === 'file'
          ? entry
          : 'raw' in entry
            ? entry
            : directoryFSEntryRef(entry);

      strictRecordSet(stateEntries, pathString, entryRefOrFile);

      if ('on' in entry) {
        entry.on('remove', (name) => {
          strictRecordRemove(stateEntries, stringPath([...entry.path, name]));
        });
      }

      return entryRefOrFile;
    }
  }

  const getCachedEntry = (
    rawPath: EntryPathString | EntryPath,
  ):
    | WritableDirectoryFSEntryRef
    | ReadonlyDirectoryFSEntryRef
    | FileFSEntry
    | DomainError
    | undefined => {
    return strictRecordGet(stateEntries, stringPath(rawPath));
  };

  const rootDirectories = computed((): string[] =>
    Array.from(strictRecordIterableKeys(stateEntries)()).filter(
      (name) => !name.includes(PATH_SEPARATOR),
    ),
  );

  const subscribeRootList = defineSubscribeService(() => rootDirectories.value);

  const addWaitCacheEntry = (rawPath: EntryPath | EntryPathString): void => {
    const cached = getCachedEntry(rawPath);
    if (!cached) {
      const pathString = stringPath(rawPath);
      loadingStatus.add(pathString);
    }
  };

  const removeWaitCacheEntry = (rawPath: EntryPath | EntryPathString): void => {
    loadingStatus.delete(stringPath(rawPath));
  };

  async function getChildEntry(
    parent: DirectoryFSEntry | DirectoryFSEntryRef,
    name: string,
    options?: { createDirectory?: boolean },
  ): Promise<DirectoryFSEntryRef | FileFSEntry | DomainError> {
    const { createDirectory = false } = options ?? {};

    const fullPath = [...parent.path, name];

    const cached = getCachedEntry(fullPath);
    if (loadingStatus.has(stringPath(fullPath))) {
      return await waitCachedEntry(fullPath);
    }
    if (cached) {
      return cached;
    }
    try {
      addWaitCacheEntry(fullPath);
      const subEntry = await parent.get(name);
      if (!subEntry && createDirectory && 'createDirectory' in parent) {
        const newDirectory = await parent.createDirectory(name);
        return addCacheEntry(newDirectory);
      } else if (!subEntry && !createDirectory) {
        const entryNotFound = new EntryNotFoundError(fullPath);
        addCacheEntry(entryNotFound, fullPath);
        return entryNotFound;
      } else if (subEntry) {
        return addCacheEntry(subEntry);
      }
    } finally {
      removeWaitCacheEntry(fullPath);
    }

    return new EntryNotFoundError(fullPath);
  }

  const waitCachedEntry = async (
    rawPath: EntryPath | EntryPathString,
  ): Promise<
    | DomainError
    | WritableDirectoryFSEntryRef
    | ReadonlyDirectoryFSEntryRef
    | FileFSEntry
  > => {
    const pathString = stringPath(rawPath);

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new DomainError(`The entry ${stringPath(rawPath)} timeout expired`),
        );
      }, 30e3);

      void until(
        ():
          | WritableDirectoryFSEntryRef
          | ReadonlyDirectoryFSEntryRef
          | FileFSEntry
          | DomainError
          | boolean => {
          return (
            !loadingStatus.has(pathString) || (getCachedEntry(rawPath) ?? false)
          );
        },
      )
        .toMatch((v): v is Exclude<typeof v, boolean> => !isBoolean(v))
        .then(resolve)
        .catch(reject)
        .finally(() => {
          clearTimeout(timeoutId);
        });
    });
  };

  const locateEntry = async (
    parent: StaticDirectoryFSEntry | ReadonlyDirectoryFSEntryRef,
    subPath: EntryPath,
    options?: { createDirectory?: boolean },
  ): Promise<DirectoryFSEntryRef | FileFSEntry | DomainError> => {
    const fullPath = [...parent.path, ...subPath];

    const fullPathString = pathToString(fullPath);

    const storeEntry = getCachedEntry(fullPathString);

    if (loadingStatus.has(fullPathString)) {
      return await waitCachedEntry(fullPathString);
    }

    if (storeEntry) {
      return storeEntry;
    }

    const firstName = subPath.at(0);

    if (!firstName) {
      if ('raw' in parent) {
        return parent;
      } else {
        return directoryFSEntryRef(parent);
      }
    }

    const firstEntry = await getChildEntry(parent, firstName, options);

    if (subPath.length === 1 || firstEntry instanceof DomainError) {
      return firstEntry;
    }

    if (firstEntry.type !== 'directory') {
      return new EntryNotDirectoryError(firstEntry.path);
    }

    return await locateEntry(firstEntry, subPath.toSpliced(0, 1), options);
  };

  const locateEntryFromRoot = async (
    rawPath: EntryPathString | EntryPath,
    options?: { createDirectory?: boolean },
  ): Promise<DirectoryFSEntryRef | FileFSEntry | DomainError> => {
    const pathString = stringPath(rawPath);

    if (loadingStatus.has(pathString)) {
      return await waitCachedEntry(pathString);
    }

    const oldEntry = getCachedEntry(pathString);

    if (oldEntry && !loadingStatus.has(pathString)) {
      return oldEntry;
    }

    const path = entryPath(rawPath);

    const rootName = path.at(0);

    if (rootName) {
      const rootPathString = stringPath([rootName]);

      if (loadingStatus.has(rootPathString)) {
        await waitCachedEntry(pathString);
      }

      // сервисы монтируются в кэш автоматически
      const rootEntry = getCachedEntry(rootPathString);

      if (!rootEntry) {
        return new EntryNotFoundError(rootPathString);
      }

      if (rootEntry instanceof DomainError) {
        return rootEntry;
      }

      if (rootEntry.type !== 'directory') {
        return new EntryNotDirectoryError(rootEntry.path);
      }

      const entry = await locateEntry(
        rootEntry.raw,
        path.toSpliced(0, 1),
        options,
      );

      return entry;
    }

    return new EntryNotFoundError(rawPath);
  };

  const entryToDescription = (
    entry: DirectoryFSEntryRef | DirectoryFSEntry | FileFSEntry,
  ): EntryDescription => ({
    name: entry.name,
    type: entry.type,
    path: entry.path,
  });

  const directoryToDescription = (
    entry: DirectoryFSEntryRef,
    { showAutomergeFiles }: { showAutomergeFiles?: boolean } = {},
  ): DirectoryDescription => {
    return {
      name: entry.name,
      type: entry.type,
      path: entry.path,
      entries: Array.from(strictRecordIterableEntries(entry.entries)()).reduce(
        (acc: EntryDescription[], [, v]) => {
          const description = entryToDescription(v);

          if (
            !showAutomergeFiles &&
            zodCheck(zodAutomergeFileName, description.name)
          ) {
            return acc;
          }

          acc.push(description);

          return acc;
        },
        [],
      ),
    };
  };

  const getEntry = (
    path: EntryPathString | EntryPath,
  ): DirectoryFSEntryRef | FileFSEntry | DomainError | undefined => {
    const pathString = stringPath(path);

    const entry = strictRecordGet(stateEntries, pathString);

    if (!entry) {
      void locateEntryFromRoot(pathString);
    }

    return entry;
  };

  const subscribeEntry = defineSubscribeByQueryService(
    (
      path: EntryPath,
      { showAutomergeFiles }: { showAutomergeFiles?: boolean } = {},
    ): EntryDescription | DirectoryDescription | undefined | DomainError => {
      const entry = getEntry(path);

      if (entry instanceof DomainError) {
        return entry;
      }

      if (entry) {
        if (entry.type === 'file') {
          return entryToDescription(entry);
        }
        return directoryToDescription(entry, { showAutomergeFiles });
      }
      return undefined;
    },
  );

  const createDirectory = async (
    rawPath: EntryPathString | EntryPath,
  ): Promise<void> => {
    const pathString = isArray(rawPath)
      ? rawPath.join(PATH_SEPARATOR)
      : rawPath;

    await locateEntryFromRoot(pathString, { createDirectory: true });
  };

  const removeEntry = async (
    rawPath: EntryPathString | EntryPath,
  ): Promise<void> => {
    const pathString = stringPath(rawPath);

    const entry = await locateEntryFromRoot(pathString);

    if (entry instanceof Error) {
      throw entry;
    }

    if ('remove' in entry) {
      await entry.remove();
    } else {
      throw new DomainError(
        `"${pathToString(entry.path)}" don't have "remove" method`,
      );
    }

    strictRecordSet(stateEntries, pathString, new EntryNotFoundError(rawPath));
  };

  const renameEntry = async (
    rawPath: EntryPathString | EntryPath,
    newName: string,
  ): Promise<void> => {
    const pathString = stringPath(rawPath);

    const entry = await locateEntryFromRoot(pathString);

    if (entry instanceof Error) {
      throw entry;
    }

    if ('rename' in entry) {
      const { path } = await entry.rename(newName);
      strictRecordRemove(stateEntries, pathString);
      await locateEntryFromRoot(path);
    } else {
      throw new DomainError(
        `"${pathToString(entry.path)}" don't have "rename" method`,
      );
    }
  };

  const { store: localFileSystemDirectoryHandleStore } =
    useLocalFileSystemDirectoryHandleStoreService();

  const mountFileSystemDirectoryHandleStore = () => {
    for (const [name, handle] of strictRecordIterableEntries(
      localFileSystemDirectoryHandleStore.value,
    )()) {
      if (!rootDirectories.value.includes(name)) {
        const directoryFSEntry = createLocalDirectory(handle, undefined, name);
        addCacheEntry(directoryFSEntry);
      }
    }
  };

  watchEffect(mountFileSystemDirectoryHandleStore);

  const { token: googleToken } = useGoogleService();

  const mountGoogleDrive = () => {
    if (googleToken.value) {
      addCacheEntry(createRootGDriveEntry(googleToken.value, 'Google Drive'));
    }
  };

  watchEffect(mountGoogleDrive);

  return {
    createDirectory,
    removeEntry,
    renameEntry,

    subscribeRootList,
    subscribeEntry,

    getEntry,
  };
});
