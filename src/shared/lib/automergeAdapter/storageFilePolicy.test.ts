import { Repo } from '@automerge/automerge-repo';
import { describe, expect, it, vi } from 'vitest';
import { encodeStorageKeyToV2FileName } from './filenameCodecV2';
import { encodePrimaryV3FileName } from './filenameCodecV3';
import {
  collectStorageFileNamesForPrefix,
  discoverStorageDocumentIds,
  isPlausibleRepositoryStorageCandidateFileName,
  loadStorageEntriesByPrefix,
  loadStorageEntry,
  removeStorageEntriesByPrefix,
  removeStorageEntry,
  saveStorageEntry,
  V3StorageConflictError,
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

/**
 * Mutable IO with a `listNames()` call counter, used for save/remove IO-budget assertions.
 * @param entries - Backing in-memory filename-to-bytes map.
 * @returns Counting mutable IO boundary plus a `listNames()` call counter.
 */
const createCountingMutableIo = (entries: Record<string, Uint8Array>) => {
  let listNamesCalls = 0;
  let inFlightReads = 0;
  let maxConcurrentReads = 0;
  let inFlightRemoves = 0;
  let maxConcurrentRemoves = 0;
  const readCalls: string[] = [];
  const removeCalls: string[] = [];

  const io: MutableStorageFilePolicyIo = {
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
    writeBytes: (name, data) => {
      entries[name] = new Uint8Array(data);
      return Promise.resolve();
    },
    removeName: async (name) => {
      removeCalls.push(name);
      inFlightRemoves += 1;
      maxConcurrentRemoves = Math.max(maxConcurrentRemoves, inFlightRemoves);
      await Promise.resolve();
      inFlightRemoves -= 1;
      Reflect.deleteProperty(entries, name);
    },
  };

  return {
    io,
    getListNamesCalls: () => listNamesCalls,
    getReadCalls: () => readCalls,
    getRemoveCalls: () => removeCalls,
    getMaxConcurrentReads: () => maxConcurrentReads,
    getMaxConcurrentRemoves: () => maxConcurrentRemoves,
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
    const fileName = encodePrimaryV3FileName(key);

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
    const v3Name = encodePrimaryV3FileName(key);
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

  it('does not decode v3 files when removing the marker prefix', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_B];
    const fileName = encodePrimaryV3FileName(key);

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
    const v3Name = encodePrimaryV3FileName(key);
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

    const fileName = encodePrimaryV3FileName(key);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    expect(entries[fileName]).toEqual(encodeV3StorageWrapper(key, DATA_A));
  });

  it('removes the primary v3, v2, and both legacy variants for one logical chunk key', async () => {
    const documentId = getDocumentId();
    const key: StorageKey = [documentId, 'snapshot', HASH_A];
    const primaryName = encodePrimaryV3FileName(key);
    const v2Name = encodeStorageKeyToV2FileName(documentId, 'snapshot', HASH_A);
    const legacyName = `${documentId}_snapshot_${HASH_A}.automerge`;
    const extensionlessLegacyName = `${documentId}_snapshot_${HASH_A}`;
    const markerName =
      partialKeyToFileName(['storage-adapter-id']) ?? 'storage-adapter-id.automerge';

    if (!primaryName || !v2Name) {
      throw new Error('Expected v3 and v2 filenames');
    }

    const entries: Record<string, Uint8Array> = {
      [primaryName]: encodeV3StorageWrapper(key, DATA_A),
      [v2Name]: DATA_A,
      [legacyName]: DATA_A,
      [extensionlessLegacyName]: DATA_B,
      [markerName]: new Uint8Array([1]),
    };

    await removeStorageEntry(createIo(entries), key);

    expect(Object.keys(entries)).toEqual([markerName]);
  });

  it('loads every readable entry for an empty prefix without throwing', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v3Name = encodePrimaryV3FileName(key);
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
    const v3Name = encodePrimaryV3FileName(key);
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
  it('writes the primary filename without a directory-wide listNames() when it is missing', async () => {
    const documentId = getDocumentId();
    const key: StorageKey = [documentId, 'snapshot', HASH_A];
    const primaryName = encodePrimaryV3FileName(key);

    if (!primaryName) {
      throw new Error('Expected v3 filename');
    }

    const entries: Record<string, Uint8Array> = {};
    const { io, getListNamesCalls } = createCountingMutableIo(entries);

    await saveStorageEntry(io, key, DATA_A);

    expect(getListNamesCalls()).toBe(0);
    expect(entries[primaryName]).toEqual(encodeV3StorageWrapper(key, DATA_A));
  });

  it('overwrites a valid same-key primary filename without a directory-wide listNames()', async () => {
    const documentId = getDocumentId();
    const key: StorageKey = [documentId, 'snapshot', HASH_A];
    const primaryName = encodePrimaryV3FileName(key);

    if (!primaryName) {
      throw new Error('Expected v3 filename');
    }

    const entries: Record<string, Uint8Array> = {
      [primaryName]: encodeV3StorageWrapper(key, DATA_A),
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
    expect(entries[primaryName]).toEqual(encodeV3StorageWrapper(key, DATA_B));
  });

  it('does not overwrite an invalid primary target and reports a storage conflict instead of a suffix fallback', async () => {
    const documentId = getDocumentId();
    const key: StorageKey = [documentId, 'snapshot', HASH_A];
    const primaryName = encodePrimaryV3FileName(key);

    if (!primaryName) {
      throw new Error('Expected v3 filename');
    }

    const entries: Record<string, Uint8Array> = { [primaryName]: new Uint8Array([0xde, 0xad]) };
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

    await expect(saveStorageEntry(io, key, DATA_A)).rejects.toBeInstanceOf(V3StorageConflictError);

    expect(listNamesCalls).toBe(0);
    expect(entries[primaryName]).toEqual(new Uint8Array([0xde, 0xad]));
    expect(Object.keys(entries)).toEqual([primaryName]);
  });

  it('does not overwrite a valid different-key primary target and reports a storage conflict', async () => {
    const documentId = getDocumentId();
    const otherDocumentId = getDocumentId();
    const key: StorageKey = [documentId, 'snapshot', HASH_A];
    const otherKey: ChunkStorageKey = [otherDocumentId, 'snapshot', HASH_A];
    const primaryName = encodePrimaryV3FileName(key);

    if (!primaryName) {
      throw new Error('Expected v3 filename');
    }

    const entries: Record<string, Uint8Array> = {
      [primaryName]: encodeV3StorageWrapper(otherKey, DATA_B),
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

    await expect(saveStorageEntry(io, key, DATA_A)).rejects.toBeInstanceOf(V3StorageConflictError);

    expect(listNamesCalls).toBe(0);
    expect(entries[primaryName]).toEqual(encodeV3StorageWrapper(otherKey, DATA_B));
    expect(Object.keys(entries)).toEqual([primaryName]);
  });

  it('never produces a numeric-suffix generated filename for a normal save', async () => {
    const documentId = getDocumentId();
    const key: StorageKey = [documentId, 'snapshot', HASH_A];
    const primaryName = encodePrimaryV3FileName(key);

    if (!primaryName) {
      throw new Error('Expected v3 filename');
    }

    const entries: Record<string, Uint8Array> = { [primaryName]: new Uint8Array([0xde, 0xad]) };
    const io = createIo(entries);

    await saveStorageEntry(io, key, DATA_A).catch(() => undefined);

    expect(Object.keys(entries).some((name) => /\.\d+\.mf$/.test(name))).toBe(false);
  });
});

describe('storageFilePolicy remove correctness', () => {
  it('does not remove a valid v3 wrapper for a different full key even when filename-plausible', async () => {
    const documentId = getDocumentId();
    const otherDocumentId = getDocumentId();
    const keyA: StorageKey = [documentId, 'snapshot', HASH_A];
    const keyB: ChunkStorageKey = [otherDocumentId, 'snapshot', HASH_A];
    const primaryNameForA = encodePrimaryV3FileName(keyA);
    const otherKeyName = 'other1.s.123456abcdef.mf';
    const unrelatedV2Name = encodeStorageKeyToV2FileName(otherDocumentId, 'snapshot', HASH_A);
    const unrelatedLegacyName = `${otherDocumentId}_snapshot_${HASH_A}.automerge`;
    const markerName =
      partialKeyToFileName(['storage-adapter-id']) ?? 'storage-adapter-id.automerge';

    if (!primaryNameForA || !unrelatedV2Name) {
      throw new Error('Expected v3 filename');
    }

    const entries: Record<string, Uint8Array> = {
      [primaryNameForA]: encodeV3StorageWrapper(keyA, DATA_A),
      [otherKeyName]: encodeV3StorageWrapper(keyB, DATA_B),
      ['invalid001.s.123456abcdef.mf']: new Uint8Array([0xde, 0xad]),
      [unrelatedV2Name]: DATA_A,
      [unrelatedLegacyName]: DATA_B,
      [markerName]: new Uint8Array([0xff]),
    };

    await removeStorageEntry(createIo(entries), keyA);

    expect(entries[primaryNameForA]).toBeUndefined();
    expect(entries[otherKeyName]).toEqual(encodeV3StorageWrapper(keyB, DATA_B));
    expect(entries['invalid001.s.123456abcdef.mf']).toEqual(new Uint8Array([0xde, 0xad]));
    expect(entries[unrelatedV2Name]).toEqual(DATA_A);
    expect(entries[unrelatedLegacyName]).toEqual(DATA_B);
    expect(entries[markerName]).toEqual(new Uint8Array([0xff]));
  });

  it('removes a valid same-key v3 wrapper', async () => {
    const documentId = getDocumentId();
    const key: StorageKey = [documentId, 'snapshot', HASH_A];
    const primaryName = encodePrimaryV3FileName(key);

    if (!primaryName) {
      throw new Error('Expected v3 filename');
    }

    const entries: Record<string, Uint8Array> = {
      [primaryName]: encodeV3StorageWrapper(key, DATA_A),
    };

    await removeStorageEntry(createIo(entries), key);

    expect(entries[primaryName]).toBeUndefined();
  });

  it('does not blindly remove an invalid primary v3 file', async () => {
    const documentId = getDocumentId();
    const key: StorageKey = [documentId, 'snapshot', HASH_A];
    const primaryName = encodePrimaryV3FileName(key);

    if (!primaryName) {
      throw new Error('Expected v3 filename');
    }

    const entries: Record<string, Uint8Array> = { [primaryName]: new Uint8Array([0xde, 0xad]) };

    await removeStorageEntry(createIo(entries), key);

    expect(entries[primaryName]).toEqual(new Uint8Array([0xde, 0xad]));
  });

  it('does not remove an out-of-route .mf file even when its wrapper key matches', async () => {
    const documentId = getDocumentId();
    const key: StorageKey = [documentId, 'snapshot', HASH_A];
    const primaryName = encodePrimaryV3FileName(key);
    const outOfRouteName = 'dup001.s.abcdef123456.mf';

    if (!primaryName) {
      throw new Error('Expected v3 filename');
    }

    const entries: Record<string, Uint8Array> = {
      [primaryName]: encodeV3StorageWrapper(key, DATA_A),
      [outOfRouteName]: encodeV3StorageWrapper(key, DATA_B),
    };

    await removeStorageEntry(createIo(entries), key);

    expect(entries[primaryName]).toBeUndefined();
    expect(entries[outOfRouteName]).toEqual(encodeV3StorageWrapper(key, DATA_B));
  });

  it('does not read out-of-route .mf candidates during exact remove', async () => {
    const documentId = getDocumentId();
    const key: StorageKey = [documentId, 'snapshot', HASH_A];
    const primaryName = encodePrimaryV3FileName(key);
    const outOfRouteName = 'dup001.s.abcdef123456.mf';

    if (!primaryName) {
      throw new Error('Expected v3 filename');
    }

    const counters = createCountingMutableIo({
      [primaryName]: encodeV3StorageWrapper(key, DATA_A),
      [outOfRouteName]: encodeV3StorageWrapper(key, DATA_B),
    });

    await removeStorageEntry(counters.io, key);

    expect(counters.getReadCalls()).toEqual([primaryName]);
    expect(counters.getRemoveCalls()).toEqual([primaryName]);
  });

  it('lists names exactly once for exact chunk remove and bounds wrapper reads and deletes', async () => {
    const documentId = getDocumentId();
    const key: StorageKey = [documentId, 'snapshot', HASH_A];
    const primaryName = encodePrimaryV3FileName(key);
    const duplicateNames = [
      'dup001.s.abcdef123456.mf',
      'dup002.s.abcdef123457.mf',
      'dup003.s.abcdef123458.mf',
      'dup004.s.abcdef123459.mf',
      'dup005.s.abcdef12345a.mf',
    ];
    const otherKeyName = 'other1.s.123456abcdef.mf';
    const invalidName = 'invalid.s.123456abcdef.mf';
    const extensionlessLegacyName = `${documentId}_snapshot_${HASH_A}`;
    const v2Name = encodeStorageKeyToV2FileName(documentId, 'snapshot', HASH_A);

    if (!primaryName || !v2Name) {
      throw new Error('Expected storage filenames');
    }

    const entries: Record<string, Uint8Array> = {
      [primaryName]: encodeV3StorageWrapper(key, DATA_A),
      [otherKeyName]: encodeV3StorageWrapper([getDocumentId(), 'snapshot', HASH_A], DATA_B),
      [invalidName]: new Uint8Array([0xde, 0xad]),
      [v2Name]: DATA_A,
      [`${documentId}_snapshot_${HASH_A}.automerge`]: DATA_A,
      [extensionlessLegacyName]: DATA_B,
    };
    for (const [index, name] of duplicateNames.entries()) {
      entries[name] = encodeV3StorageWrapper(key, new Uint8Array([index + 10]));
    }
    const counters = createCountingMutableIo(entries);

    await removeStorageEntry(counters.io, key);

    expect(counters.getListNamesCalls()).toBe(1);
    expect(counters.getReadCalls()).toEqual([primaryName]);
    expect(counters.getMaxConcurrentReads()).toBeLessThanOrEqual(4);
    expect(counters.getMaxConcurrentRemoves()).toBeLessThanOrEqual(4);
    expect(counters.getRemoveCalls().sort()).toEqual(
      [
        primaryName,
        v2Name,
        `${documentId}_snapshot_${HASH_A}.automerge`,
        extensionlessLegacyName,
      ].sort(),
    );
    for (const name of duplicateNames) {
      expect(entries[name]).toBeDefined();
    }
    expect(entries[otherKeyName]).toBeDefined();
  });
});

describe('storageFilePolicy load fast path', () => {
  it('loads an existing primary v3 entry directly without calling listNames()', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v3Name = encodePrimaryV3FileName(key);

    if (!v3Name) {
      throw new Error('Expected v3 filename');
    }

    const { io, getListNamesCalls } = createCountingIo({
      [v3Name]: encodeV3StorageWrapper(key, DATA_A),
    });

    await expect(loadStorageEntry(io, key)).resolves.toEqual(DATA_A);
    expect(getListNamesCalls()).toBe(0);
  });

  it('falls back to v2 directly, without any listNames() scan, when primary v3 is missing', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v2Name = encodeStorageKeyToV2FileName(documentId, 'snapshot', HASH_A);

    if (!v2Name) {
      throw new Error('Expected v2 filename');
    }

    const { io, getListNamesCalls } = createCountingIo({ [v2Name]: DATA_A });

    await expect(loadStorageEntry(io, key)).resolves.toEqual(DATA_A);
    expect(getListNamesCalls()).toBe(0);
  });

  it('does not scan unrelated non-primary .mf names before v2 when the primary v3 file is simply missing', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v2Name = encodeStorageKeyToV2FileName(documentId, 'snapshot', HASH_A);

    if (!v2Name) {
      throw new Error('Expected v2 filename');
    }

    const { io, getReadCalls } = createCountingIo({ [v2Name]: DATA_A });

    await expect(loadStorageEntry(io, key)).resolves.toEqual(DATA_A);
    expect(getReadCalls()).toEqual(
      expect.not.arrayContaining([expect.stringContaining(' - copy.mf')]),
    );
  });

  it('falls back to legacy directly, without any listNames() scan, when primary v3 and v2 are both missing', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const legacyName = `${documentId}_snapshot_${HASH_A}.automerge`;

    const { io, getListNamesCalls } = createCountingIo({
      [legacyName]: DATA_A,
    });

    await expect(loadStorageEntry(io, key)).resolves.toEqual(DATA_A);
    expect(getListNamesCalls()).toBe(0);
  });

  it('returns undefined without any listNames() scan when no v3, v2, or legacy entry exists', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];

    const { io, getListNamesCalls } = createCountingIo({});

    await expect(loadStorageEntry(io, key)).resolves.toBeUndefined();
    expect(getListNamesCalls()).toBe(0);
  });

  it('returns primary v3 without scanning when both primary v3 and v2 are valid', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v3Name = encodePrimaryV3FileName(key);
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

  it('returns a storage conflict (undefined), not v2, when the primary v3 file is invalid', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v3Name = encodePrimaryV3FileName(key);
    const v2Name = encodeStorageKeyToV2FileName(documentId, 'snapshot', HASH_A);

    if (!v3Name || !v2Name) {
      throw new Error('Expected v3 and v2 filenames');
    }

    const { io, getListNamesCalls } = createCountingIo({
      [v3Name]: new Uint8Array([0xde, 0xad]),
      [v2Name]: DATA_B,
    });

    await expect(loadStorageEntry(io, key)).resolves.toBeUndefined();
    expect(getListNamesCalls()).toBe(0);
  });

  it('returns a storage conflict (undefined), not v2, when the primary v3 file belongs to a different key', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const otherKey: ChunkStorageKey = [getDocumentId(), 'snapshot', HASH_B];
    const v3Name = encodePrimaryV3FileName(key);
    const v2Name = encodeStorageKeyToV2FileName(documentId, 'snapshot', HASH_A);

    if (!v3Name || !v2Name) {
      throw new Error('Expected v3 and v2 filenames');
    }

    const { io, getListNamesCalls } = createCountingIo({
      [v3Name]: encodeV3StorageWrapper(otherKey, DATA_B),
      [v2Name]: DATA_B,
    });

    await expect(loadStorageEntry(io, key)).resolves.toBeUndefined();
    expect(getListNamesCalls()).toBe(0);
  });

  it('returns v2 when no v3 candidates exist', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v2Name = encodeStorageKeyToV2FileName(documentId, 'snapshot', HASH_A);

    if (!v2Name) {
      throw new Error('Expected v2 filename');
    }

    const { io, getListNamesCalls } = createCountingIo({ [v2Name]: DATA_A });

    await expect(loadStorageEntry(io, key)).resolves.toEqual(DATA_A);
    expect(getListNamesCalls()).toBe(0);
  });

  it('returns v2 before legacy when both exist and no v3 candidate exists', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v2Name = encodeStorageKeyToV2FileName(documentId, 'snapshot', HASH_A);
    const legacyName = `${documentId}_snapshot_${HASH_A}.automerge`;

    if (!v2Name) {
      throw new Error('Expected v2 filename');
    }

    const { io, getListNamesCalls } = createCountingIo({
      [v2Name]: DATA_A,
      [legacyName]: DATA_B,
    });

    await expect(loadStorageEntry(io, key)).resolves.toEqual(DATA_A);
    expect(getListNamesCalls()).toBe(0);
  });

  it('returns legacy when no v3 or v2 candidates exist', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const legacyName = `${documentId}_snapshot_${HASH_A}.automerge`;

    const { io, getListNamesCalls } = createCountingIo({ [legacyName]: DATA_A });

    await expect(loadStorageEntry(io, key)).resolves.toEqual(DATA_A);
    expect(getListNamesCalls()).toBe(0);
  });

  it('falls back to the extension-less legacy filename directly, without any listNames() scan, when primary v3, v2, and with-extension legacy are all missing', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const extensionlessLegacyName = partialKeyToFileName(key, { withExtension: false });

    if (!extensionlessLegacyName) {
      throw new Error('Expected extension-less legacy filename');
    }

    const { io, getListNamesCalls } = createCountingIo({ [extensionlessLegacyName]: DATA_A });

    await expect(loadStorageEntry(io, key)).resolves.toEqual(DATA_A);
    expect(getListNamesCalls()).toBe(0);
  });

  it('prefers the with-extension legacy filename over the extension-less legacy filename when both exist', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const legacyName = `${documentId}_snapshot_${HASH_A}.automerge`;
    const extensionlessLegacyName = partialKeyToFileName(key, { withExtension: false });

    if (!extensionlessLegacyName) {
      throw new Error('Expected extension-less legacy filename');
    }

    const { io, getListNamesCalls } = createCountingIo({
      [legacyName]: DATA_A,
      [extensionlessLegacyName]: DATA_B,
    });

    await expect(loadStorageEntry(io, key)).resolves.toEqual(DATA_A);
    expect(getListNamesCalls()).toBe(0);
  });
});

