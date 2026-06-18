import type { StorageAdapterInterface } from '@automerge/automerge-repo';
import type { AMChunk } from '@shared/lib/automerge';
import { isStandardBufferView } from '@shared/lib/isStandardBufferView';
import { FileSystemError, PathUtils, type VirtualFileSystem, VfsError } from '../virtualFileSystem';
import type { ChunkStorageKey, PartialStorageKey, StorageKey } from './types';
import { encodeStorageKeyToV2FileName } from './filenameCodecV2';
import { encodePreferredV3FileName } from './filenameCodecV3';
import {
  isChunkStorageKey,
  listStorageFileEntries,
  selectReadableStorageEntries,
  storageKeyHasPrefix,
  storageKeyToId,
  toWritableStorageFileName,
} from './storageKeyHelpers';
import { encodeV3StorageWrapper } from './wrapperCodecV3';
import {
  decodeValidV3Chunk,
  getV3CandidateNamesForKey,
  isGeneratedV3CandidateForKey,
  isPlausibleV3CandidateForPrefix,
  resolveWritableV3FileName,
} from './v3StorageHelpers';

/**
 * Creates an Automerge storage adapter backed by a VirtualFileSystem path.
 * New writes use v2 compact filenames. Reads and listings recognise both legacy and v2 files.
 * @param vfs - Mounted virtual file system.
 * @param path - Absolute path of the repository directory inside the VFS.
 * @returns Automerge storage adapter interface.
 */
