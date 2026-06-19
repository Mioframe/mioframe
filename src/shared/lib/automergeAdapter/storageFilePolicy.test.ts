import { Repo } from '@automerge/automerge-repo';
import { describe, expect, it, vi } from 'vitest';
import { encodeStorageKeyToV2FileName } from './filenameCodecV2';
import { encodePreferredV3FileName, encodeV3FileNameWithSuffix } from './filenameCodecV3';
import {
  collectStorageFileNamesForPrefix,
  discoverStorageDocumentIds,
  isPlausibleRepositoryStorageCandidateFileName,
  loadStorageEntriesByPrefix,
  loadStorageEntry,
  removeStorageEntriesByPrefix,
  removeStorageEntry,
  resolveStorageChunkWriteTarget,
  saveStorageEntry,
  type MutableStorageFilePolicyIo,
  type ReadOnlyStorageFilePolicyIo,
} from './storageFilePolicy';
import type { ChunkStorageKey, StorageKey } from './types';
import { partialKeyToFileName } from './partialKeyToFileName';
import { encodeV3StorageWrapper } from './wrapperCodecV3';

/**
 * Read-only IO with call counters and concurrency tracking, used for IO-budget assertions.
 * @param entries - Backing in-memory filename-to-bytes map.
 * @returns Counting IO boundary plus call/concurrency inspection helpers.
 */
const createCountingIo = (entries: Record<string, Uint8Array>) => {
  let listNamesCalls = 0;
  let inFlightReads = 0;
  let maxConcurrentReads = 0;
  const readCalls: string[] = [];

  const io: ReadOnlyStorageFilePolicyIo = {
    listNames: () => {
      listNamesCalls += 1;
      return Promise.resolve(Object.keys(entries));
    },
    readBytes: async (name) => {
      readCalls.push(name);
      inFlightReads += 1;
      maxConcurrentReads = Math.max(maxConcurrentReads, inFlightReads);
      await Promise.resolve();
      inFlightReads -= 1;
      return entries[name];
    },
  };

  return {
    io,
    getListNamesCalls: () => listNamesCalls,
    getReadCalls: () => readCalls,
    getMaxConcurrentReads: () => maxConcurrentReads,
  };
};

const HASH_A = '0df10d48afdaa0df1a484b006e4854cec8640d416745ce0cc874c07027b69cc2';
const HASH_B = '1af20e59befbb1e02b595c117f9965dfd7751e527856df1dd985d18138c7add3';
const DATA_A = new Uint8Array([1, 2, 3]);
const DATA_B = new Uint8Array([4, 5, 6]);

const getDocumentId = () => new Repo().create({}).documentId;

const createReadOnlyIo = (entries: Record<string, Uint8Array>): ReadOnlyStorageFilePolicyIo => ({
  listNames: () => Promise.resolve(Object.keys(entries)),
  readBytes: (name) => Promise.resolve(entries[name]),
});

const createIo = (entries: Record<string, Uint8Array>): MutableStorageFilePolicyIo => ({
  ...createReadOnlyIo(entries),
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
      loadStorageEntriesByPrefix(
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
    ).resolves.toBe(encodeV3FileNameWithSuffix(key, 1));
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

    expect(
      isPlausibleRepositoryStorageCandidateFileName(`${documentId}_snapshot_${HASH_A}.automerge`),
    ).toBe(true);
    expect(isPlausibleRepositoryStorageCandidateFileName(v2Name)).toBe(true);
    expect(isPlausibleRepositoryStorageCandidateFileName(v3Name)).toBe(true);
    expect(isPlausibleRepositoryStorageCandidateFileName('notes.am')).toBe(false);
    expect(isPlausibleRepositoryStorageCandidateFileName('plain.json')).toBe(false);
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

  it('loads every readable entry for an empty prefix without throwing', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v3Name = encodePreferredV3FileName(key);
    const markerName =
      partialKeyToFileName(['storage-adapter-id']) ?? 'storage-adapter-id.automerge';

    if (!v3Name) {
      throw new Error('Expected v3 filename');
    }

    const entries: Record<string, Uint8Array> = {
      [v3Name]: encodeV3StorageWrapper(key, DATA_A),
      [markerName]: new Uint8Array([1]),
    };

    await expect(loadStorageEntriesByPrefix(createIo(entries), [])).resolves.toEqual(
      expect.arrayContaining([{ data: DATA_A, key }]),
    );
  });

  it('removes every physical file for an empty prefix without throwing', async () => {
    const documentId = getDocumentId();
    const key: StorageKey = [documentId, 'snapshot', HASH_A];
    const v3Name = encodePreferredV3FileName(key);
    const markerName =
      partialKeyToFileName(['storage-adapter-id']) ?? 'storage-adapter-id.automerge';

    if (!v3Name) {
      throw new Error('Expected v3 filename');
    }

    const entries: Record<string, Uint8Array> = {
      [v3Name]: encodeV3StorageWrapper(key, DATA_A),
      [markerName]: new Uint8Array([1]),
    };

    await expect(removeStorageEntriesByPrefix(createIo(entries), [])).resolves.toBeUndefined();
    expect(Object.keys(entries)).toEqual([]);
  });
});

