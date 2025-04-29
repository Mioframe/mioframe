import type { Promisable } from 'type-fest';
import { is } from '../validateZodScheme';
import { array, interface as zodInterface, string } from '@zod/mini';
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
  is(value, array(string()));

export const isGeneralFSEntry = (value: unknown): value is GeneralFSEntry =>
  is(
    value,
    zodInterface({
      name: string(),
      path: array(string()),
      remove: zodFunction(),
    }),
  );
