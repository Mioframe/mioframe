import type { AMChunk } from '@shared/lib/automerge';
import { zodDocumentId, type AMDocumentId } from '@shared/lib/automerge';
import { zodIs } from '../validateZodScheme';
import { fileNameToPartialKey } from './fileNameToPartialKey';
import { encodeStorageKeyToV2FileName } from './filenameCodecV2';
import { decodeV3CandidateFileName, encodePreferredV3FileName } from './filenameCodecV3';
import {
  isChunkStorageKey,
  listStorageFileEntries,
  selectReadableStorageEntries,
  storageKeyHasPrefix,
  storageKeyToId,
  toWritableStorageFileName,
} from './storageKeyHelpers';
import type { ChunkStorageKey, PartialStorageKey, StorageKey } from './types';
import {
  decodeValidV3Chunk,
  getV3CandidateNamesForKey,
  isGeneratedV3CandidateForKey,
  isPlausibleV3CandidateForPrefix,
  resolveWritableV3FileName,
} from './v3StoragePolicy';
import { encodeV3StorageWrapper } from './wrapperCodecV3';

/** Read-only storage IO boundary shared by FS, VFS, and repository discovery. */
export interface ReadOnlyStorageFilePolicyIo {
  /** Returns the current physical storage filenames visible to the policy. */
  listNames(): Promise<readonly string[]>;
  /** Reads the raw bytes for one physical storage file, or `undefined` when it is absent. */
  readBytes(name: string): Promise<Uint8Array | undefined>;
}

/** Mutable storage IO boundary used by save and remove operations. */
export interface MutableStorageFilePolicyIo extends ReadOnlyStorageFilePolicyIo {
  /** Writes raw bytes for one physical storage file. */
  writeBytes(name: string, data: Uint8Array): Promise<void>;
  /** Removes one physical storage file when present. */
  removeName(name: string): Promise<void>;
}

type LegacyOrV2Entry = {
  isV2: boolean;
  key: PartialStorageKey;
  name: string;
};

const readValidV3Chunk = async (
  io: ReadOnlyStorageFilePolicyIo,
  name: string,
  expectedKey?: ChunkStorageKey,
): Promise<AMChunk | undefined> => {
  const rawData = await io.readBytes(name);

  if (!rawData) {
    return undefined;
  }

  return decodeValidV3Chunk(rawData, expectedKey);
};

const readValidLegacyOrV2Chunk = async (
  io: ReadOnlyStorageFilePolicyIo,
  entry: Pick<LegacyOrV2Entry, 'key' | 'name'>,
): Promise<AMChunk | undefined> => {
  const data = await io.readBytes(entry.name);

  if (!data || data.length === 0) {
    return undefined;
  }

  return { data, key: entry.key };
};

const getReadableLegacyOrV2Entries = async (io: ReadOnlyStorageFilePolicyIo) => {
  const names = await io.listNames();

  return selectReadableStorageEntries(names);
};

/**
 * Loads one logical storage entry and returns the raw Automerge bytes.
 * Valid v3 wrappers outrank legacy and v2 fallbacks for full chunk keys.
 * @param io - Storage IO boundary used for listing and reading physical files.
 * @param key - Full or partial logical storage key to load.
 * @returns Raw Automerge bytes, or `undefined` when no valid entry exists.
 */
export const loadStorageEntry = async (
  io: ReadOnlyStorageFilePolicyIo,
  key: PartialStorageKey,
): Promise<Uint8Array | undefined> => {
  let names: readonly string[] | undefined;

  if (isChunkStorageKey(key)) {
    const preferredV3Name = encodePreferredV3FileName(key);

    if (preferredV3Name) {
      const preferred = await readValidV3Chunk(io, preferredV3Name, key);

      if (preferred) {
        return preferred.data;
      }
    }

    names = await io.listNames();

    for (const candidateName of getV3CandidateNamesForKey(names, key).filter(
      (name) => name !== preferredV3Name,
    )) {
      // eslint-disable-next-line no-await-in-loop -- stop on the first valid wrapper match
      const chunk = await readValidV3Chunk(io, candidateName, key);

      if (chunk) {
        return chunk.data;
      }
    }

    const [documentId, kind, hash] = key;
    const v2Name = encodeStorageKeyToV2FileName(documentId, kind, hash);

    if (v2Name) {
      const v2Chunk = await readValidLegacyOrV2Chunk(io, { key, name: v2Name });

      if (v2Chunk) {
        return v2Chunk.data;
      }
    }
  }

  names ??= await io.listNames();
  const matched = selectReadableStorageEntries(names).get(storageKeyToId(key));

  if (!matched) {
    return undefined;
  }

  const chunk = await readValidLegacyOrV2Chunk(io, matched);

  return chunk?.data;
};

