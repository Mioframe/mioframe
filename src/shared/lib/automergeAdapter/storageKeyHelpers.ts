import { zodIs } from '../validateZodScheme';
import { fileNameToPartialKey } from './fileNameToPartialKey';
import { encodePreferredV3FileName } from './filenameCodecV3';
import { partialKeyToFileName } from './partialKeyToFileName';
import { encodeStorageKeyToV2FileName, isV2FileName } from './filenameCodecV2';
import type { ChunkStorageKey, PartialStorageKey, StorageKey } from './types';
import { zodStorageKey } from './types';

/**
 * Returns a stable string id for a partial storage key suitable for Map keys and deduplication.
 * Uses NUL-separated elements so keys with different element counts never collide.
 * @param key - Partial storage key to identify.
 * @returns Canonical string id.
 */
export const storageKeyToId = (key: readonly string[]): string => key.join('\x00');

/**
 * Returns true when `key` begins with all elements of `prefix`.
 * @param key - Key to test.
 * @param prefix - Required prefix.
 * @returns True when key starts with all prefix elements.
 */
export const storageKeyHasPrefix = (key: readonly string[], prefix: readonly string[]): boolean => {
  if (key.length < prefix.length) return false;

  for (let i = 0; i < prefix.length; i++) {
    if (key[i] !== prefix[i]) return false;
  }

  return true;
};

/**
 * Returns whether a partial storage key is a full chunk key suitable for v3 `.mf` storage.
 * @param key - Storage key to inspect.
 * @returns True when the key is a full `[documentId, kind, hash]` chunk key.
 */
export const isChunkStorageKey = (key: PartialStorageKey): key is ChunkStorageKey =>
  zodIs(key, zodStorageKey) && key.length === 3;

/**
 * Returns the preferred physical filename for a storage key.
 * Full chunk keys `[docId, kind, hash]` prefer the short v3 `.mf` filename, which stores the full
 * logical key inside the wrapper. Adapters may still resolve a different writable v3 candidate
 * later when the preferred short name is already occupied.
 * Non-chunk keys (e.g. `['storage-adapter-id']`) keep using the legacy format.
 * Read paths remain backward-compatible with v2 and legacy chunk filenames.
 * @param key - Storage key to encode.
 * @returns Physical filename, or undefined when the key cannot be encoded.
 */
export const toWritableStorageFileName = (key: StorageKey): string | undefined => {
  if (isChunkStorageKey(key)) {
    const [part0, part1, part2] = key;
    const v3 = encodePreferredV3FileName(key);

    if (v3) {
      return v3;
    }

    const v2 = encodeStorageKeyToV2FileName(part0, part1, part2);

    if (v2) {
      return v2;
    }
  }

  return partialKeyToFileName(key);
};

/**
 * Parses physical filenames into logical storage entries without deduplication.
 *
 * Unlike `selectReadableStorageEntries`, this returns ALL recognized entries so that
 * delete paths can remove every matching physical file, including mixed legacy/v2 duplicates.
 * @param names - Iterable of physical filenames.
 * @returns Array of `{ name, key }` for every recognized filename, in iteration order.
 */
export const listStorageFileEntries = (
  names: Iterable<string>,
): { name: string; key: PartialStorageKey }[] => {
  const result: { name: string; key: PartialStorageKey }[] = [];

  for (const name of names) {
    const key = fileNameToPartialKey(name);

    if (key) {
      result.push({ name, key });
    }
  }

  return result;
};

/**
 * Deduplicates storage filename entries by logical key, preferring v2 over legacy.
 *
 * When both a legacy and a v2 file exist for the same logical key, the v2 entry
 * replaces the legacy one. Otherwise the first-seen entry wins.
 * @param names - Iterable of physical filenames in the storage directory.
 * @returns Map from canonical key id to `{ name, key, isV2 }`.
 */
export const selectReadableStorageEntries = (
  names: Iterable<string>,
): Map<string, { name: string; key: PartialStorageKey; isV2: boolean }> => {
  const seen = new Map<string, { name: string; key: PartialStorageKey; isV2: boolean }>();

  for (const name of names) {
    const key = fileNameToPartialKey(name);

    if (!key) continue;

    const keyId = storageKeyToId(key);
    const isV2 = isV2FileName(name);
    const existing = seen.get(keyId);

    if (!existing || (!existing.isV2 && isV2)) {
      seen.set(keyId, { name, key, isV2 });
    }
  }

  return seen;
};
