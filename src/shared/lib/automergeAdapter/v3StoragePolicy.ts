import type { AMChunk } from '@shared/lib/automerge';
import {
  decodeV3CandidateFileName,
  encodePreferredV3FileName,
  encodeV3FileNameWithSuffix,
} from './filenameCodecV3';
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
 * Lists plausible v3 candidate filenames for a logical chunk key.
 * @param names - Physical filenames to inspect.
 * @param key - Full logical key being searched.
 * @returns Sorted candidate filenames whose prefixes could map to the key.
 */
export const getV3CandidateNamesForKey = (
  names: Iterable<string>,
  key: ChunkStorageKey,
): string[] => {
  const [documentId, kind, hash] = key;
  const matches: string[] = [];

  for (const name of names) {
    const parsed = decodeV3CandidateFileName(name);

    if (
      parsed &&
      parsed.kind === kind &&
      documentId.startsWith(parsed.docPrefix) &&
      hash.startsWith(parsed.hashPrefix)
    ) {
      matches.push(name);
    }
  }

  return matches.sort((left, right) => left.localeCompare(right));
};

/**
 * Returns whether a physical filename is a plausible v3 candidate for a partial key prefix.
 * An empty prefix (`[]`) matches every plausible v3 candidate, because an empty range prefix
 * semantically selects all storage entries for `loadRange`/`removeRange` scans.
 * @param name - Physical filename to inspect.
 * @param keyPrefix - Partial logical key used to prefilter directory scans. May be empty.
 * @returns True when the filename should be wrapper-decoded for this prefix.
 */
export const isPlausibleV3CandidateForPrefix = (
  name: string,
  keyPrefix: StorageKeyPrefix,
): boolean => {
  const parsed = decodeV3CandidateFileName(name);

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
 * Resolves a writable short physical v3 `.mf` filename without expanding logical prefixes.
 * Existing invalid, unreadable, or empty candidates remain occupied so save never overwrites an
 * unknown wrapper candidate.
 * @param key - Full logical chunk key to persist.
 * @param existingNames - Current directory entry names.
 * @param readCandidateKeyId - Callback that returns a valid decoded logical key id, or undefined for invalid content.
 * @returns Preferred or suffixed filename that can be written safely.
 */
export const resolveWritableV3FileName = async (
  key: ChunkStorageKey,
  existingNames: Iterable<string>,
  readCandidateKeyId: (name: string) => Promise<string | undefined>,
): Promise<string> => {
  const existing = new Set(existingNames);
  const preferredName = encodePreferredV3FileName(key);

  if (!preferredName) {
    throw new Error('Unable to encode preferred v3 Automerge storage filename');
  }

  const tryCandidate = async (name: string): Promise<string | undefined> => {
    if (!existing.has(name)) {
      return name;
    }

    const existingKeyId = await readCandidateKeyId(name);

    if (existingKeyId === `${key[0]}\x00${key[1]}\x00${key[2]}`) {
      return name;
    }

    return undefined;
  };

  const preferred = await tryCandidate(preferredName);

  if (preferred) {
    return preferred;
  }

  for (let suffixNumber = 1; suffixNumber <= 1000; suffixNumber++) {
    const candidateName = encodeV3FileNameWithSuffix(key, suffixNumber);

    if (!candidateName) {
      break;
    }

    // eslint-disable-next-line no-await-in-loop -- candidate resolution must stop on the first safe short filename
    const resolved = await tryCandidate(candidateName);

    if (resolved) {
      return resolved;
    }
  }

  throw new Error('Unable to resolve a writable v3 Automerge storage filename');
};

/**
 * Returns the fixed short prefix used by generated v3 filenames for a chunk key.
 * @param key - Full logical chunk key.
 * @returns `<docPrefix>.<kindCode>.<hashPrefix>` without the file extension.
 */
export const getGeneratedV3PrefixForKey = (key: ChunkStorageKey): string | undefined => {
  const preferredName = encodePreferredV3FileName(key);

  if (!preferredName) {
    return undefined;
  }

  return preferredName.slice(0, -'.mf'.length);
};

/**
 * Returns whether a filename belongs to the generated short v3 candidate family for a key.
 * The physical filename must first decode as a plausible v3 `.mf` candidate; matching the shared
 * prefix alone is not sufficient.
 * @param name - Physical filename.
 * @param key - Full logical chunk key.
 * @returns True when the filename is in the exact generated candidate family for that key.
 */
export const isGeneratedV3CandidateForKey = (name: string, key: ChunkStorageKey): boolean => {
  const parsed = decodeV3CandidateFileName(name);

  if (!parsed) {
    return false;
  }

  const prefix = getGeneratedV3PrefixForKey(key);

  return (
    prefix !== undefined &&
    parsed.kind === key[1] &&
    key[0].startsWith(parsed.docPrefix) &&
    key[2].startsWith(parsed.hashPrefix) &&
    name.startsWith(prefix)
  );
};
