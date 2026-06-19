import type { AMChunk } from '@shared/lib/automerge';
import { zodDocumentId, type AMDocumentId } from '@shared/lib/automerge';
import pLimit from 'p-limit';
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
import type { ChunkStorageKey, PartialStorageKey, StorageKey, StorageKeyPrefix } from './types';
import {
  classifyV3ChunkCandidateData,
  decodeValidV3Chunk,
  getV3CandidateNamesForKey,
  isGeneratedV3CandidateForKey,
  isPlausibleV3CandidateForPrefix,
  resolveWritableV3FileName,
} from './v3StoragePolicy';
import { encodeV3StorageWrapper } from './wrapperCodecV3';

/**
 * Maximum number of independent wrapper reads or physical removals performed concurrently for one
 * storage policy operation. Kept small and conservative for slow/SAF/cloud-backed filesystems.
 */
const IO_CONCURRENCY_LIMIT = 4;

/**
 * Runs an async mapper over items with bounded concurrency.
 * Used so discovery, range, and removal operations never issue unbounded parallel filesystem
 * calls against potentially slow or multi-client storage.
 * @param items - Items to process.
 * @param fn - Async mapper invoked for each item.
 * @returns Results in the same order as `items`.
 */
const mapBounded = async <T, R>(items: readonly T[], fn: (item: T) => Promise<R>): Promise<R[]> => {
  const limit = pLimit(IO_CONCURRENCY_LIMIT);

  return Promise.all(items.map((item) => limit(() => fn(item))));
};

/** Operation-scoped, IO-free classification of one directory listing snapshot. */
interface StorageNameIndex {
  /** Physical filenames that are plausible v3 `.mf` wrapper candidates. */
  v3CandidateNames: string[];
  /** Legacy/v2 entries deduplicated by logical key, preferring v2 over legacy. */
  legacyOrV2Entries: Map<string, { name: string; key: PartialStorageKey; isV2: boolean }>;
  /** All legacy/v2 entries without deduplication, for delete paths that must remove duplicates. */
  allParsedEntries: { name: string; key: PartialStorageKey }[];
}

/**
 * Classifies a directory listing snapshot once for reuse by every step of one top-level
 * operation. Performs no IO; it only inspects already-listed names.
 * @param names - Physical filenames from a single `listNames()` call.
 * @returns Operation-scoped classification of the listing.
 */
