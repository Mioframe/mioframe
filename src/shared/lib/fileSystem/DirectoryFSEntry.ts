import { interface as zodInterface } from '@zod/mini';
import { is } from '../validateZodScheme';
import { isGeneralFSEntry, type GeneralFSEntry } from './GeneralFSEntry';
import type { FileFSEntry } from './FileFSEntry';
import { zodFunction } from '../zodFunction';

export type DirectoryEntryEventMap = {
  add: (key: string, entry: DirectoryFSEntry | FileFSEntry) => unknown;
  remove: (name: string) => unknown;
};

export interface DirectoryFSEntry extends GeneralFSEntry {
  /**
   * Gets all entries in this directory
   */
  entries(): AsyncIterableIterator<[string, DirectoryFSEntry | FileFSEntry]>;
  /**
   * Gets the entry by name
   */
  get: (name: string) => Promise<DirectoryFSEntry | FileFSEntry | undefined>;

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
  copyTo: (dest: DirectoryFSEntry) => Promise<DirectoryFSEntry>;
  /**
   * Moves this directory to the destination directory by means of copying and deleting this
   */
  moveTo: (dest: DirectoryFSEntry) => Promise<DirectoryFSEntry>;
  /**
   * Rename this directory by copying the contents to a new directory
   */
  rename: (newName: string) => Promise<DirectoryFSEntry>;

  on: <N extends keyof DirectoryEntryEventMap>(
    name: N,
    listener: DirectoryEntryEventMap[N],
  ) => void;
  off: <N extends keyof DirectoryEntryEventMap>(
    name: N,
    listener: DirectoryEntryEventMap[N],
  ) => void;
}

export const isDirectoryRef = (value: unknown): value is DirectoryFSEntry =>
  isGeneralFSEntry(value) &&
  is(
    value,
    zodInterface({
      entries: zodFunction(),
      createDirectory: zodFunction(),
      writeFile: zodFunction(),
      removeByName: zodFunction(),
      copyTo: zodFunction(),
      moveTo: zodFunction(),
      rename: zodFunction(),
      on: zodFunction(),
      off: zodFunction(),
    }),
  );
