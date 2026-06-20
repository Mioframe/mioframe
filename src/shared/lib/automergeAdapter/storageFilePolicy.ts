import type { AMChunk } from '@shared/lib/automerge';
import { zodDocumentId, type AMDocumentId } from '@shared/lib/automerge';
import pLimit from 'p-limit';
import { zodIs } from '../validateZodScheme';
import { fileNameToPartialKey } from './fileNameToPartialKey';
import { encodeStorageKeyToV2FileName } from './filenameCodecV2';
import { decodeAnyV3CandidateFileName, encodePrimaryV3FileName } from './filenameCodecV3';
import { partialKeyToFileName } from './partialKeyToFileName';
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
  isPlausibleV3CandidateForPrefix,
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

/**
 * Raised when the primary v3 target for a full chunk key is occupied by invalid data or by a
 * valid wrapper for a different full key. Save never overwrites and remove never deletes that
 * data; callers must resolve the conflict out of band instead of receiving a silent fallback.
 */
export class V3StorageConflictError extends Error {
  /** Creates a new conflict error with a stable, privacy-safe message. */
  constructor() {
    super('Automerge v3 storage conflict: existing file is invalid or belongs to a different key');
    this.name = 'V3StorageConflictError';
  }
}

/** Operation-scoped, IO-free classification of one directory listing snapshot. */
interface StorageNameIndex {
  /** Physical filenames that are strict primary v3 `.mf` wrapper candidates. */
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
    if (decodeAnyV3CandidateFileName(name)) {
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

const isSameStorageKey = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length && left.every((part, index) => part === right[index]);

/**
 * Loads one logical storage entry and returns the raw Automerge bytes.
 *
 * Exact full chunk keys follow a simple deterministic priority: the primary v3 file wins when it
 * holds a valid same-key wrapper; an invalid or different-key primary file is a storage conflict
 * reported as a safe failure, never a silent fallback; a missing primary file falls back to a
 * direct v2 read, then to the released legacy filename with extension, then to the released
 * extension-less legacy filename. Every step is a direct read by name; no directory listing is
 * performed for a full chunk key.
 * @param io - Storage IO boundary used for listing and reading physical files.
 * @param key - Full or partial logical storage key to load.
 * @returns Raw Automerge bytes, or `undefined` when no valid entry exists.
 */
export const loadStorageEntry = async (
  io: ReadOnlyStorageFilePolicyIo,
  key: PartialStorageKey,
): Promise<Uint8Array | undefined> => {
  if (isChunkStorageKey(key)) {
    const primaryName = encodePrimaryV3FileName(key);
    const primaryClassification = primaryName
      ? classifyV3ChunkCandidateData(await io.readBytes(primaryName), key)
      : ({ kind: 'missing' } as const);

    if (primaryClassification.kind === 'validSameKey') {
      return primaryClassification.chunk.data;
    }

    if (
      primaryClassification.kind === 'invalid' ||
      primaryClassification.kind === 'validDifferentKey'
    ) {
      // The primary target is occupied by something else: that is a storage conflict, not
      // evidence that v2/legacy should win. Fail safely instead of returning stale/wrong data.
      return undefined;
    }

    const [documentId, kind, hash] = key;
    const v2Name = encodeStorageKeyToV2FileName(documentId, kind, hash);
    const v2Chunk = v2Name ? await readValidLegacyOrV2Chunk(io, { key, name: v2Name }) : undefined;

    if (v2Chunk) {
      return v2Chunk.data;
    }

    const legacyName = partialKeyToFileName(key);
    const legacyChunk = legacyName
      ? await readValidLegacyOrV2Chunk(io, { key, name: legacyName })
      : undefined;

    if (legacyChunk) {
      return legacyChunk.data;
    }

    const extensionlessLegacyName = partialKeyToFileName(key, { withExtension: false });
    const extensionlessLegacyChunk = extensionlessLegacyName
      ? await readValidLegacyOrV2Chunk(io, { key, name: extensionlessLegacyName })
      : undefined;

    return extensionlessLegacyChunk?.data;
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
 * Collects all physical filenames that should be removed for one logical storage key prefix.
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
  fileNameToPartialKey(name) !== undefined || decodeAnyV3CandidateFileName(name) !== undefined;

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
 *
 * Chunk entries always resolve to the primary deterministic v3 filename: a missing or
 * already-owned (same full key) target is written directly with no directory listing, while a
 * target occupied by invalid data or a different full key raises {@link V3StorageConflictError}
 * instead of writing a numeric-suffix fallback. Non-chunk entries keep their legacy filename.
 * Empty chunk data is treated as invalid and skipped.
 * @param io - Storage IO boundary used for reading and writing physical files.
 * @param key - Full logical storage key to persist.
 * @param data - Raw Automerge bytes to store.
 */
export const saveStorageEntry = async (
  io: MutableStorageFilePolicyIo,
  key: StorageKey,
  data: Uint8Array,
): Promise<void> => {
  const chunkKey = isChunkStorageKey(key) ? key : undefined;

  if (chunkKey && data.length === 0) {
    return;
  }

  if (!chunkKey) {
    const fileName = toWritableStorageFileName(key);

    if (!fileName) {
      throw new Error('fileName is undefined');
    }

    await io.writeBytes(fileName, data);
    return;
  }

  const primaryName = encodePrimaryV3FileName(chunkKey);

  if (!primaryName) {
    throw new Error('Unable to encode primary v3 Automerge storage filename');
  }

  const classification = classifyV3ChunkCandidateData(await io.readBytes(primaryName), chunkKey);

  if (classification.kind === 'invalid' || classification.kind === 'validDifferentKey') {
    throw new V3StorageConflictError();
  }

  const writableData = encodeV3StorageWrapper(chunkKey, data);

  await io.writeBytes(primaryName, writableData);
};

/**
 * Removes one logical storage entry using the shared physical storage policy.
 *
 * For full chunk keys, removal is a logical-key cleanup pass: one fresh directory listing is
 * classified through the shared storage policy, plausible v3 candidates are wrapper-confirmed
 * with bounded concurrency, and every same-key physical representation is removed. Invalid or
 * different-key `.mf` files are left untouched.
 * @param io - Storage IO boundary used for reading and removing physical files.
 * @param key - Full logical storage key to remove.
 */
export const removeStorageEntry = async (
  io: MutableStorageFilePolicyIo,
  key: StorageKey,
): Promise<void> => {
  if (isChunkStorageKey(key)) {
    const names = await io.listNames();
    const index = buildStorageNameIndex(names);
    const matchingNames = new Set(
      index.allParsedEntries
        .filter((entry) => isSameStorageKey(entry.key, key))
        .map(({ name }) => name),
    );
    const v3Matches = await mapBounded(index.v3CandidateNames, async (name) => {
      const classification = classifyV3ChunkCandidateData(await io.readBytes(name), key);
      return classification.kind === 'validSameKey' ? name : undefined;
    });

    for (const name of v3Matches) {
      if (name) {
        matchingNames.add(name);
      }
    }

    await mapBounded([...matchingNames], (name) => io.removeName(name));

    return;
  }

  const fileName = toWritableStorageFileName(key);

  if (fileName) {
    await io.removeName(fileName);
  }
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
