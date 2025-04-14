import { find, from, some } from 'ix/Ix.asynciterable';
import { createLocalEntry } from './entry';
import { createLocalFile } from './file';
import type { DirectoryLocalEntry, FileLocalEntry } from './types';
import { createLogger } from '../logger';
import { WeakValueMap } from '../WeakValueMap';
import type { DirectoryEntryEventMap } from '../fileSystem/DirectoryFSEntry';
import { copyDirectoryTo, moveDirectoryTo } from '../fileSystem/utils';

const { debug } = createLogger('directory');

const cacheDirectories = new WeakValueMap<string, DirectoryLocalEntry>();

export function createLocalDirectory(
  currentHandle: FileSystemDirectoryHandle,
  parentLocalDirectoryEntry: DirectoryLocalEntry,
): DirectoryLocalEntry;
export function createLocalDirectory(
  currentHandle: FileSystemDirectoryHandle,
  parentLocalDirectoryEntry: undefined,
  rootName: string,
): DirectoryLocalEntry;
export function createLocalDirectory(
  currentHandle: FileSystemDirectoryHandle,
  parentLocalDirectoryEntry?: DirectoryLocalEntry,
  rootName?: string,
): DirectoryLocalEntry {
  const currentEntry = createLocalEntry(
    currentHandle,
    parentLocalDirectoryEntry,
    rootName,
  );

  const stringPath = currentEntry.path.join('/');

  const cachedDirectoryEntry = cacheDirectories.get(stringPath);

  if (cachedDirectoryEntry) {
    return cachedDirectoryEntry;
  }

  async function* entries(): AsyncIterableIterator<
    [string, DirectoryLocalEntry | FileLocalEntry]
  > {
    for await (const [name, handle] of currentHandle.entries()) {
      debug('createContentIterable map', [name, handle]);
      switch (handle.kind) {
        case 'directory':
          yield [name, createLocalDirectory(handle, currentDirectoryEntry)];
          break;
        case 'file':
          yield [name, createLocalFile(handle, currentDirectoryEntry)];
          break;
      }
    }
  }

  const createDirectory = async (name: string) => {
    const directoryHandle = await currentHandle.getDirectoryHandle(name, {
      create: true,
    });

    const directoryEntry = createLocalDirectory(
      directoryHandle,
      currentDirectoryEntry,
    );

    setForListenersOfAddingEntry.forEach((listener) =>
      listener(name, directoryEntry),
    );

    return directoryEntry;
  };

  const writeFile = async (name: string, file?: FileSystemWriteChunkType) => {
    const newFileHandle = await currentHandle.getFileHandle(name, {
      create: true,
    });
    if (file) {
      const writable = await newFileHandle.createWritable();
      await writable.write(file);
      await writable.close();
    }

    const fileEntry = createLocalFile(newFileHandle, currentDirectoryEntry);

    setForListenersOfAddingEntry.forEach((listener) =>
      listener(name, fileEntry),
    );

    return fileEntry;
  };

  const removeByName = async (name: string) => {
    await currentHandle.removeEntry(name, { recursive: true });
    setForListenersOfRemovingEntry.forEach((listener) => listener(name));
  };

  const copyTo = async (dest: DirectoryLocalEntry) => {
    return await copyDirectoryTo(dest, currentDirectoryEntry);
  };

  const moveTo = async (dest: DirectoryLocalEntry) => {
    return await moveDirectoryTo(dest, currentDirectoryEntry);
  };

  const rename = async (newName: string) => {
    if (!parentLocalDirectoryEntry) {
      throw new Error('root Entry cannot be renamed');
    }

    const isAlreadyContains = await some(
      from(currentDirectoryEntry.entries()),
      {
        predicate: ([name]) => name === newName,
      },
    );

    if (isAlreadyContains) {
      throw new Error(
        `"${parentLocalDirectoryEntry.name}" already contains "${newName}"`,
      );
    }

    const newDirectoryEntry =
      await parentLocalDirectoryEntry.createDirectory(newName);

    await from(currentDirectoryEntry.entries()).forEach(async ([, entry]) => {
      await entry.moveTo(newDirectoryEntry);
    });

    await currentEntry.remove();

    return newDirectoryEntry;
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

  const get = async (name: string) => {
    const [, entry] =
      (await find(entries(), {
        predicate: ([nameEntry]) => nameEntry === name,
      })) ?? [];

    return entry;
  };

  const currentDirectoryEntry: DirectoryLocalEntry = {
    ...currentEntry,
    createDirectory,
    writeFile,
    removeByName,
    copyTo,
    moveTo,
    rename,
    entries,
    get,
    on,
    off,
  };

  cacheDirectories.set(stringPath, currentDirectoryEntry);

  return currentDirectoryEntry;
}
