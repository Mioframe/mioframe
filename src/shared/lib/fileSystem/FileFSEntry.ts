import { literal, object } from 'zod/v4-mini';
import { zodIs } from '../validateZodScheme';
import { isGeneralFSEntry, type GeneralFSEntry } from './GeneralFSEntry';
import type { WritableDirectoryFSEntry } from './DirectoryFSEntry';
import { zodFunction } from '../zodFunction';

export interface FileFSEntry extends GeneralFSEntry {
  type: 'file';
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
  copyTo: (dest: WritableDirectoryFSEntry) => Promise<FileFSEntry>;
  /**
   * Moves this file to the destination directory by copying and deleting this file
   */
  moveTo: (dest: WritableDirectoryFSEntry) => Promise<FileFSEntry>;
}

export const isFileFSEntry = (value: unknown): value is FileFSEntry =>
  isGeneralFSEntry(value) &&
  zodIs(
    value,
    object({
      type: literal('file'),
      read: zodFunction(),
      rename: zodFunction(),
      copyTo: zodFunction(),
      moveTo: zodFunction(),
    }),
  );
