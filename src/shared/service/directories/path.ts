import type { EntryPath, EntryPathString } from '@shared/lib/fileSystem';
import { isString } from 'es-toolkit';
import { isArray, toString } from 'es-toolkit/compat';

export const PATH_SEPARATOR = '/';

export const pathToString = (path: EntryPath) => path.join(PATH_SEPARATOR);

export const stringToPath = (path: EntryPathString) => path.split(PATH_SEPARATOR).map(toString);

export const entryPath = (rawPath: EntryPath | EntryPathString) =>
  isString(rawPath) ? stringToPath(rawPath) : rawPath;

export const stringPath = (rawPath: EntryPath | EntryPathString) =>
  isArray(rawPath) ? pathToString(rawPath) : rawPath;
