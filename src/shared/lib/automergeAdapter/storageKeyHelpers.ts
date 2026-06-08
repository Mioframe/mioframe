import { fileNameToPartialKey } from './fileNameToPartialKey';
import { partialKeyToFileName } from './partialKeyToFileName';
import { encodeStorageKeyToV2FileName, isV2FileName } from './filenameCodecV2';
import type { PartialStorageKey, StorageKey } from './types';

/**
 * Returns true when two partial storage keys have the same elements in the same order.
 * @param a - First key.
 * @param b - Second key.
 * @returns True when all elements match.
 */
export const storageKeyEquals = (a: PartialStorageKey, b: PartialStorageKey): boolean => {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
};

/**
 * Returns true when `key` begins with all elements of `prefix`.
 * @param key - Key to test.
 * @param prefix - Required prefix.
 * @returns True when key starts with all prefix elements.
 */
export const storageKeyStartsWith = (
  key: PartialStorageKey,
  prefix: PartialStorageKey,
): boolean => {
  if (key.length < prefix.length) return false;

  for (let i = 0; i < prefix.length; i++) {
    if (key[i] !== prefix[i]) return false;
  }

  return true;
};

/**
 * Returns the physical filename to use when writing a storage key.
 * Full chunk keys `[docId, kind, hash]` use the v2 compact format.
 * Non-chunk keys (e.g. `['storage-adapter-id']`) fall back to the legacy format.
 * @param key - Storage key to encode.
 * @returns Physical filename, or undefined when the key cannot be encoded.
 */
export const toWritableStorageFileName = (key: StorageKey): string | undefined => {
  const [part0, part1, part2] = key;

  if (part1 && part2) {
    const v2 = encodeStorageKeyToV2FileName(part0, part1, part2);

    if (v2) {
      return v2;
    }
  }

  return partialKeyToFileName(key);
};

/**
 * Deduplicates storage filename entries by logical key, preferring v2 over legacy.
 *
 * When both a legacy and a v2 file exist for the same logical key, the v2 entry
 * replaces the legacy one. Otherwise the first-seen entry wins.
 * @param names - Iterable of physical filenames in the storage directory.
 * @returns Map from `key.join('\x00')` to `{ name, key, isV2 }`.
 */
export const selectReadableStorageEntries = (
  names: Iterable<string>,
): Map<string, { name: string; key: PartialStorageKey; isV2: boolean }> => {
  const seen = new Map<string, { name: string; key: PartialStorageKey; isV2: boolean }>();

  for (const name of names) {
    const key = fileNameToPartialKey(name);

    if (!key) continue;

    const keyStr = key.join('\x00');
    const isV2 = isV2FileName(name);
    const existing = seen.get(keyStr);

    if (!existing || (!existing.isV2 && isV2)) {
      seen.set(keyStr, { name, key, isV2 });
    }
  }

  return seen;
};