const buildStorageNameIndex = (names: readonly string[]): StorageNameIndex => {
  const v3CandidateNames: string[] = [];

  for (const name of names) {
    if (decodeV3CandidateFileName(name)) {
      v3CandidateNames.push(name);
    }
  }

  return {
    v3CandidateNames,
    legacyOrV2Entries: selectReadableStorageEntries(names),
    allParsedEntries: listStorageFileEntries(names),
  };
};

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
  if (isChunkStorageKey(key)) {
    const preferredV3Name = encodePreferredV3FileName(key);
    const preferredClassification = preferredV3Name
      ? classifyV3ChunkCandidateData(await io.readBytes(preferredV3Name), key)
      : { kind: 'missing' as const };

    if (preferredClassification.kind === 'validSameKey') {
      return preferredClassification.chunk.data;
    }

    const [documentId, kind, hash] = key;
    const v2Name = encodeStorageKeyToV2FileName(documentId, kind, hash);

    const tryV2 = async (): Promise<Uint8Array | undefined> => {
      if (!v2Name) {
        return undefined;
      }

      const v2Chunk = await readValidLegacyOrV2Chunk(io, { key, name: v2Name });

      return v2Chunk?.data;
    };

    // A missing preferred candidate gives no evidence that a v3 fallback exists, so a direct v2
    // read stays a safe fast path here. An invalid or different-key preferred candidate is
    // evidence that other v3 candidates may exist for this key, so v2 must wait until after the
    // v3 fallback scan below to preserve v3-over-v2 priority.
    if (preferredClassification.kind === 'missing') {
      const v2Data = await tryV2();

      if (v2Data) {
        return v2Data;
      }
    }

    const names = await io.listNames();

    for (const candidateName of getV3CandidateNamesForKey(names, key).filter(
      (name) => name !== preferredV3Name,
    )) {
      // eslint-disable-next-line no-await-in-loop -- stop on the first valid wrapper match
      const chunk = await readValidV3Chunk(io, candidateName, key);

      if (chunk) {
        return chunk.data;
      }
    }

    if (preferredClassification.kind !== 'missing') {
      const v2Data = await tryV2();

      if (v2Data) {
        return v2Data;
      }
    }

    const matched = selectReadableStorageEntries(names).get(storageKeyToId(key));

    if (!matched || matched.name === v2Name) {
      return undefined;
    }

    const fallbackChunk = await readValidLegacyOrV2Chunk(io, matched);

    return fallbackChunk?.data;
  }

  const names = await io.listNames();
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
  keyPrefix: StorageKeyPrefix,
): Promise<AMChunk[]> => {
  const names = await io.listNames();
  const index = buildStorageNameIndex(names);
  const result = new Map<string, AMChunk>();

  const v3Candidates = index.v3CandidateNames.filter((name) =>
    isPlausibleV3CandidateForPrefix(name, keyPrefix),
  );
  const v3Chunks = await mapBounded(v3Candidates, (name) => readValidV3Chunk(io, name));

  for (const chunk of v3Chunks) {
    if (chunk && storageKeyHasPrefix(chunk.key, keyPrefix)) {
      result.set(storageKeyToId(chunk.key), chunk);
    }
  }

  const fallbackEntries = [...index.legacyOrV2Entries.values()].filter(
    (entry) => storageKeyHasPrefix(entry.key, keyPrefix) && !result.has(storageKeyToId(entry.key)),
  );
  const fallbackChunks = await mapBounded(fallbackEntries, (entry) =>
    readValidLegacyOrV2Chunk(io, entry),
  );

  for (const chunk of fallbackChunks) {
    if (chunk) {
      result.set(storageKeyToId(chunk.key), chunk);
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
  const index = buildStorageNameIndex(names);
  const matching = new Set(
    index.allParsedEntries
      .filter(({ key: entryKey }) => storageKeyToId(entryKey) === storageKeyToId(key))
      .map(({ name }) => name),
  );

  if (isChunkStorageKey(key)) {
    const generatedCandidates = index.v3CandidateNames.filter((name) =>
      isGeneratedV3CandidateForKey(name, key),
    );
    const classifications = await mapBounded(generatedCandidates, async (name) => {
      const data = await io.readBytes(name);

      return { name, classification: classifyV3ChunkCandidateData(data, key) };
    });

    for (const { name, classification } of classifications) {
      if (classification.kind === 'validSameKey') {
        matching.add(name);
      } else if (classification.kind === 'invalid' && isPlausibleV3CandidateForPrefix(name, key)) {
        // Invalid/unreadable garbage that is only plausible for this key's generated family is
        // safe to clean up. A valid wrapper for a different full key must never be removed here.
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
  keyPrefix: StorageKeyPrefix,
): Promise<string[]> => {
  const names = await io.listNames();
  const index = buildStorageNameIndex(names);
  const matching = new Set(
    index.allParsedEntries
      .filter(({ key }) => storageKeyHasPrefix(key, keyPrefix))
      .map(({ name }) => name),
  );

  const v3Candidates = index.v3CandidateNames.filter((name) =>
    isPlausibleV3CandidateForPrefix(name, keyPrefix),
  );
  const confirmations = await mapBounded(v3Candidates, async (name) => {
    const chunk = await readValidV3Chunk(io, name);

    return chunk && storageKeyHasPrefix(chunk.key, keyPrefix) ? name : undefined;
  });

  for (const name of confirmations) {
    if (name) {
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
 * Discovers the full logical Automerge document ids visible through storage files.
 * Legacy and v2 entries are decoded from filenames; v3 entries are decoded from wrappers.
 * @param io - Storage IO boundary used for listing and decoding files.
 * @returns Unique document ids currently discoverable in storage.
 */
export const discoverStorageDocumentIds = async (
  io: ReadOnlyStorageFilePolicyIo,
): Promise<AMDocumentId[]> => {
  const names = await io.listNames();
  const index = buildStorageNameIndex(names);
  const documentIds = new Set<AMDocumentId>();

  for (const { key } of index.allParsedEntries) {
    const [documentId] = key;

    if (zodIs(documentId, zodDocumentId)) {
      documentIds.add(documentId);
    }
  }

  const v3Chunks = await mapBounded(index.v3CandidateNames, (name) => readValidV3Chunk(io, name));

  for (const chunk of v3Chunks) {
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

  if (!chunkKey) {
    await io.writeBytes(fileName, data);
    return;
  }

  const writableData = encodeV3StorageWrapper(chunkKey, data);
  const preferredName = encodePreferredV3FileName(chunkKey);

  if (preferredName) {
    const existingBytes = await io.readBytes(preferredName);
    const classification = classifyV3ChunkCandidateData(existingBytes, chunkKey);

    if (classification.kind === 'missing' || classification.kind === 'validSameKey') {
      // Absent or already-owned by this exact full key: write directly, no directory listing.
      await io.writeBytes(preferredName, writableData);
      return;
    }

    // Invalid or occupied by a different full key: fall through to the exceptional fallback
    // below, which performs a fresh directory listing to resolve a safe alternate filename.
  }

  const writableFileName = await resolveStorageChunkWriteTarget(io, chunkKey);

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
  await mapBounded(await collectStorageFileNamesForKey(io, key), (name) => io.removeName(name));
};

/**
 * Removes all physical files that belong to one logical storage key prefix.
 * @param io - Storage IO boundary used for listing, decoding, and removing physical files.
 * @param keyPrefix - Logical storage-key prefix to remove.
 */
export const removeStorageEntriesByPrefix = async (
  io: MutableStorageFilePolicyIo,
  keyPrefix: StorageKeyPrefix,
): Promise<void> => {
  await mapBounded(await collectStorageFileNamesForPrefix(io, keyPrefix), (name) =>
    io.removeName(name),
  );
};
