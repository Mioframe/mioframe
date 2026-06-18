import type {
  ChunkStorageKey,
  DirectoryForStorageAdapter,
  FileForStorageAdapter,
  PartialStorageKey,
  StorageKey,
} from './types';
import type { AMChunk, AMStorageAdapterInterface } from '../automerge/automergeTypes';
import { toString } from 'es-toolkit/compat';
import {
  isChunkStorageKey,
  listStorageFileEntries,
  selectReadableStorageEntries,
  storageKeyHasPrefix,
  storageKeyToId,
  toWritableStorageFileName,
} from './storageKeyHelpers';
import { encodeStorageKeyToV2FileName } from './filenameCodecV2';
import { encodePreferredV3FileName } from './filenameCodecV3';
import { encodeV3StorageWrapper } from './wrapperCodecV3';
import {
  decodeValidV3Chunk,
  getV3CandidateNamesForKey,
  isGeneratedV3CandidateForKey,
  isPlausibleV3CandidateForPrefix,
  resolveWritableV3FileName,
} from './v3StorageHelpers';

/**
 * Creates an Automerge storage adapter backed by a `DirectoryForStorageAdapter`.
 * New writes use v2 compact filenames. Reads and listings recognise both legacy and v2 files.
 * @param directory - Directory abstraction supplying Automerge storage entries.
 * @returns Automerge storage adapter interface.
 */
