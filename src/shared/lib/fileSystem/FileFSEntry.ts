import { object } from 'zod/v4-mini';
import { is } from '../validateZodScheme';
import { isGeneralFSEntry, type GeneralFSEntry } from './GeneralFSEntry';
import type { DirectoryFSEntry } from './DirectoryFSEntry';
import { zodFunction } from '../zodFunction';

export interface FileFSEntry extends GeneralFSEntry {
  /**
   * Reads this file
   */
  read: () => Promise<File>;
  /**
   * Renames this file by copying and creating with the same contents
   */
  rename: (newName: string) => Promise<FileFSEntry>;
  /**
   * Copies the file to the destination directory
   */
  copyTo: (dest: DirectoryFSEntry) => Promise<FileFSEntry>;
  /**
   * Moves this file to the destination directory by copying and deleting this file
   */
  moveTo: (dest: DirectoryFSEntry) => Promise<FileFSEntry>;
}

export const isFileFSEntry = (value: unknown): value is FileFSEntry =>
  isGeneralFSEntry(value) &&
  is(
    value,
    object({
      read: zodFunction(),
      rename: zodFunction(),
      copyTo: zodFunction(),
      moveTo: zodFunction(),
    }),
  );