describe('storageFilePolicy save fast path', () => {
  it('writes the preferred filename without a directory-wide listNames() when it is missing', async () => {
    const documentId = getDocumentId();
    const key: StorageKey = [documentId, 'snapshot', HASH_A];
    const preferredName = encodePreferredV3FileName(key);

    if (!preferredName) {
      throw new Error('Expected v3 filename');
    }

    const entries: Record<string, Uint8Array> = {};
    let listNamesCalls = 0;
    const io: MutableStorageFilePolicyIo = {
      listNames: () => {
        listNamesCalls += 1;
        return Promise.resolve(Object.keys(entries));
      },
      readBytes: (name) => Promise.resolve(entries[name]),
      writeBytes: (name, data) => {
        entries[name] = new Uint8Array(data);
        return Promise.resolve();
      },
      removeName: (name) => {
        Reflect.deleteProperty(entries, name);
        return Promise.resolve();
      },
    };

    await saveStorageEntry(io, key, DATA_A);

    expect(listNamesCalls).toBe(0);
    expect(entries[preferredName]).toEqual(encodeV3StorageWrapper(key, DATA_A));
  });

  it('overwrites a valid same-key preferred filename without a directory-wide listNames()', async () => {
    const documentId = getDocumentId();
    const key: StorageKey = [documentId, 'snapshot', HASH_A];
    const preferredName = encodePreferredV3FileName(key);

    if (!preferredName) {
      throw new Error('Expected v3 filename');
    }

    const entries: Record<string, Uint8Array> = {
      [preferredName]: encodeV3StorageWrapper(key, DATA_A),
    };
    let listNamesCalls = 0;
    const io: MutableStorageFilePolicyIo = {
      listNames: () => {
        listNamesCalls += 1;
        return Promise.resolve(Object.keys(entries));
      },
      readBytes: (name) => Promise.resolve(entries[name]),
      writeBytes: (name, data) => {
        entries[name] = new Uint8Array(data);
        return Promise.resolve();
      },
      removeName: (name) => {
        Reflect.deleteProperty(entries, name);
        return Promise.resolve();
      },
    };

    await saveStorageEntry(io, key, DATA_B);

    expect(listNamesCalls).toBe(0);
    expect(entries[preferredName]).toEqual(encodeV3StorageWrapper(key, DATA_B));
  });

  it('does not overwrite an invalid preferred target and falls back after a fresh listing', async () => {
    const documentId = getDocumentId();
    const key: StorageKey = [documentId, 'snapshot', HASH_A];
    const preferredName = encodePreferredV3FileName(key);

    if (!preferredName) {
      throw new Error('Expected v3 filename');
    }

    const entries: Record<string, Uint8Array> = { [preferredName]: new Uint8Array([0xde, 0xad]) };
    let listNamesCalls = 0;
    const io: MutableStorageFilePolicyIo = {
      listNames: () => {
        listNamesCalls += 1;
        return Promise.resolve(Object.keys(entries));
      },
      readBytes: (name) => Promise.resolve(entries[name]),
      writeBytes: (name, data) => {
        entries[name] = new Uint8Array(data);
        return Promise.resolve();
      },
      removeName: (name) => {
        Reflect.deleteProperty(entries, name);
        return Promise.resolve();
      },
    };

    await saveStorageEntry(io, key, DATA_A);

    expect(listNamesCalls).toBe(1);
    expect(entries[preferredName]).toEqual(new Uint8Array([0xde, 0xad]));

    const fallbackName = encodeV3FileNameWithSuffix(key, 1);

    if (!fallbackName) {
      throw new Error('Expected fallback filename');
    }

    expect(entries[fallbackName]).toEqual(encodeV3StorageWrapper(key, DATA_A));
  });

  it('does not overwrite a valid different-key preferred target and falls back after a fresh listing', async () => {
    const documentId = getDocumentId();
    const otherDocumentId = getDocumentId();
    const key: StorageKey = [documentId, 'snapshot', HASH_A];
    const otherKey: ChunkStorageKey = [otherDocumentId, 'snapshot', HASH_A];
    const preferredName = encodePreferredV3FileName(key);

    if (!preferredName) {
      throw new Error('Expected v3 filename');
    }

    const entries: Record<string, Uint8Array> = {
      [preferredName]: encodeV3StorageWrapper(otherKey, DATA_B),
    };
    let listNamesCalls = 0;
    const io: MutableStorageFilePolicyIo = {
      listNames: () => {
        listNamesCalls += 1;
        return Promise.resolve(Object.keys(entries));
      },
      readBytes: (name) => Promise.resolve(entries[name]),
      writeBytes: (name, data) => {
        entries[name] = new Uint8Array(data);
        return Promise.resolve();
      },
      removeName: (name) => {
        Reflect.deleteProperty(entries, name);
        return Promise.resolve();
      },
    };

    await saveStorageEntry(io, key, DATA_A);

    expect(listNamesCalls).toBe(1);
    expect(entries[preferredName]).toEqual(encodeV3StorageWrapper(otherKey, DATA_B));

    const fallbackName = encodeV3FileNameWithSuffix(key, 1);

    if (!fallbackName) {
      throw new Error('Expected fallback filename');
    }

    expect(entries[fallbackName]).toEqual(encodeV3StorageWrapper(key, DATA_A));
  });
});

