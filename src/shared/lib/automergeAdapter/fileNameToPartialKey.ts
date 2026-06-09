import { zodIs } from '../validateZodScheme';
import {
  type PartialStorageKey,
  zodPartialAutomergeFileName,
  fileExtension,
  KEY_SEPARATE,
  zodPartialStorageKey,
} from './types';
import { decodeV2FileName } from './filenameCodecV2';

/**
 * Converts a physical Automerge storage filename to a logical partial storage key.
 * Recognises both the legacy `<docId>_<kind>_<hash>.automerge` format and the compact
 * v2 `<docId>~<kindCode>~<compactHash>.am` format so that directories containing a mix
 * of old and new files continue to work after the compact-filename migration.
 * @param fileName - Physical filename to parse.
 * @returns Logical partial storage key, or undefined when the filename is not a recognised format.
 */
export const fileNameToPartialKey = (fileName: unknown): PartialStorageKey | undefined => {
  if (typeof fileName !== 'string') {
    return undefined;
  }

  // Try v2 format first: <docId>~<s|i>~<compactHash>.am
  const v2Parts = decodeV2FileName(fileName);

  if (v2Parts) {
    const [documentId, kind, hexHash] = v2Parts;
    const key = [documentId, kind, hexHash];

    return zodIs(key, zodPartialStorageKey) ? key : undefined;
  }

  // Fall back to legacy format: <docId>_<kind>_<hash>.automerge (or shorter prefix variants)
  const partialAutomergeFileName = zodIs(fileName, zodPartialAutomergeFileName)
    ? fileName
    : undefined;

  const maybePartialStorageKey = partialAutomergeFileName
    ?.replace(`.${fileExtension}`, '')
    .split(KEY_SEPARATE);

  return zodIs(maybePartialStorageKey, zodPartialStorageKey) ? maybePartialStorageKey : undefined;
};

/**
 * Returns true when the given filename is a recognised Automerge storage file:
 * either legacy `.automerge` or compact v2 `.am` format.
 * Returns false for user `.am` files that do not match the exact v2 Automerge storage format.
 * @param name - Filename to classify.
 * @returns True when the file should be treated as an Automerge sidecar file.
 */
export const isAutomergeStorageFileName = (name: string): boolean =>
  fileNameToPartialKey(name) !== undefined;
