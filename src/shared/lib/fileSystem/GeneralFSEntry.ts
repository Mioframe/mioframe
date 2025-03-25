import type { Promisable } from 'type-fest';
import { is } from '../validateZodScheme';
import { array, object, string, function as zodFunction } from 'zod';

export type EntryPath = string[];

export interface GeneralFSEntry {
  name: string;
  path: EntryPath;
  /**
   * Removes this Entry
   */
  remove: () => Promisable<void>;
}

export const isEntryPath = (value: unknown): value is EntryPath =>
  is(value, array(string()));

export const isGeneralFSEntry = (value: unknown): value is GeneralFSEntry =>
  is(
    value,
    object({
      name: string(),
      path: array(string()),
      remove: zodFunction(),
    }),
  );