describe('storageFilePolicy remove correctness', () => {
  it('does not remove a valid v3 wrapper for a different full key even when filename-plausible', async () => {
    const documentId = getDocumentId();
    const otherDocumentId = getDocumentId();
    const keyA: StorageKey = [documentId, 'snapshot', HASH_A];
    const keyB: ChunkStorageKey = [otherDocumentId, 'snapshot', HASH_A];
    const preferredNameForA = encodePreferredV3FileName(keyA);

    if (!preferredNameForA) {
      throw new Error('Expected v3 filename');
    }

    const entries: Record<string, Uint8Array> = {
      [preferredNameForA]: encodeV3StorageWrapper(keyB, DATA_B),
    };

    await removeStorageEntry(createIo(entries), keyA);

    expect(entries[preferredNameForA]).toEqual(encodeV3StorageWrapper(keyB, DATA_B));
  });

  it('removes a valid same-key v3 wrapper', async () => {
    const documentId = getDocumentId();
    const key: StorageKey = [documentId, 'snapshot', HASH_A];
    const preferredName = encodePreferredV3FileName(key);

    if (!preferredName) {
      throw new Error('Expected v3 filename');
    }

    const entries: Record<string, Uint8Array> = {
      [preferredName]: encodeV3StorageWrapper(key, DATA_A),
    };

    await removeStorageEntry(createIo(entries), key);

    expect(entries[preferredName]).toBeUndefined();
  });

  it('removes invalid same-family candidates that are only filename-plausible garbage', async () => {
    const documentId = getDocumentId();
    const key: StorageKey = [documentId, 'snapshot', HASH_A];
    const preferredName = encodePreferredV3FileName(key);

    if (!preferredName) {
      throw new Error('Expected v3 filename');
    }

    const entries: Record<string, Uint8Array> = { [preferredName]: new Uint8Array([0xde, 0xad]) };

    await removeStorageEntry(createIo(entries), key);

    expect(entries[preferredName]).toBeUndefined();
  });
});