export const createFSStorageAdapter = (
  directory: DirectoryForStorageAdapter,
): AMStorageAdapterInterface => {
  const readFileBytes = async (entry: FileForStorageAdapter): Promise<Uint8Array> => {
    const file = await entry.read();
    return new Uint8Array(await file.arrayBuffer());
  };

  const collectFileHandles = async (): Promise<Map<string, FileForStorageAdapter>> => {
    const handles = new Map<string, FileForStorageAdapter>();

    for await (const [rawName, entry] of directory.entries()) {
      if ('read' in entry) {
        handles.set(toString(rawName), entry);
      }
    }

    return handles;
  };

  const listDeduplicatedEntries = async (): Promise<
    Map<
      string,
      { name: string; entry: FileForStorageAdapter; key: PartialStorageKey; isV2: boolean }
    >
  > => {
    const handles = await collectFileHandles();
    const deduped = selectReadableStorageEntries(handles.keys());
    const result = new Map<
      string,
      { name: string; entry: FileForStorageAdapter; key: PartialStorageKey; isV2: boolean }
    >();

    for (const [keyStr, { name, key, isV2 }] of deduped) {
      const entry = handles.get(name);

      if (entry) {
        result.set(keyStr, { name, entry, key, isV2 });
      }
    }

    return result;
  };

  const readValidV3Chunk = async (
    entry: FileForStorageAdapter | undefined,
    expectedKey?: ChunkStorageKey,
  ): Promise<AMChunk | undefined> => {
    if (!entry) {
      return undefined;
    }

    const rawData = await readFileBytes(entry);
    return decodeValidV3Chunk(rawData, expectedKey);
  };

  const readValidLegacyOrV2Chunk = async (
    entry: FileForStorageAdapter | undefined,
    key: PartialStorageKey,
  ): Promise<AMChunk | undefined> => {
    if (!entry) {
      return undefined;
    }

    const data = await readFileBytes(entry);

    if (data.length === 0) {
      return undefined;
    }

    return { key, data };
  };

  const load = async (key: PartialStorageKey): Promise<Uint8Array | undefined> => {
    if (isChunkStorageKey(key)) {
      const handles = await collectFileHandles();
      const preferredV3Name = encodePreferredV3FileName(key);

      if (preferredV3Name) {
        const preferred = await readValidV3Chunk(handles.get(preferredV3Name), key);

        if (preferred) {
          return preferred.data;
        }
      }

      for (const candidateName of getV3CandidateNamesForKey(handles.keys(), key).filter(
        (name) => name !== preferredV3Name,
      )) {
        // eslint-disable-next-line no-await-in-loop -- keep searching candidates until a valid wrapper matches the full key
        const chunk = await readValidV3Chunk(handles.get(candidateName), key);

        if (chunk) {
          return chunk.data;
        }
      }

      const [documentId, kind, hash] = key;
      const v2Name = encodeStorageKeyToV2FileName(documentId, kind, hash);

      if (v2Name) {
        const v2Chunk = await readValidLegacyOrV2Chunk(handles.get(v2Name), key);

        if (v2Chunk) {
          return v2Chunk.data;
        }
      }
    }

    const allEntries = await listDeduplicatedEntries();
    const matched = allEntries.get(storageKeyToId(key));

    if (!matched) {
      return undefined;
    }

    const chunk = await readValidLegacyOrV2Chunk(matched.entry, matched.key);

    return chunk?.data;
  };

  const save = async (key: StorageKey, data: Uint8Array<ArrayBuffer>) => {
    const fileName = toWritableStorageFileName(key);
    const chunkKey = isChunkStorageKey(key) ? key : undefined;

    if (!fileName) {
      throw new Error('fileName is undefined');
    }

    if (!('writeFile' in directory)) {
      console.warn(
        "FSStorageAdapter couldn't write new file, because a directory don't have writeFile method",
      );
    }

    if (chunkKey && data.length === 0) {
      return;
    }

    const handles = await collectFileHandles();
    const writableFileName = chunkKey
      ? await resolveWritableV3FileName(chunkKey, handles.keys(), async (name) => {
          const chunk = await readValidV3Chunk(handles.get(name));
          return chunk ? storageKeyToId(chunk.key) : undefined;
        })
      : fileName;
    const writableData = chunkKey ? encodeV3StorageWrapper(chunkKey, data) : data;

    await directory.writeFile?.(
      writableFileName,
      writableData instanceof Uint8Array ? new Uint8Array(writableData) : writableData,
    );
  };

  const remove = async (key: StorageKey) => {
    const handles = await collectFileHandles();
    const keyId = storageKeyToId(key);
    const matching = new Set(
      listStorageFileEntries(handles.keys())
        .filter(({ key: entryKey }) => storageKeyToId(entryKey) === keyId)
        .map(({ name }) => name),
    );

    if (isChunkStorageKey(key)) {
      for (const [name, entry] of handles) {
        if (!isGeneratedV3CandidateForKey(name, key)) {
          continue;
        }

        // eslint-disable-next-line no-await-in-loop -- every generated v3 variant must decode before remove can confirm the full logical key
        const chunk = await readValidV3Chunk(entry, key);

        if (chunk) {
          matching.add(name);
          continue;
        }

        if (isPlausibleV3CandidateForPrefix(name, key)) {
          matching.add(name);
        }
      }
    }

    await Promise.all(
      [...matching].map(async (name) => {
        const entry = handles.get(name);

        if (entry?.remove) {
          await entry.remove();
        } else {
          await directory.removeByName?.(name);
        }
      }),
    );
  };

  const loadRange = async (keyPrefix: PartialStorageKey): Promise<AMChunk[]> => {
    const handles = await collectFileHandles();
    const result = new Map<string, AMChunk>();

    for (const [name, entry] of handles) {
      if (!isPlausibleV3CandidateForPrefix(name, keyPrefix)) {
        continue;
      }

      // eslint-disable-next-line no-await-in-loop -- each wrapper must be decoded before v3 can outrank legacy or v2
      const chunk = await readValidV3Chunk(entry);

      if (!chunk || !storageKeyHasPrefix(chunk.key, keyPrefix)) {
        continue;
      }

      result.set(storageKeyToId(chunk.key), chunk);
    }

    const allEntries = await listDeduplicatedEntries();
    const matched = [...allEntries.values()].filter((entry) =>
      storageKeyHasPrefix(entry.key, keyPrefix),
    );

    for (const { entry, key } of matched) {
      const keyId = storageKeyToId(key);

      if (result.has(keyId)) {
        continue;
      }

      // eslint-disable-next-line no-await-in-loop -- read fallbacks lazily so a valid v3 chunk keeps precedence
      const chunk = await readValidLegacyOrV2Chunk(entry, key);

      if (chunk) {
        result.set(keyId, chunk);
      }
    }

    return [...result.values()];
  };

  const removeRange = async (keyPrefix: PartialStorageKey) => {
    const handles = await collectFileHandles();
    const matching = new Set(
      listStorageFileEntries(handles.keys())
        .filter(({ key }) => storageKeyHasPrefix(key, keyPrefix))
        .map(({ name }) => name),
    );

    for (const [name, entry] of handles) {
      if (!isPlausibleV3CandidateForPrefix(name, keyPrefix)) {
        continue;
      }

      // eslint-disable-next-line no-await-in-loop -- removeRange must decode each v3 wrapper because the filename is only a hint
      const chunk = await readValidV3Chunk(entry);

      if (chunk && storageKeyHasPrefix(chunk.key, keyPrefix)) {
        matching.add(name);
      }
    }

    await Promise.all(
      [...matching].map(async (name) => {
        const entry = handles.get(name);

        if (entry?.remove) {
          await entry.remove();
        } else {
          await directory.removeByName?.(name);
        }
      }),
    );
  };

  const adapter: AMStorageAdapterInterface = {
    load,
    save,
    remove,
    loadRange,
    removeRange,
  };

  return adapter;
};