/**
 * Loads all readable chunks whose logical storage key begins with the provided prefix.
 * Valid v3 wrappers outrank legacy and v2 entries for the same logical chunk.
 * @param io - Storage IO boundary used for listing and reading physical files.
 * @param keyPrefix - Logical storage-key prefix to match.
 * @returns Decoded raw chunks that match the prefix.
 */
export const loadStorageEntriesByPrefix = async (
  io: ReadOnlyStorageFilePolicyIo,
  keyPrefix: PartialStorageKey,
): Promise<AMChunk[]> => {
  const names = await io.listNames();
  const result = new Map<string, AMChunk>();

  for (const name of names) {
    if (!isPlausibleV3CandidateForPrefix(name, keyPrefix)) {
      continue;
    }

    // eslint-disable-next-line no-await-in-loop -- each wrapper must decode before v3 can outrank fallback files
    const chunk = await readValidV3Chunk(io, name);

    if (!chunk || !storageKeyHasPrefix(chunk.key, keyPrefix)) {
      continue;
    }

    result.set(storageKeyToId(chunk.key), chunk);
  }

  const matched = [...(await getReadableLegacyOrV2Entries(io)).values()].filter((entry) =>
    storageKeyHasPrefix(entry.key, keyPrefix),
  );

  for (const entry of matched) {
    const keyId = storageKeyToId(entry.key);

    if (result.has(keyId)) {
      continue;
    }

    // eslint-disable-next-line no-await-in-loop -- fallback reads stay lazy so valid v3 keeps precedence
    const chunk = await readValidLegacyOrV2Chunk(io, entry);

    if (chunk) {
      result.set(keyId, chunk);
    }
  }

  return [...result.values()];
};

/**
 * Resolves the writable physical v3 filename for one logical chunk key.
 * @param io - Storage IO boundary used for listing and reading candidate files.
 * @param key - Full logical chunk key that is about to be persisted.
 * @returns Preferred or suffixed v3 filename that is safe to write.
 */
export const resolveStorageChunkWriteTarget = async (
  io: ReadOnlyStorageFilePolicyIo,
  key: ChunkStorageKey,
): Promise<string> => {
  const names = await io.listNames();

  return resolveWritableV3FileName(key, names, async (name) => {
    const chunk = await readValidV3Chunk(io, name);
    return chunk ? storageKeyToId(chunk.key) : undefined;
  });
};

/**
 * Collects all physical filenames that should be removed for one logical storage key.
 * @param io - Storage IO boundary used for listing and decoding files.
 * @param key - Full or partial logical storage key to remove.
 * @returns Physical filenames that belong to the logical key.
 */
export const collectStorageFileNamesForKey = async (
  io: ReadOnlyStorageFilePolicyIo,
  key: StorageKey,
): Promise<string[]> => {
  const names = await io.listNames();
  const matching = new Set(
    listStorageFileEntries(names)
      .filter(({ key: entryKey }) => storageKeyToId(entryKey) === storageKeyToId(key))
      .map(({ name }) => name),
  );

  if (isChunkStorageKey(key)) {
    for (const name of names) {
      if (!isGeneratedV3CandidateForKey(name, key)) {
        continue;
      }

      // eslint-disable-next-line no-await-in-loop -- full-key delete must confirm wrapper identity before removing
      const chunk = await readValidV3Chunk(io, name, key);

      if (chunk) {
        matching.add(name);
        continue;
      }

      if (isPlausibleV3CandidateForPrefix(name, key)) {
        matching.add(name);
      }
    }
  }

  return [...matching];
};

/**
 * Collects all physical filenames that should be removed for one logical key prefix.
 * @param io - Storage IO boundary used for listing and decoding files.
 * @param keyPrefix - Logical storage-key prefix to match.
 * @returns Physical filenames that belong to the matched logical prefix.
 */
export const collectStorageFileNamesForPrefix = async (
  io: ReadOnlyStorageFilePolicyIo,
  keyPrefix: PartialStorageKey,
): Promise<string[]> => {
  const names = await io.listNames();
  const matching = new Set(
    listStorageFileEntries(names)
      .filter(({ key }) => storageKeyHasPrefix(key, keyPrefix))
      .map(({ name }) => name),
  );

  for (const name of names) {
    if (!isPlausibleV3CandidateForPrefix(name, keyPrefix)) {
      continue;
    }

    // eslint-disable-next-line no-await-in-loop -- wrapper identity is needed because the filename is only a hint
    const chunk = await readValidV3Chunk(io, name);

    if (chunk && storageKeyHasPrefix(chunk.key, keyPrefix)) {
      matching.add(name);
    }
  }

  return [...matching];
};