describe('storageFilePolicy load fast path', () => {
  it('loads an existing preferred v3 entry directly without calling listNames()', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v3Name = encodePreferredV3FileName(key);

    if (!v3Name) {
      throw new Error('Expected v3 filename');
    }

    const { io, getListNamesCalls } = createCountingIo({
      [v3Name]: encodeV3StorageWrapper(key, DATA_A),
    });

    await expect(loadStorageEntry(io, key)).resolves.toEqual(DATA_A);
    expect(getListNamesCalls()).toBe(0);
  });

  it('falls back to v2 after a single listNames() scan when preferred v3 is missing', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v2Name = encodeStorageKeyToV2FileName(documentId, 'snapshot', HASH_A);

    if (!v2Name) {
      throw new Error('Expected v2 filename');
    }

    const { io, getListNamesCalls } = createCountingIo({ [v2Name]: DATA_A });

    await expect(loadStorageEntry(io, key)).resolves.toEqual(DATA_A);
    expect(getListNamesCalls()).toBe(1);
  });

  it('falls back to a directory scan for manual/suffixed v3 and legacy candidates', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const suffixedName = encodeV3FileNameWithSuffix(key, 1);

    if (!suffixedName) {
      throw new Error('Expected suffixed v3 filename');
    }

    const { io, getListNamesCalls } = createCountingIo({
      [suffixedName]: encodeV3StorageWrapper(key, DATA_A),
    });

    await expect(loadStorageEntry(io, key)).resolves.toEqual(DATA_A);
    expect(getListNamesCalls()).toBe(1);
  });

  it('returns preferred v3 without scanning when both preferred v3 and v2 are valid', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v3Name = encodePreferredV3FileName(key);
    const v2Name = encodeStorageKeyToV2FileName(documentId, 'snapshot', HASH_A);

    if (!v3Name || !v2Name) {
      throw new Error('Expected v3 and v2 filenames');
    }

    const { io, getListNamesCalls } = createCountingIo({
      [v3Name]: encodeV3StorageWrapper(key, DATA_A),
      [v2Name]: DATA_B,
    });

    await expect(loadStorageEntry(io, key)).resolves.toEqual(DATA_A);
    expect(getListNamesCalls()).toBe(0);
  });

  it('returns a valid suffixed v3 candidate, not v2, when the preferred v3 file is invalid', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v3Name = encodePreferredV3FileName(key);
    const suffixedName = encodeV3FileNameWithSuffix(key, 1);
    const v2Name = encodeStorageKeyToV2FileName(documentId, 'snapshot', HASH_A);

    if (!v3Name || !suffixedName || !v2Name) {
      throw new Error('Expected v3 and v2 filenames');
    }

    const { io } = createCountingIo({
      [v3Name]: new Uint8Array([0xde, 0xad]),
      [suffixedName]: encodeV3StorageWrapper(key, DATA_A),
      [v2Name]: DATA_B,
    });

    await expect(loadStorageEntry(io, key)).resolves.toEqual(DATA_A);
  });

  it('returns a valid same-key suffixed v3 candidate, not v2, when the preferred v3 file belongs to a different key', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const otherKey: ChunkStorageKey = [getDocumentId(), 'snapshot', HASH_B];
    const v3Name = encodePreferredV3FileName(key);
    const suffixedName = encodeV3FileNameWithSuffix(key, 1);
    const v2Name = encodeStorageKeyToV2FileName(documentId, 'snapshot', HASH_A);

    if (!v3Name || !suffixedName || !v2Name) {
      throw new Error('Expected v3 and v2 filenames');
    }

    const { io } = createCountingIo({
      [v3Name]: encodeV3StorageWrapper(otherKey, DATA_B),
      [suffixedName]: encodeV3StorageWrapper(key, DATA_A),
      [v2Name]: DATA_B,
    });

    await expect(loadStorageEntry(io, key)).resolves.toEqual(DATA_A);
  });

  it('returns a valid suffixed v3 candidate, not v2, when the preferred v3 file is missing', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const suffixedName = encodeV3FileNameWithSuffix(key, 1);
    const v2Name = encodeStorageKeyToV2FileName(documentId, 'snapshot', HASH_A);

    if (!suffixedName || !v2Name) {
      throw new Error('Expected v3 and v2 filenames');
    }

    const { io, getListNamesCalls } = createCountingIo({
      [suffixedName]: encodeV3StorageWrapper(key, DATA_A),
      [v2Name]: DATA_B,
    });

    await expect(loadStorageEntry(io, key)).resolves.toEqual(DATA_A);
    expect(getListNamesCalls()).toBe(1);
  });

  it('returns v2 when no v3 candidates exist', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v2Name = encodeStorageKeyToV2FileName(documentId, 'snapshot', HASH_A);

    if (!v2Name) {
      throw new Error('Expected v2 filename');
    }

    const { io } = createCountingIo({ [v2Name]: DATA_A });

    await expect(loadStorageEntry(io, key)).resolves.toEqual(DATA_A);
  });

  it('returns v2 before legacy when both exist and no v3 candidate exists', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v2Name = encodeStorageKeyToV2FileName(documentId, 'snapshot', HASH_A);
    const legacyName = `${documentId}_snapshot_${HASH_A}.automerge`;

    if (!v2Name) {
      throw new Error('Expected v2 filename');
    }

    const { io } = createCountingIo({
      [v2Name]: DATA_A,
      [legacyName]: DATA_B,
    });

    await expect(loadStorageEntry(io, key)).resolves.toEqual(DATA_A);
  });

  it('returns legacy when no v3 or v2 candidates exist', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const legacyName = `${documentId}_snapshot_${HASH_A}.automerge`;

    const { io } = createCountingIo({ [legacyName]: DATA_A });

    await expect(loadStorageEntry(io, key)).resolves.toEqual(DATA_A);
  });
});

