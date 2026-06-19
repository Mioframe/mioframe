import type { AMChunk } from '@shared/lib/automerge';
import { zodDocumentId, type AMDocumentId } from '@shared/lib/automerge';
import { zodIs } from '../validateZodScheme';
import { encodeStorageKeyToV2FileName } from './filenameCodecV2';
import { decodeV3CandidateFileName, encodePreferredV3FileName } from './filenameCodecV3';
import {
  isChunkStorageKey,
  listStorageFileEntries,
  selectReadableStorageEntries,
  storageKeyHasPrefix,
  storageKeyToId,
} from './storageKeyHelpers';
import type { ChunkStorageKey, PartialStorageKey, StorageKey } from './types';
import {
  decodeValidV3Chunk,
  getV3CandidateNamesForKey,
  isGeneratedV3CandidateForKey,
  isPlausibleV3CandidateForPrefix,
  resolveWritableV3FileName,
} from './v3StorageHelpers';

/** Minimal storage IO boundary shared by FS, VFS, and repository discovery. */
export interface StorageFilePolicyIo {
  /** Returns the current physical storage filenames visible to the policy. */
  listNames(): Promise<readonly string[]>;
  /** Reads the raw bytes for one physical storage file, or `undefined` when it is absent. */
  readBytes(name: string): Promise<Uint8Array | undefined>;
}

type LegacyOrV2Entry = {
  isV2: boolean;
  key: PartialStorageKey;
  name: string;
};

const readValidV3Chunk = async (
  io: StorageFilePolicyIo,
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
  io: StorageFilePolicyIo,
  entry: Pick<LegacyOrV2Entry, 'key' | 'name'>,
): Promise<AMChunk | undefined> => {
  const data = await io.readBytes(entry.name);

  if (!data || data.length === 0) {
    return undefined;
  }

  return { data, key: entry.key };
};

const getReadableLegacyOrV2Entries = async (io: StorageFilePolicyIo) => {
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
export const loadStorageChunk = async (
  io: StorageFilePolicyIo,
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
export const loadStorageChunksByPrefix = async (
  io: StorageFilePolicyIo,
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
  io: StorageFilePolicyIo,
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
  io: StorageFilePolicyIo,
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
  io: StorageFilePolicyIo,
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
 * Discovers the full logical Automerge document ids visible through storage files.
 * Legacy and v2 entries are decoded from filenames; v3 entries are decoded from wrappers.
 * @param io - Storage IO boundary used for listing and decoding files.
 * @returns Unique document ids currently discoverable in storage.
 */
export const discoverStorageDocumentIds = async (
  io: StorageFilePolicyIo,
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
