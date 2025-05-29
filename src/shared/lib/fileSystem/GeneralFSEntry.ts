import type { Promisable } from 'type-fest';
import { zodIs } from '../validateZodScheme';
import { array, object, string } from 'zod/v4-mini';
import { zodFunction } from '../zodFunction';

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
  zodIs(value, array(string()));

export const isGeneralFSEntry = (value: unknown): value is GeneralFSEntry =>
  zodIs(
    value,
    object({
      name: string(),
      path: array(string()),
      remove: zodFunction(),
    }),
  );
