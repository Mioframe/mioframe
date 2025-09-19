import {
  directoryFSEntryRef,
  type DirectoryFSEntryRef,
  type EntryPathString,
  type FileFSEntry,
} from '@shared/lib/fileSystem';
import type { DirectoryFSEntry, EntryPath } from '@shared/lib/fileSystem';
import { createLocalDirectory } from '@shared/lib/localFileSystem';
import {
  defineSubscribe,
  defineSubscribeGetterValue,
} from '@shared/lib/remoteStore';
import {
  strictRecordGet,
  strictRecordIterableEntries,
  strictRecordIterableKeys,
  strictRecordRemove,
  strictRecordSet,
  type StrictRecord,
} from '@shared/lib/strictRecord';
import { createGlobalState, until } from '@vueuse/core';
import { isBoolean, isString } from 'es-toolkit';
import { isArray, toString } from 'es-toolkit/compat';
import { computed, reactive } from 'vue';
import { ENTRY_NOT_FOUND } from './types';

export const PATH_SEPARATOR = '/';

export const pathToString = (path: EntryPath) => path.join(PATH_SEPARATOR);
export const stringToPath = (path: EntryPathString) =>
  path.split(PATH_SEPARATOR).map(toString);
export const entryPath = (rawPath: EntryPath | EntryPathString) =>
  isString(rawPath) ? stringToPath(rawPath) : rawPath;
export const stringPath = (rawPath: EntryPath | EntryPathString) =>
  isArray(rawPath) ? pathToString(rawPath) : rawPath;

export type EntryDescription = {
  name: string;
  type: 'file' | 'directory';
  path: EntryPath;
};

export interface DirectoryDescription extends EntryDescription {
  type: 'directory';
  entries: EntryDescription[];
}

