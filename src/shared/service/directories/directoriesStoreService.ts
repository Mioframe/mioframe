import { computed, reactive } from 'vue';
import {
  type WritableDirectoryFSEntryState,
  type EntryPathString,
  type FileFSEntry,
  directoryFSEntryPool,
} from '@shared/lib/fileSystem';
import type { EntryPath, DirectoryFSEntry } from '@shared/lib/fileSystem';
import { defineSubscribeService } from '@shared/lib/subscriptions';
import {
  strictRecordGet,
  strictRecordIterableEntries,
  strictRecordIterableKeys,
  strictRecordRemove,
  strictRecordSet,
  type StrictRecord,
} from '@shared/lib/strictRecord';
import { createGlobalState, tryOnScopeDispose, until } from '@vueuse/core';
import { isBoolean } from 'es-toolkit';
import { isArray } from 'es-toolkit/compat';
import type { DirectoryDescription, EntryDescription } from './types';
import { EntryNotDirectoryError, EntryNotFoundError } from './types';
import { defineSubscribeByQueryService } from '@shared/lib/subscriptions/subscribeService';
import { DomainError } from '@shared/lib/error';
import { zodCheck } from '@shared/lib/validateZodScheme';
import {
  entryPath,
  PATH_SEPARATOR,
  pathToString,
  stringPath,
  stringToPath,
} from './path';
import type {
  DirectoryFSEntryState,
  ReadonlyDirectoryFSEntryState,
} from '@shared/lib/fileSystem/directoryFSEntryState';
import type { StaticDirectoryFSEntry } from '@shared/lib/fileSystem/DirectoryFSEntry';
import { zodAutomergeFileName } from '@shared/lib/automergeAdapter';

const setupDirectoryStoreService = () => {
  const stateEntries: StrictRecord<
    EntryPathString,
    DirectoryFSEntryState | FileFSEntry | DomainError
  > = reactive({});

  const loadingStatus: Set<EntryPathString> = reactive(new Set());

  function addCacheEntry(
    entry: DirectoryFSEntry | FileFSEntry | DirectoryFSEntryState,
  ): DirectoryFSEntryState | FileFSEntry;
  function addCacheEntry(
    entry: EntryNotFoundError,
    rawNotFoundPath: EntryPath | EntryPathString,
  ): void;
  function addCacheEntry(
    entry:
      | DirectoryFSEntry
      | FileFSEntry
      | DirectoryFSEntryState
      | EntryNotFoundError,
    rawNotFoundPath?: EntryPath | EntryPathString,
  ) {
    if (entry instanceof DomainError && rawNotFoundPath) {
      strictRecordSet(stateEntries, stringPath(rawNotFoundPath), entry);
    } else if (!(entry instanceof DomainError)) {
      const pathString = pathToString(entry.path);

      if ('on' in entry) {
        entry.on('remove', (name) => {
          removeCachedEntry([...entry.path, name]);
        });
      }

      if (entry.type === 'directory' && !('raw' in entry)) {
        const entryState = retainDirectoryFSEntryState(entry);

        destroyDirectoryFSEntryStateCollection.add(() => {
          releaseDirectoryFSEntryState(entry);
        });

        strictRecordSet(stateEntries, pathString, entryState);

        return entryState;
      } else {
        strictRecordSet(stateEntries, pathString, entry);
        return entry;
      }
    }

    return undefined;
  }

  const getCachedEntry = (
    rawPath: EntryPathString | EntryPath,
  ):
    | WritableDirectoryFSEntryState
    | ReadonlyDirectoryFSEntryState
    | FileFSEntry
    | DomainError
    | undefined => {
    return strictRecordGet(stateEntries, stringPath(rawPath));
  };

  const removeCachedEntry = (path: EntryPath | string) => {
    strictRecordRemove(stateEntries, stringPath(path));
  };

  const getRootDirectories = (): string[] =>
    Array.from(strictRecordIterableKeys(stateEntries)()).filter(
      (name) => !name.includes(PATH_SEPARATOR),
    );

  const rootDirectories = computed(getRootDirectories);

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
    parent: DirectoryFSEntry | DirectoryFSEntryState,
    name: string,
    options?: { createDirectory?: boolean },
  ): Promise<DirectoryFSEntryState | FileFSEntry | DomainError> {
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
    | WritableDirectoryFSEntryState
    | ReadonlyDirectoryFSEntryState
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
          | WritableDirectoryFSEntryState
          | ReadonlyDirectoryFSEntryState
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

  const {
    release: releaseDirectoryFSEntryState,
    retain: retainDirectoryFSEntryState,
  } = directoryFSEntryPool();

  const destroyDirectoryFSEntryStateCollection = new Set<() => void>();

  tryOnScopeDispose(() => {
    destroyDirectoryFSEntryStateCollection.forEach((release) => {
      release();
    });
    destroyDirectoryFSEntryStateCollection.clear();
  });

  const locateEntry = async (
    parent: StaticDirectoryFSEntry | ReadonlyDirectoryFSEntryState,
    subPath: EntryPath,
    options?: { createDirectory?: boolean },
  ): Promise<DirectoryFSEntryState | FileFSEntry | DomainError> => {
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
        destroyDirectoryFSEntryStateCollection.add(() => {
          releaseDirectoryFSEntryState(parent);
        });

        return retainDirectoryFSEntryState(parent);
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
  ): Promise<DirectoryFSEntryState | FileFSEntry | DomainError> => {
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
    entry: DirectoryFSEntryState | DirectoryFSEntry | FileFSEntry,
  ): EntryDescription => ({
    name: entry.name,
    type: entry.type,
    path: entry.path,
  });

  const directoryToDescription = (
    entry: DirectoryFSEntryState,
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
  ): DirectoryFSEntryState | FileFSEntry | DomainError | undefined => {
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
      removeCachedEntry(pathString);
      await locateEntryFromRoot(path);
    } else {
      throw new DomainError(
        `"${pathToString(entry.path)}" don't have "rename" method`,
      );
    }
  };

  const unmount = (name: string) => {
    if (stringToPath(name).length > 1) {
      throw new DomainError('Only the root directory can be unmounted');
    }

    for (const key in stateEntries) {
      if (stringToPath(key).at(0) === name) {
        removeCachedEntry(key);
      }
    }
  };

  const mount = (directoryEntry: DirectoryFSEntryState | DirectoryFSEntry) => {
    if (directoryEntry.path.length !== 1) {
      throw new DomainError('Mounting of root directories only is possible');
    }

    const name = directoryEntry.path.at(0);

    if (!name) {
      throw new DomainError('Directory must have a root path');
    }

    addCacheEntry(directoryEntry);

    return () => {
      unmount(name);
    };
  };

  return {
    createDirectory,
    removeEntry,
    renameEntry,

    mount,
    unmount,

    subscribeRootList,
    subscribeEntry,

    getEntry,
    getRootDirectories,
  };
};

export const useDirectoryStoreService = createGlobalState(
  setupDirectoryStoreService,
);

// FIXME: нужен более эффективный и простой способ кешировать и получать информацию об FS
