import type { ReadonlyGeneralFSEntry } from './GeneralFSEntry';
import { type GeneralFSEntry } from './GeneralFSEntry';
import type { FileFSEntry } from './FileFSEntry';
import type { Promisable } from 'type-fest';

export type DirectoryEntryEventMap = {
  add: (key: string, entry: DirectoryFSEntry | FileFSEntry) => unknown;
  remove: (name: string) => unknown;
};

export interface StaticDirectoryFSEntry extends ReadonlyGeneralFSEntry {
  type: 'directory';
  /**
   * Gets all entries in this directory
   */
  entries():
    | AsyncIterableIterator<[string, DirectoryFSEntry | FileFSEntry]>
    | IterableIterator<[string, DirectoryFSEntry | FileFSEntry]>;
  /**
   * Gets the entry by name
   */
  get: (name: string) => Promisable<DirectoryFSEntry | FileFSEntry | undefined>;
}

export interface ReadonlyDirectoryFSEntry extends StaticDirectoryFSEntry {
  on: <N extends keyof DirectoryEntryEventMap>(
    name: N,
    listener: DirectoryEntryEventMap[N],
  ) => void;
  off: <N extends keyof DirectoryEntryEventMap>(
    name: N,
    listener: DirectoryEntryEventMap[N],
  ) => void;
}

export interface WritableDirectoryFSEntry
  extends ReadonlyDirectoryFSEntry, GeneralFSEntry {
  /**
   * Creates a subdirectory
   */
  createDirectory: (name: string) => Promise<DirectoryFSEntry>;
  /**
   * Writes a file to this directory
   */
  writeFile: (
    name: string,
    file?: FileSystemWriteChunkType,
  ) => Promise<FileFSEntry>;
  /**
   * Removes Entry from this directory
   */
  removeByName: (name: string) => Promise<void>;
  /**
   * Copies this directory to the destination directory
   */
  copyTo: (dest: WritableDirectoryFSEntry) => Promise<DirectoryFSEntry>;
  /**
   * Moves this directory to the destination directory by means of copying and deleting this
   */
  moveTo: (dest: WritableDirectoryFSEntry) => Promise<DirectoryFSEntry>;
  /**
   * Rename this directory by copying the contents to a new directory
   */
  rename: (newName: string) => Promise<DirectoryFSEntry>;
}

export type DirectoryFSEntry =
  | ReadonlyDirectoryFSEntry
  | StaticDirectoryFSEntry
  | WritableDirectoryFSEntry;