/**
 * Returns whether a file name is a plausible repository storage candidate.
 * Filename-only matching is enough for legacy/v2 files, while v3 `.mf` names remain only
 * candidates until their wrapper payload is decoded.
 * @param name - Physical filename to classify.
 * @returns Whether the filename should be treated as repository storage.
 */
export const isPlausibleRepositoryStorageCandidateFileName = (name: string): boolean =>
  fileNameToPartialKey(name) !== undefined || decodeV3CandidateFileName(name) !== undefined;

/**
 * Legacy alias for plausible repository storage candidate detection.
 * Prefer `isPlausibleRepositoryStorageCandidateFileName` so callers do not infer verified v3 identity
 * from filename-only matching.
 */
export const isRepositoryStorageCandidateFileName = isPlausibleRepositoryStorageCandidateFileName;

/**
 * Discovers the full logical Automerge document ids visible through storage files.
 * Legacy and v2 entries are decoded from filenames; v3 entries are decoded from wrappers.
 * @param io - Storage IO boundary used for listing and decoding files.
 * @returns Unique document ids currently discoverable in storage.
 */
export const discoverStorageDocumentIds = async (
  io: ReadOnlyStorageFilePolicyIo,
): Promise<AMDocumentId[]> => {
  const names = await io.listNames();
  const documentIds = new Set<AMDocumentId>();

  for (const { key } of listStorageFileEntries(names)) {
    const [documentId] = key;

    if (zodIs(documentId, zodDocumentId)) {
      documentIds.add(documentId);
    }
  }

  for (const name of names) {
    if (!decodeV3CandidateFileName(name)) {
      continue;
    }

    // eslint-disable-next-line no-await-in-loop -- repository discovery must decode wrapper-backed ids one file at a time
    const chunk = await readValidV3Chunk(io, name);
    const [documentId] = chunk?.key ?? [];

    if (zodIs(documentId, zodDocumentId)) {
      documentIds.add(documentId);
    }
  }

  return [...documentIds];
};

/**
 * Persists one logical storage entry using the shared physical storage policy.
 * Chunk entries are written as v3 wrappers, while non-chunk entries keep their legacy filename.
 * Empty chunk data is treated as invalid and skipped.
 * @param io - Storage IO boundary used for listing, reading, and writing physical files.
 * @param key - Full logical storage key to persist.
 * @param data - Raw Automerge bytes to store.
 */
export const saveStorageEntry = async (
  io: MutableStorageFilePolicyIo,
  key: StorageKey,
  data: Uint8Array,
): Promise<void> => {
  const fileName = toWritableStorageFileName(key);
  const chunkKey = isChunkStorageKey(key) ? key : undefined;

  if (!fileName) {
    throw new Error('fileName is undefined');
  }

  if (chunkKey && data.length === 0) {
    return;
  }

  const writableFileName = chunkKey ? await resolveStorageChunkWriteTarget(io, chunkKey) : fileName;
  const writableData = chunkKey ? encodeV3StorageWrapper(chunkKey, data) : data;

  await io.writeBytes(writableFileName, writableData);
};

/**
 * Removes all physical files that belong to one logical storage key.
 * @param io - Storage IO boundary used for listing, decoding, and removing physical files.
 * @param key - Full logical storage key to remove.
 */
export const removeStorageEntry = async (
  io: MutableStorageFilePolicyIo,
  key: StorageKey,
): Promise<void> => {
  await Promise.all(
    (await collectStorageFileNamesForKey(io, key)).map((name) => io.removeName(name)),
  );
};

/**
 * Removes all physical files that belong to one logical storage key prefix.
 * @param io - Storage IO boundary used for listing, decoding, and removing physical files.
 * @param keyPrefix - Logical storage-key prefix to remove.
 */
export const removeStorageEntriesByPrefix = async (
  io: MutableStorageFilePolicyIo,
  keyPrefix: PartialStorageKey,
): Promise<void> => {
  await Promise.all(
    (await collectStorageFileNamesForPrefix(io, keyPrefix)).map((name) => io.removeName(name)),
  );
};

export {
  loadStorageEntry as loadStorageChunk,
  loadStorageEntriesByPrefix as loadStorageChunksByPrefix,
};