export const useDirectoryStoreService = createGlobalState(() => {
  const cacheEntries: StrictRecord<
    EntryPathString,
    DirectoryFSEntryRef | FileFSEntry | ENTRY_NOT_FOUND
  > = reactive({});

  const loadingStatus: Set<EntryPathString> = reactive(new Set());

  function addCacheEntry(
    entry: DirectoryFSEntry | FileFSEntry | DirectoryFSEntryRef,
  ): DirectoryFSEntryRef | FileFSEntry;
  function addCacheEntry(
    entry: typeof ENTRY_NOT_FOUND,
    rawNotFoundPath: EntryPath | EntryPathString,
  ): void;
  function addCacheEntry(
    entry:
      | DirectoryFSEntry
      | FileFSEntry
      | DirectoryFSEntryRef
      | typeof ENTRY_NOT_FOUND,
    rawNotFoundPath?: EntryPath | EntryPathString,
  ) {
    if (entry === ENTRY_NOT_FOUND && rawNotFoundPath) {
      strictRecordSet(cacheEntries, stringPath(rawNotFoundPath), entry);
    } else if (entry !== ENTRY_NOT_FOUND) {
      console.debug('addCacheEntry', entry.path);
      const pathString = pathToString(entry.path);

      const entryRefOrFile: DirectoryFSEntryRef | FileFSEntry =
        entry.type === 'file'
          ? entry
          : 'raw' in entry
            ? entry
            : directoryFSEntryRef(entry);

      strictRecordSet(cacheEntries, pathString, entryRefOrFile);

      if ('on' in entry) {
        console.debug('add on', entry.path);
        entry.on('remove', (name) => {
          console.debug('on remove', entry.path, name);
          strictRecordRemove(cacheEntries, stringPath([...entry.path, name]));
        });
      }

      return entryRefOrFile;
    }
  }

  const getCachedEntry = (rawPath: EntryPathString | EntryPath) => {
    return strictRecordGet(cacheEntries, stringPath(rawPath));
  };

  const rootDirectories = computed(() =>
    Array.from(strictRecordIterableKeys(cacheEntries)()).filter(
      (name) => !name.includes(PATH_SEPARATOR),
    ),
  );

  const subscribeRootList = defineSubscribe(rootDirectories);

  const addRootFileSystemDirectoryHandle = (
    handle: FileSystemDirectoryHandle,
    name: string,
  ) => {
    const directoryFSEntry = createLocalDirectory(handle, undefined, name);
    addCacheEntry(directoryFSEntry);
  };

  const addWaitCacheEntry = (rawPath: EntryPath | EntryPathString) => {
    const cached = getCachedEntry(rawPath);
    if (!cached) {
      const pathString = stringPath(rawPath);
      loadingStatus.add(pathString);
    }
  };
  const removeWaitCacheEntry = (rawPath: EntryPath | EntryPathString) => {
    loadingStatus.delete(stringPath(rawPath));
  };

  const getSubEntry = async (
    parent: DirectoryFSEntry | DirectoryFSEntryRef,
    name: string,
    options?: { createDirectory?: boolean },
  ): Promise<DirectoryFSEntryRef | FileFSEntry | typeof ENTRY_NOT_FOUND> => {
    const { createDirectory = false } = options ?? {};

    console.debug('getSubEntry', parent.path, name);

    const path = [...parent.path, name];

    const cached = getCachedEntry(path);
    if (loadingStatus.has(stringPath(path))) {
      return await waitCachedEntry(path);
    }
    if (cached) {
      return cached;
    }
    try {
      addWaitCacheEntry(path);
      const subEntry = await parent.get(name);
      if (!subEntry && createDirectory) {
        const newDirectory = await parent.createDirectory(name);
        return addCacheEntry(newDirectory);
      } else if (!subEntry && !createDirectory) {
        addCacheEntry(ENTRY_NOT_FOUND, path);
        return ENTRY_NOT_FOUND;
      } else if (subEntry) {
        return addCacheEntry(subEntry);
      }
    } finally {
      removeWaitCacheEntry(path);
    }

    return ENTRY_NOT_FOUND;
  };

  const waitCachedEntry = async (
    rawPath: EntryPath | EntryPathString,
  ): Promise<typeof ENTRY_NOT_FOUND | DirectoryFSEntryRef | FileFSEntry> => {
    const pathString = stringPath(rawPath);
    return await until(
      ():
        | DirectoryFSEntryRef
        | FileFSEntry
        | typeof ENTRY_NOT_FOUND
        | boolean => {
        return (
          !loadingStatus.has(pathString) || (getCachedEntry(rawPath) ?? false)
        );
      },
    ).toMatch((v): v is Exclude<typeof v, boolean> => !isBoolean(v));
  };

  const locateEntry = async (
    parent: DirectoryFSEntry | DirectoryFSEntryRef,
    subPath: EntryPath,
    options?: { createDirectory?: boolean },
  ): Promise<DirectoryFSEntryRef | FileFSEntry | typeof ENTRY_NOT_FOUND> => {
    const fullPathString = pathToString([...parent.path, ...subPath]);
    console.debug('fullPathString', fullPathString);

    const storeEntry = getCachedEntry(fullPathString);

    if (loadingStatus.has(fullPathString)) {
      console.debug('WAIT', fullPathString);
      return await waitCachedEntry(fullPathString);
    }

    if (storeEntry) {
      return storeEntry;
    }

    const firstName = subPath.at(0);

    if (firstName) {
      const firstEntry = await getSubEntry(parent, firstName, options);

      if (
        subPath.length > 1 &&
        firstEntry !== ENTRY_NOT_FOUND &&
        firstEntry.type === 'directory'
      ) {
        return await locateEntry(firstEntry, subPath.toSpliced(0, 1), options);
      }

      return firstEntry;
    }

    return ENTRY_NOT_FOUND;
  };

  const locateEntryFromRoot = async (
    rawPath: EntryPathString | EntryPath,
    options?: { createDirectory?: boolean },
  ): Promise<DirectoryFSEntryRef | FileFSEntry | typeof ENTRY_NOT_FOUND> => {
    console.debug('locateEntryFromRoot', rawPath);

    const pathString = stringPath(rawPath);

    const oldEntry = getCachedEntry(pathString);

    if (oldEntry && !loadingStatus.has(pathString)) {
      return oldEntry;
    }

    const path = entryPath(rawPath);

    const rootName = path.at(0);

    if (rootName) {
      const pathString = stringPath([rootName]);

      const rootEntry = getCachedEntry(pathString);

      if (!loadingStatus.has(pathString)) {
        if (rootEntry !== ENTRY_NOT_FOUND && rootEntry?.type === 'directory') {
          const entry = await locateEntry(
            rootEntry.raw,
            path.toSpliced(0, 1),
            options,
          );

          return entry;
        }
      }
    }

    return ENTRY_NOT_FOUND;
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
  ): DirectoryDescription => {
    return {
      name: entry.name,
      type: entry.type,
      path: entry.path,
      entries: Array.from(strictRecordIterableEntries(entry.entries)()).map(
        ([, v]) => entryToDescription(v),
      ),
    };
  };

  const subscribeEntry = defineSubscribeGetterValue(
    cacheEntries,
    (
      path,
      entry,
    ):
      | EntryDescription
      | DirectoryDescription
      | undefined
      | ENTRY_NOT_FOUND => {
      if (!entry) {
        void locateEntryFromRoot(path);
      }

      if (entry === ENTRY_NOT_FOUND) {
        return ENTRY_NOT_FOUND;
      }

      if (entry) {
        if (entry.type === 'file') {
          return entryToDescription(entry);
        }
        return directoryToDescription(entry);
      }
      return undefined;
    },
  );

  const createDirectory = async (rawPath: EntryPathString | EntryPath) => {
    const pathString = isArray(rawPath)
      ? rawPath.join(PATH_SEPARATOR)
      : rawPath;

    await locateEntryFromRoot(pathString, { createDirectory: true });
  };

  const removeEntry = async (rawPath: EntryPathString | EntryPath) => {
    const pathString = stringPath(rawPath);

    const entry = await locateEntryFromRoot(pathString);

    if (entry !== ENTRY_NOT_FOUND) {
      await entry.remove();
      strictRecordSet(cacheEntries, pathString, ENTRY_NOT_FOUND);
    }
  };

  const renameEntry = async (
    rawPath: EntryPathString | EntryPath,
    newName: string,
  ) => {
    const pathString = stringPath(rawPath);

    const entry = await locateEntryFromRoot(pathString);
    if (entry !== ENTRY_NOT_FOUND) {
      const { path } = await entry.rename(newName);
      strictRecordRemove(cacheEntries, pathString);
      await locateEntryFromRoot(path);
    }
  };

  return {
    addRootFileSystemDirectoryHandle,
    createDirectory,
    removeEntry,
    renameEntry,

    subscribeRootList,
    subscribeEntry,
  };
});