export const createVFSAdapter = (vfs: VirtualFileSystem, path: string): StorageAdapterInterface => {
  const readFileBytes = async (name: string): Promise<Uint8Array> => {
    const file = await vfs.readFile(PathUtils.join(path, name));
    return new Uint8Array(await file.arrayBuffer());
  };

  const tryReadDirectFile = async (name: string): Promise<Uint8Array | undefined> => {
    try {
      return await readFileBytes(name);
    } catch (error) {
      if (error instanceof VfsError && error.code === FileSystemError.FileNotFound) {
        return undefined;
      }

      throw error;
    }
  };

  const readValidV3Chunk = async (
    name: string,
    expectedKey?: ChunkStorageKey,
  ): Promise<AMChunk | undefined> => {
    const rawData = await tryReadDirectFile(name);

    if (!rawData) {
      return undefined;
    }

    return decodeValidV3Chunk(rawData, expectedKey);
  };

  const readValidLegacyOrV2Chunk = async (
    name: string,
    key: PartialStorageKey,
  ): Promise<AMChunk | undefined> => {
    const data = await tryReadDirectFile(name);

    if (!data || data.length === 0) {
      return undefined;
    }

    return {
      key,
      data,
    };
  };

  const load = async (key: PartialStorageKey): Promise<Uint8Array | undefined> => {
    let directoryContent: Awaited<ReturnType<typeof vfs.readDirectory>> | undefined;

    if (isChunkStorageKey(key)) {
      const preferredV3Name = encodePreferredV3FileName(key);

      if (preferredV3Name) {
        const preferredV3Chunk = await readValidV3Chunk(preferredV3Name, key);

        if (preferredV3Chunk) {
          return preferredV3Chunk.data;
        }
      }

      directoryContent = await vfs.readDirectory(path);
      const v3Candidates = getV3CandidateNamesForKey(
        directoryContent.map(([name]) => name),
        key,
      ).filter((name) => name !== preferredV3Name);

      for (const name of v3Candidates) {
        // eslint-disable-next-line no-await-in-loop -- keep searching candidates until a valid wrapper matches the full key
        const chunk = await readValidV3Chunk(name, key);

        if (chunk) {
          return chunk.data;
        }
      }

      const [documentId, kind, hash] = key;
      const v2Name = encodeStorageKeyToV2FileName(documentId, kind, hash);

      if (v2Name) {
        const v2Chunk = await readValidLegacyOrV2Chunk(v2Name, key);

        if (v2Chunk) {
          return v2Chunk.data;
        }
      }
    }

    directoryContent ??= await vfs.readDirectory(path);
    const allEntries = selectReadableStorageEntries(directoryContent.map(([name]) => name));
    const keyId = storageKeyToId(key);
    const matched = allEntries.get(keyId);

    if (!matched) {
      return undefined;
    }

    const chunk = await readValidLegacyOrV2Chunk(matched.name, matched.key);

    return chunk?.data;
  };

  const loadRange = async (keyPrefix: PartialStorageKey): Promise<AMChunk[]> => {
    const directoryContent = await vfs.readDirectory(path);
    const result = new Map<string, AMChunk>();

    for (const [name] of directoryContent) {
      if (!isPlausibleV3CandidateForPrefix(name, keyPrefix)) {
        continue;
      }

      // eslint-disable-next-line no-await-in-loop -- each wrapper must be decoded before v3 can outrank legacy or v2
      const chunk = await readValidV3Chunk(name);

      if (!chunk || !storageKeyHasPrefix(chunk.key, keyPrefix)) {
        continue;
      }

      result.set(storageKeyToId(chunk.key), chunk);
    }

    const allEntries = selectReadableStorageEntries(directoryContent.map(([name]) => name));
    const matched = [...allEntries.values()].filter((entry) =>
      storageKeyHasPrefix(entry.key, keyPrefix),
    );

    for (const { name, key } of matched) {
      const keyId = storageKeyToId(key);

      if (result.has(keyId)) {
        continue;
      }

      // eslint-disable-next-line no-await-in-loop -- read fallbacks lazily so a valid v3 chunk keeps precedence
      const chunk = await readValidLegacyOrV2Chunk(name, key);

      if (chunk) {
        result.set(keyId, chunk);
      }
    }

    return [...result.values()];
  };

  const deleteMatchingFiles = async (names: string[]): Promise<void> => {
    const results = await Promise.allSettled(
      names.map((name) => vfs.delete(PathUtils.join(path, name))),
    );

    for (const result of results) {
      if (result.status === 'rejected') {
        const { reason } = result;

        if (!(reason instanceof VfsError && reason.code === FileSystemError.FileNotFound)) {
          throw reason;
        }
      }
    }
  };

  const remove = async (key: StorageKey) => {
    const directoryContent = await vfs.readDirectory(path);
    const matching = new Set(
      listStorageFileEntries(directoryContent.map(([name]) => name))
        .filter(({ key: entryKey }) => storageKeyToId(entryKey) === storageKeyToId(key))
        .map(({ name }) => name),
    );

    if (isChunkStorageKey(key)) {
      for (const [name] of directoryContent) {
        if (!isGeneratedV3CandidateForKey(name, key)) {
          continue;
        }

        // eslint-disable-next-line no-await-in-loop -- every generated v3 variant must decode before remove can confirm the full logical key
        const chunk = await readValidV3Chunk(name, key);

        if (chunk) {
          matching.add(name);
          continue;
        }

        if (isPlausibleV3CandidateForPrefix(name, key)) {
          matching.add(name);
        }
      }
    }

    await deleteMatchingFiles([...matching]);
  };

  const removeRange = async (keyPrefix: PartialStorageKey) => {
    const directoryContent = await vfs.readDirectory(path);
    const matching = new Set(
      listStorageFileEntries(directoryContent.map(([name]) => name))
        .filter(({ key }) => storageKeyHasPrefix(key, keyPrefix))
        .map(({ name }) => name),
    );

    for (const [name] of directoryContent) {
      if (!isPlausibleV3CandidateForPrefix(name, keyPrefix)) {
        continue;
      }

      // eslint-disable-next-line no-await-in-loop -- removeRange must decode each v3 wrapper because the filename is only a hint
      const chunk = await readValidV3Chunk(name);

      if (chunk && storageKeyHasPrefix(chunk.key, keyPrefix)) {
        matching.add(name);
      }
    }

    await deleteMatchingFiles([...matching]);
  };

  const save = async (key: StorageKey, data: Uint8Array): Promise<void> => {
    const fileName = toWritableStorageFileName(key);
    const chunkKey = isChunkStorageKey(key) ? key : undefined;

    if (!fileName) {
      throw new Error('fileName is undefined');
    }

    if (chunkKey && data.length === 0) {
      return;
    }

    const writableFileName = chunkKey
      ? await resolveWritableV3FileName(
          chunkKey,
          (await vfs.readDirectory(path)).map(([name]) => name),
          async (name) => {
            const chunk = await readValidV3Chunk(name);
            return chunk ? storageKeyToId(chunk.key) : undefined;
          },
        )
      : fileName;
    const fullPath = PathUtils.join(path, writableFileName);
    const writableData = chunkKey ? encodeV3StorageWrapper(chunkKey, data) : data;

    if (writableData instanceof Blob || writableData instanceof ArrayBuffer) {
      await vfs.writeFile(fullPath, writableData);
    } else if (
      isStandardBufferView(writableData) &&
      writableData.byteOffset === 0 &&
      writableData.byteLength === writableData.buffer.byteLength
    ) {
      await vfs.writeFile(fullPath, new Uint8Array(writableData));
    } else {
      await vfs.writeFile(fullPath, new Uint8Array(writableData));
    }
  };

  return {
    load,
    loadRange,
    remove,
    removeRange,
    save,
  };
};
