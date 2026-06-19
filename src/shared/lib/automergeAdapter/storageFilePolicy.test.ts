import { Repo } from '@automerge/automerge-repo';
import { describe, expect, it, vi } from 'vitest';
import { encodeStorageKeyToV2FileName } from './filenameCodecV2';
import { encodePreferredV3FileName } from './filenameCodecV3';
import {
  collectStorageFileNamesForPrefix,
  discoverStorageDocumentIds,
  isRepositoryStorageCandidateFileName,
  loadStorageChunksByPrefix,
  removeStorageEntry,
  resolveStorageChunkWriteTarget,
  saveStorageEntry,
  type StorageFilePolicyIo,
} from './storageFilePolicy';
import type { ChunkStorageKey, StorageKey } from './types';
import { partialKeyToFileName } from './partialKeyToFileName';
import { encodeV3StorageWrapper } from './wrapperCodecV3';

const HASH_A = '0df10d48afdaa0df1a484b006e4854cec8640d416745ce0cc874c07027b69cc2';
const HASH_B = '1af20e59befbb1e02b595c117f9965dfd7751e527856df1dd985d18138c7add3';
const DATA_A = new Uint8Array([1, 2, 3]);
const DATA_B = new Uint8Array([4, 5, 6]);

const getDocumentId = () => new Repo().create({}).documentId;

const createIo = (entries: Record<string, Uint8Array>): StorageFilePolicyIo => ({
  listNames: () => Promise.resolve(Object.keys(entries)),
  readBytes: (name) => Promise.resolve(entries[name]),
  writeBytes: (name, data) => {
    entries[name] = new Uint8Array(data);
    return Promise.resolve();
  },
  removeName: (name) => {
    Reflect.deleteProperty(entries, name);
    return Promise.resolve();
  },
});

describe('storageFilePolicy', () => {
  it('discovers full document ids from valid v3 wrappers', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const fileName = encodePreferredV3FileName(key);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    await expect(
      discoverStorageDocumentIds(createIo({ [fileName]: encodeV3StorageWrapper(key, DATA_A) })),
    ).resolves.toEqual([documentId]);
  });

  it('prefers valid v3 data over fallback legacy and v2 entries for the same logical key', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v3Name = encodePreferredV3FileName(key);
    const v2Name = encodeStorageKeyToV2FileName(documentId, 'snapshot', HASH_A);

    if (!v3Name || !v2Name) {
      throw new Error('Expected storage filenames');
    }

    await expect(
      loadStorageChunksByPrefix(
        createIo({
          [`${documentId}_snapshot_${HASH_A}.automerge`]: DATA_A,
          [v2Name]: DATA_B,
          [v3Name]: encodeV3StorageWrapper(key, new Uint8Array([9, 9, 9])),
        }),
        [documentId],
      ),
    ).resolves.toEqual([{ data: new Uint8Array([9, 9, 9]), key }]);
  });

  it('treats an invalid existing v3 candidate as occupied and resolves the next suffix', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const preferredName = encodePreferredV3FileName(key);

    if (!preferredName) {
      throw new Error('Expected v3 filename');
    }

    await expect(
      resolveStorageChunkWriteTarget(
        createIo({ [preferredName]: new Uint8Array([0xde, 0xad]) }),
        key,
      ),
    ).resolves.toBe(`${documentId.slice(0, 6)}.s.${HASH_A.slice(0, 8)}.1.mf`);
  });

  it('does not decode v3 files when removing the marker prefix', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_B];
    const fileName = encodePreferredV3FileName(key);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    const readBytes = vi.fn((name: string) =>
      Promise.resolve({ [fileName]: encodeV3StorageWrapper(key, DATA_A) }[name]),
    );

    await expect(
      collectStorageFileNamesForPrefix(
        {
          listNames: () => Promise.resolve([fileName]),
          readBytes,
          writeBytes: () => Promise.resolve(),
          removeName: () => Promise.resolve(),
        },
        ['storage-adapter-id'],
      ),
    ).resolves.toEqual([]);

    expect(readBytes).not.toHaveBeenCalled();
  });

  it('classifies legacy, v2, and v3 names as repository storage candidates only', () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v3Name = encodePreferredV3FileName(key);
    const v2Name = encodeStorageKeyToV2FileName(documentId, 'snapshot', HASH_A);

    if (!v3Name || !v2Name) {
      throw new Error('Expected storage filenames');
    }

    expect(isRepositoryStorageCandidateFileName(`${documentId}_snapshot_${HASH_A}.automerge`)).toBe(
      true,
    );
    expect(isRepositoryStorageCandidateFileName(v2Name)).toBe(true);
    expect(isRepositoryStorageCandidateFileName(v3Name)).toBe(true);
    expect(isRepositoryStorageCandidateFileName('notes.am')).toBe(false);
    expect(isRepositoryStorageCandidateFileName('plain.json')).toBe(false);
  });

  it('saves chunk entries through the policy-owned v3 wrapper contract', async () => {
    const documentId = getDocumentId();
    const key: StorageKey = [documentId, 'snapshot', HASH_A];
    const entries: Record<string, Uint8Array> = {};
    const io = createIo(entries);

    await saveStorageEntry(io, key, DATA_A);

    const fileName = encodePreferredV3FileName(key);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    expect(entries[fileName]).toEqual(encodeV3StorageWrapper(key, DATA_A));
  });

  it('removes every physical file that belongs to one logical chunk key', async () => {
    const documentId = getDocumentId();
    const key: StorageKey = [documentId, 'snapshot', HASH_A];
    const preferredName = encodePreferredV3FileName(key);
    const markerName =
      partialKeyToFileName(['storage-adapter-id']) ?? 'storage-adapter-id.automerge';

    if (!preferredName) {
      throw new Error('Expected v3 filename');
    }

    const entries: Record<string, Uint8Array> = {
      [preferredName]: encodeV3StorageWrapper(key, DATA_A),
      [`${documentId.slice(0, 6)}.s.${HASH_A.slice(0, 8)} - copy.mf`]: encodeV3StorageWrapper(
        key,
        DATA_A,
      ),
      [`${documentId}_snapshot_${HASH_A}.automerge`]: DATA_A,
      [markerName]: new Uint8Array([1]),
    };

    await removeStorageEntry(createIo(entries), key);

    expect(Object.keys(entries)).toEqual([markerName]);
  });
});
