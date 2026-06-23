import type { AMChunk } from '@shared/lib/automerge';
import { decodeAnyV3CandidateFileName, encodePrimaryV3FileName } from './filenameCodecV3';
import type { ChunkStorageKey, StorageKeyPrefix } from './types';
import { decodeV3StorageWrapper } from './wrapperCodecV3';

/**
 * Decodes a v3 wrapper and verifies that it contains a non-empty chunk.
 * @param data - Raw stored bytes.
 * @param expectedKey - Optional full logical key that must match the wrapper.
 * @returns Raw Automerge chunk and full logical key, or undefined when invalid.
 */
export const decodeValidV3Chunk = (
  data: Uint8Array,
  expectedKey?: ChunkStorageKey,
): AMChunk | undefined => {
  const decoded = decodeV3StorageWrapper(data);

  if (!decoded || decoded.data.length === 0) {
    return undefined;
  }

  if (
    expectedKey &&
    (decoded.key[0] !== expectedKey[0] ||
      decoded.key[1] !== expectedKey[1] ||
      decoded.key[2] !== expectedKey[2])
  ) {
    return undefined;
  }

  return decoded;
};

/**
 * Returns whether a physical filename is the primary deterministic v3 candidate for a key.
 * @param name - Physical filename to inspect.
 * @param key - Full logical chunk key being resolved.
 * @returns True when the filename is the exact primary generated filename for that key.
 */
export const isPrimaryV3CandidateForKey = (name: string, key: ChunkStorageKey): boolean =>
  encodePrimaryV3FileName(key) === name;

/**
 * Returns whether a physical filename is a plausible strict v3 candidate for an exact full chunk
 * key remove route. The filename route participates in the v3 contract, so only the strict
 * primary deterministic filename for that key may be wrapper-confirmed for exact-key cleanup.
 * @param name - Physical filename to inspect.
 * @param key - Full logical chunk key being removed.
 * @returns True when the filename is in-route for this exact key.
 */
export const isPlausibleV3CandidateForChunkKey = (name: string, key: ChunkStorageKey): boolean =>
  isPrimaryV3CandidateForKey(name, key);

/**
 * Returns whether a physical filename is a plausible strict primary v3 candidate for a partial
 * key prefix. An empty prefix (`[]`) matches every plausible v3 candidate, because an
 * empty range prefix semantically selects all storage entries for `loadRange`/`removeRange` scans.
 * @param name - Physical filename to inspect.
 * @param keyPrefix - Partial logical key used to prefilter directory scans. May be empty.
 * @returns True when the filename should be wrapper-decoded for this prefix.
 */
export const isPlausibleV3CandidateForPrefix = (
  name: string,
  keyPrefix: StorageKeyPrefix,
): boolean => {
  const parsed = decodeAnyV3CandidateFileName(name);

  if (!parsed) {
    return false;
  }

  const [documentIdPrefix, kind] = keyPrefix;

  if (documentIdPrefix === undefined) {
    return true;
  }

  if (documentIdPrefix === 'storage-adapter-id' || !documentIdPrefix.startsWith(parsed.docPrefix)) {
    return false;
  }

  if (kind !== undefined && kind !== parsed.kind) {
    return false;
  }

  return true;
};

/**
 * Discriminated outcome of inspecting one physical v3 candidate's bytes against an expected full
 * logical chunk key. Distinguishes "no usable data" from "valid wrapper for a different key" so
 * callers never collapse the two into the same removal/overwrite decision.
 */
export type V3ChunkCandidateClassification =
  | { kind: 'missing' }
  | { kind: 'invalid' }
  | { kind: 'validSameKey'; chunk: AMChunk }
  | { kind: 'validDifferentKey'; chunk: AMChunk };

/**
 * Classifies already-read candidate bytes against an expected full logical chunk key.
 * Performs no IO; callers supply the bytes from a single `readBytes()` call. A zero-byte file is
 * classified as `missing` (a recoverable write artifact), distinct from a non-empty file that
 * fails to decode (`invalid`).
 * @param data - Raw bytes read from the candidate file, or undefined when absent.
 * @param expectedKey - Full logical chunk key the caller is resolving for.
 * @returns Discriminated classification distinguishing missing, invalid, same-key, and different-key wrappers.
 */
export const classifyV3ChunkCandidateData = (
  data: Uint8Array | undefined,
  expectedKey: ChunkStorageKey,
): V3ChunkCandidateClassification => {
  // A zero-byte physical file is a recoverable write artifact (e.g. an interrupted save), not a
  // real conflict: treat it as absent before the wrapper is even decoded, so load can fall back
  // and save can overwrite it. A non-empty file that still fails to decode stays 'invalid'.
  if (!data || data.length === 0) {
    return { kind: 'missing' };
  }

  const chunk = decodeValidV3Chunk(data);

  if (!chunk) {
    return { kind: 'invalid' };
  }

  const sameKey =
    chunk.key[0] === expectedKey[0] &&
    chunk.key[1] === expectedKey[1] &&
    chunk.key[2] === expectedKey[2];

  return sameKey ? { kind: 'validSameKey', chunk } : { kind: 'validDifferentKey', chunk };
};
