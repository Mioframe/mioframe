import type { Promisable } from 'type-fest';
import { zodIs } from '../validateZodScheme';
import type { output } from 'zod/v4-mini';
import {
  array,
  number,
  object,
  pipe,
  string,
  transform,
  union,
} from 'zod/v4-mini';
import { zodFunction } from '../zodFunction';
import { toString } from 'es-toolkit/compat';

export const zodEntryPath = array(
  pipe(union([string(), number()]), transform(toString)),
);

export type EntryPath = output<typeof zodEntryPath>;

/**
 * @example "a/b/c"
 */
export type EntryPathString = string;

export interface GeneralFSEntry {
  name: string;
  path: EntryPath;
  /**
   * Removes this Entry
   */
  remove: () => Promisable<void>;
}

export const isEntryPath = (value: unknown): value is EntryPath =>
  zodIs(value, zodEntryPath);

export const isGeneralFSEntry = (value: unknown): value is GeneralFSEntry =>
  zodIs(
    value,
    object({
      name: string(),
      path: zodEntryPath,
      remove: zodFunction(),
    }),
  );