describe('storageFilePolicy IO budget', () => {
  it('loadStorageEntriesByPrefix calls listNames exactly once per operation', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v3Name = encodePrimaryV3FileName(key);

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
    const v3Name = encodePrimaryV3FileName(key);

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

  it('exact save never calls listNames when the primary target is missing or already owned', async () => {
    const documentId = getDocumentId();
    const key: StorageKey = [documentId, 'snapshot', HASH_A];
    const entries: Record<string, Uint8Array> = {};
    const { io, getListNamesCalls } = createCountingMutableIo(entries);

    await saveStorageEntry(io, key, DATA_A);
    await saveStorageEntry(io, key, DATA_B);

    expect(getListNamesCalls()).toBe(0);
  });

  it('exact remove calls listNames exactly once for a full chunk key cleanup pass', async () => {
    const documentId = getDocumentId();
    const key: StorageKey = [documentId, 'snapshot', HASH_A];
    const primaryName = encodePrimaryV3FileName(key);

    if (!primaryName) {
      throw new Error('Expected v3 filename');
    }

    const entries: Record<string, Uint8Array> = {
      [primaryName]: encodeV3StorageWrapper(key, DATA_A),
    };
    const { io, getListNamesCalls } = createCountingMutableIo(entries);

    await removeStorageEntry(io, key);

    expect(getListNamesCalls()).toBe(1);
  });

  it('discoverStorageDocumentIds calls listNames exactly once per operation', async () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const v3Name = encodePrimaryV3FileName(key);

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
    const v3Name = encodePrimaryV3FileName(key);

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
    const v3Name = encodePrimaryV3FileName(key);

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
    const v3Name = encodePrimaryV3FileName(key);
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
      const name = encodePrimaryV3FileName(key);

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
      const name = encodePrimaryV3FileName(key);

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