describe('storageFilePolicy IO budget', () => {
  it('loadStorageEntriesByPrefix calls listNames exactly once per operation', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v3Name = encodePreferredV3FileName(key);

    if (!v3Name) {
      throw new Error('Expected v3 filename');
    }

    const { io, getListNamesCalls } = createCountingIo({
      [v3Name]: encodeV3StorageWrapper(key, DATA_A),
      [encodeStorageKeyToV2FileName(documentId, 'snapshot', HASH_A) ?? '']: DATA_B,
    });

    await loadStorageEntriesByPrefix(io, [documentId]);

    expect(getListNamesCalls()).toBe(1);
  });

  it('removeStorageEntriesByPrefix calls listNames exactly once per operation', async () => {
    const documentId = getDocumentId();
    const key: StorageKey = [documentId, 'snapshot', HASH_A];
    const v3Name = encodePreferredV3FileName(key);

    if (!v3Name) {
      throw new Error('Expected v3 filename');
    }

    const entries: Record<string, Uint8Array> = { [v3Name]: encodeV3StorageWrapper(key, DATA_A) };
    let listNamesCalls = 0;
    const io: MutableStorageFilePolicyIo = {
      listNames: () => {
        listNamesCalls += 1;
        return Promise.resolve(Object.keys(entries));
      },
      readBytes: (name) => Promise.resolve(entries[name]),
      writeBytes: (name, data) => {
        entries[name] = new Uint8Array(data);
        return Promise.resolve();
      },
      removeName: (name) => {
        Reflect.deleteProperty(entries, name);
        return Promise.resolve();
      },
    };

    await removeStorageEntriesByPrefix(io, [documentId]);

    expect(listNamesCalls).toBe(1);
  });

  it('discoverStorageDocumentIds calls listNames exactly once per operation', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v3Name = encodePreferredV3FileName(key);

    if (!v3Name) {
      throw new Error('Expected v3 filename');
    }

    const { io, getListNamesCalls } = createCountingIo({
      [v3Name]: encodeV3StorageWrapper(key, DATA_A),
    });

    await discoverStorageDocumentIds(io);

    expect(getListNamesCalls()).toBe(1);
  });

  it('sequential discovery calls fetch fresh listings instead of reusing a stale one', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v3Name = encodePreferredV3FileName(key);

    if (!v3Name) {
      throw new Error('Expected v3 filename');
    }

    const entries: Record<string, Uint8Array> = {};
    const { io, getListNamesCalls } = createCountingIo(entries);

    await expect(discoverStorageDocumentIds(io)).resolves.toEqual([]);

    entries[v3Name] = encodeV3StorageWrapper(key, DATA_A);

    await expect(discoverStorageDocumentIds(io)).resolves.toEqual([documentId]);
    expect(getListNamesCalls()).toBe(2);
  });

  it('sequential range loads fetch fresh listings instead of reusing a stale one', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v3Name = encodePreferredV3FileName(key);

    if (!v3Name) {
      throw new Error('Expected v3 filename');
    }

    const entries: Record<string, Uint8Array> = {};
    const { io, getListNamesCalls } = createCountingIo(entries);

    await expect(loadStorageEntriesByPrefix(io, [documentId])).resolves.toEqual([]);

    entries[v3Name] = encodeV3StorageWrapper(key, DATA_A);

    await expect(loadStorageEntriesByPrefix(io, [documentId])).resolves.toEqual([
      { data: DATA_A, key },
    ]);
    expect(getListNamesCalls()).toBe(2);
  });

  it('discovery reads only plausible v3 candidates and never reads v2/legacy bytes', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v3Name = encodePreferredV3FileName(key);
    const v2Name = encodeStorageKeyToV2FileName(documentId, 'snapshot', HASH_A);
    const legacyName = `${documentId}_snapshot_${HASH_A}.automerge`;

    if (!v3Name || !v2Name) {
      throw new Error('Expected storage filenames');
    }

    const { io, getReadCalls } = createCountingIo({
      [v3Name]: encodeV3StorageWrapper(key, DATA_A),
      [v2Name]: DATA_B,
      [legacyName]: DATA_B,
      'notes.txt': DATA_B,
    });

    await discoverStorageDocumentIds(io);

    expect(getReadCalls()).toEqual([v3Name]);
  });

  it('reads independent v3 wrapper candidates with bounded concurrency', async () => {
    const documentId = getDocumentId();
    const entries: Record<string, Uint8Array> = {};

    for (let i = 0; i < 12; i++) {
      const key: ChunkStorageKey = [documentId, 'snapshot', `${HASH_A.slice(0, 60)}${i}aaa`];
      const name = encodePreferredV3FileName(key);

      if (!name) {
        throw new Error('Expected v3 filename');
      }

      entries[name] = encodeV3StorageWrapper(key, DATA_A);
    }

    const { io, getMaxConcurrentReads } = createCountingIo(entries);

    await loadStorageEntriesByPrefix(io, [documentId]);

    expect(getMaxConcurrentReads()).toBeGreaterThan(0);
    expect(getMaxConcurrentReads()).toBeLessThanOrEqual(4);
  });

  it('removeRange removes only matching v3 wrapper files with bounded concurrency', async () => {
    const documentId = getDocumentId();
    const entries: Record<string, Uint8Array> = {};
    const removedNames: string[] = [];
    let inFlightRemovals = 0;
    let maxConcurrentRemovals = 0;

    for (let i = 0; i < 8; i++) {
      const key: StorageKey = [documentId, 'snapshot', `${HASH_A.slice(0, 60)}${i}aaa`];
      const name = encodePreferredV3FileName(key);

      if (!name) {
        throw new Error('Expected v3 filename');
      }

      entries[name] = encodeV3StorageWrapper(key, DATA_A);
    }

    entries['unrelated-noise.mf'] = new Uint8Array([0xde, 0xad]);

    const io: MutableStorageFilePolicyIo = {
      listNames: () => Promise.resolve(Object.keys(entries)),
      readBytes: (name) => Promise.resolve(entries[name]),
      writeBytes: (name, data) => {
        entries[name] = new Uint8Array(data);
        return Promise.resolve();
      },
      removeName: async (name) => {
        inFlightRemovals += 1;
        maxConcurrentRemovals = Math.max(maxConcurrentRemovals, inFlightRemovals);
        await Promise.resolve();
        inFlightRemovals -= 1;
        removedNames.push(name);
        Reflect.deleteProperty(entries, name);
      },
    };

    await removeStorageEntriesByPrefix(io, [documentId]);

    expect(removedNames).toHaveLength(8);
    expect(Object.keys(entries)).toEqual(['unrelated-noise.mf']);
    expect(maxConcurrentRemovals).toBeGreaterThan(0);
    expect(maxConcurrentRemovals).toBeLessThanOrEqual(4);
  });
});
