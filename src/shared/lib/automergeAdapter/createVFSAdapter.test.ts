import { Repo } from '@automerge/automerge-repo';
import { describe, expect, it, vi } from 'vitest';
import { FileSystemError, VirtualFileSystem, VfsError } from '../virtualFileSystem';
import { MemoryFileSystem } from '../virtualFileSystem/MemoryFileSystem';
import { createVFSAdapter } from './createVFSAdapter';
import { encodeStorageKeyToV2FileName } from './filenameCodecV2';
import { encodePrimaryV3FileName, V3_MAX_FILE_NAME_LENGTH } from './filenameCodecV3';
import { partialKeyToFileName } from './partialKeyToFileName';
import type { StorageKey } from './types';
import { decodeV3StorageWrapper, encodeV3StorageWrapper } from './wrapperCodecV3';

// Real 64-char hex hash (SHA-256 shape) used throughout the codec tests.
const HASH_A = '0df10d48afdaa0df1a484b006e4854cec8640d416745ce0cc874c07027b69cc2';
const HASH_B = '1af20e59befbb1e02b595c117f9965dfd7751e527856df1dd985d18138c7add3';

// Obtain a valid Automerge document ID so the StorageKey types are satisfied.
const getDocumentId = () => new Repo().create({}).documentId;

const DATA_A = new Uint8Array([1, 2, 3]);
const DATA_B = new Uint8Array([4, 5, 6]);
const EMPTY_DATA = new Uint8Array();

const requireV2Name = (docId: string, kind: 'snapshot' | 'incremental', hash: string): string => {
  const name = encodeStorageKeyToV2FileName(docId, kind, hash);
  if (!name) throw new Error('Expected v2 filename to be defined');
  return name;
};

const setupVfs = async (): Promise<{ vfs: VirtualFileSystem; path: string }> => {
  const vfs = new VirtualFileSystem();
  const path = '/repo';
  vfs.mount('/', new MemoryFileSystem());
  await vfs.createDirectory(path);
  return { vfs, path };
};

const trackDeleteConcurrency = (vfs: VirtualFileSystem) => {
  const originalDelete = vfs.delete.bind(vfs);
  let inFlightDeletes = 0;
  let maxConcurrentDeletes = 0;
  const deletedPaths: string[] = [];

  const deleteSpy = vi
    .spyOn(vfs, 'delete')
    .mockImplementation(async (targetPath: string): Promise<void> => {
      deletedPaths.push(targetPath);
      inFlightDeletes += 1;
      maxConcurrentDeletes = Math.max(maxConcurrentDeletes, inFlightDeletes);
      await Promise.resolve();
      inFlightDeletes -= 1;
      return originalDelete(targetPath);
    });

  return {
    deleteSpy,
    getDeletedPaths: () => deletedPaths,
    getMaxConcurrentDeletes: () => maxConcurrentDeletes,
  };
};

describe('createVFSAdapter – save uses v3 mioframe filenames', () => {
  it('saves snapshot chunks using the v3 mioframe .mf filename format', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    const fileName = encodePrimaryV3FileName(key);
    if (!fileName) throw new Error('Expected v3 filename');

    const adapter = createVFSAdapter(vfs, path);
    await adapter.save(key, DATA_A);

    const entries = await vfs.readDirectory(path);
    const names = entries.map(([name]) => name);

    expect(names).toContain(fileName);
  });

  it('saves an incremental with a short v3 filename', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'incremental', HASH_B];
    const fileName = encodePrimaryV3FileName(key);
    if (!fileName) throw new Error('Expected v3 filename');

    const adapter = createVFSAdapter(vfs, path);
    await adapter.save(key, DATA_B);

    const entries = await vfs.readDirectory(path);
    const names = entries.map(([name]) => name);
    expect(names).toContain(fileName);
  });

  it('wraps v3 files and load returns the original Automerge bytes, not the wrapper bytes', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];

    const adapter = createVFSAdapter(vfs, path);
    await adapter.save(key, DATA_A);

    const fileName = encodePrimaryV3FileName(key);
    if (!fileName) throw new Error('Expected v3 filename');

    const storedBytes = await vfs.readFile(`${path}/${fileName}`);
    const wrappedBytes = new Uint8Array(await storedBytes.arrayBuffer());

    expect(wrappedBytes).not.toEqual(DATA_A);
    expect(decodeV3StorageWrapper(wrappedBytes)).toEqual({ key, data: DATA_A });
    await expect(adapter.load(key)).resolves.toEqual(DATA_A);
  });

  it('keeps generated v3 filenames under the hard cap and without a hash prefix', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];

    const adapter = createVFSAdapter(vfs, path);
    await adapter.save(key, DATA_A);

    const names = (await vfs.readDirectory(path)).map(([name]) => name);
    expect(names[0]?.length).toBeLessThanOrEqual(V3_MAX_FILE_NAME_LENGTH);
    expect(names[0]).not.toContain(HASH_A.slice(0, 8));
  });

  it('uses the full-key fingerprint to avoid colliding on a shared doc prefix', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const keyA: StorageKey = [docId, 'snapshot', HASH_A];
    const keyB: StorageKey = [
      docId,
      'snapshot',
      `${HASH_A.slice(0, 8)}ffffffffffffffffffffffffffffffffffffffffffffffffffffffff`,
    ];
    const nameA = encodePrimaryV3FileName(keyA);
    const nameB = encodePrimaryV3FileName(keyB);
    if (!nameA || !nameB) throw new Error('Expected v3 filenames');

    const adapter = createVFSAdapter(vfs, path);
    await adapter.save(keyA, DATA_A);
    await adapter.save(keyB, DATA_B);

    const names = (await vfs.readDirectory(path)).map(([name]) => name).sort();
    expect(nameA).not.toBe(nameB);
    expect(names).toContain(nameA);
    expect(names).toContain(nameB);
  });

  it('treats an invalid existing .mf file as occupied and reports a storage conflict instead of a suffix fallback', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    const primaryName = encodePrimaryV3FileName(key);
    if (!primaryName) throw new Error('Expected v3 filename');
    await vfs.writeFile(`${path}/${primaryName}`, new Uint8Array([0xde, 0xad]));

    const adapter = createVFSAdapter(vfs, path);

    await expect(adapter.save(key, DATA_A)).rejects.toThrow();

    const invalidBytes = new Uint8Array(
      await (await vfs.readFile(`${path}/${primaryName}`)).arrayBuffer(),
    );

    expect(invalidBytes).toEqual(new Uint8Array([0xde, 0xad]));
    expect(await adapter.load(key)).toBeUndefined();
    expect(await vfs.readDirectory(path)).toHaveLength(1);
  });

  it('overwrites a valid same-key .mf file', async () => {
    const { vfs, path } = await setupVfs();
    const key: StorageKey = [getDocumentId(), 'snapshot', HASH_A];

    const adapter = createVFSAdapter(vfs, path);
    await adapter.save(key, DATA_A);
    await adapter.save(key, DATA_B);

    expect(await adapter.load(key)).toEqual(DATA_B);
    expect(await vfs.readDirectory(path)).toHaveLength(1);
  });

  it('does not write empty chunk data as a v3 storage file', async () => {
    const { vfs, path } = await setupVfs();
    const key: StorageKey = [getDocumentId(), 'snapshot', HASH_A];

    const adapter = createVFSAdapter(vfs, path);
    await adapter.save(key, EMPTY_DATA);

    expect(await vfs.readDirectory(path)).toHaveLength(0);
  });
});

describe('createVFSAdapter – load reads legacy files', () => {
  it('loads data from a pre-existing legacy snapshot file', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const legacyName = `${docId}_snapshot_${HASH_A}.automerge`;
    await vfs.writeFile(`${path}/${legacyName}`, DATA_A);

    const adapter = createVFSAdapter(vfs, path);
    const result = await adapter.load([docId, 'snapshot', HASH_A]);

    expect(result).toEqual(DATA_A);
  });

  it('loads data from a v2 snapshot file', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const v2Name = requireV2Name(docId, 'snapshot', HASH_A);
    await vfs.writeFile(`${path}/${v2Name}`, DATA_A);

    const adapter = createVFSAdapter(vfs, path);
    const result = await adapter.load([docId, 'snapshot', HASH_A]);

    expect(result).toEqual(DATA_A);
  });

  it('loads data from a v3 wrapper file', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    const fileName = encodePrimaryV3FileName(key);
    if (!fileName) throw new Error('Expected v3 filename');
    await vfs.writeFile(`${path}/${fileName}`, encodeV3StorageWrapper(key, DATA_A));

    const adapter = createVFSAdapter(vfs, path);
    const result = await adapter.load(key);

    expect(result).toEqual(DATA_A);
  });

  it('returns undefined for a missing key', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const adapter = createVFSAdapter(vfs, path);

    const result = await adapter.load([docId, 'snapshot', HASH_A]);

    expect(result).toBeUndefined();
  });

  it('reads a primary v3 full-key file directly without scanning the directory', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    const v3Name = encodePrimaryV3FileName(key);
    if (!v3Name) throw new Error('Expected v3 filename');
    await vfs.writeFile(`${path}/${v3Name}`, encodeV3StorageWrapper(key, DATA_A));
    const readDirectorySpy = vi.spyOn(vfs, 'readDirectory');

    const adapter = createVFSAdapter(vfs, path);
    const result = await adapter.load(key);

    expect(result).toEqual(DATA_A);
    expect(readDirectorySpy).not.toHaveBeenCalled();
  });

  it('reads the released legacy file directly, without scanning the directory, when primary v3 read misses', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const legacyName = `${docId}_snapshot_${HASH_A}.automerge`;
    await vfs.writeFile(`${path}/${legacyName}`, DATA_A);
    const readDirectorySpy = vi.spyOn(vfs, 'readDirectory');

    const adapter = createVFSAdapter(vfs, path);
    const result = await adapter.load([docId, 'snapshot', HASH_A]);

    expect(result).toEqual(DATA_A);
    expect(readDirectorySpy).not.toHaveBeenCalled();
  });

  it('exact load reads an extension-less legacy file directly without scanning the directory', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const extensionlessLegacyName = `${docId}_snapshot_${HASH_A}`;
    const readDirectorySpy = vi.spyOn(vfs, 'readDirectory');
    await vfs.writeFile(`${path}/${extensionlessLegacyName}`, DATA_A);

    const adapter = createVFSAdapter(vfs, path);
    const result = await adapter.load([docId, 'snapshot', HASH_A]);

    expect(result).toEqual(DATA_A);
    expect(readDirectorySpy).not.toHaveBeenCalled();
  });

  it('prefers a valid v3 file over legacy when both exist for the same full key', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    const v3Name = encodePrimaryV3FileName(key);
    if (!v3Name) throw new Error('Expected v3 filename');
    const legacyName = `${docId}_snapshot_${HASH_A}.automerge`;
    const v3Data = new Uint8Array([40, 50, 60]);
    const legacyData = new Uint8Array([10, 20, 30]);
    await vfs.writeFile(`${path}/${legacyName}`, legacyData);
    await vfs.writeFile(`${path}/${v3Name}`, encodeV3StorageWrapper(key, v3Data));
    const readDirectorySpy = vi.spyOn(vfs, 'readDirectory');

    const adapter = createVFSAdapter(vfs, path);
    const result = await adapter.load(key);

    expect(result).toEqual(v3Data);
    expect(readDirectorySpy).not.toHaveBeenCalled();
  });

  it('still discovers externally created extension-less files through range scanning', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    const scanOnlyLegacyName = `${docId}_snapshot_${HASH_A}`;
    await vfs.writeFile(`${path}/${scanOnlyLegacyName}`, DATA_A);

    const adapter = createVFSAdapter(vfs, path);
    const result = await adapter.loadRange([docId]);

    expect(result).toEqual(expect.arrayContaining([{ data: DATA_A, key }]));
  });

  it('reads the with-extension legacy file directly without scanning when both extension variants exist', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const legacyNameWithExtension = `${docId}_snapshot_${HASH_A}.automerge`;
    const legacyNameWithoutExtension = `${docId}_snapshot_${HASH_A}`;
    await vfs.writeFile(`${path}/${legacyNameWithExtension}`, DATA_A);
    await vfs.writeFile(`${path}/${legacyNameWithoutExtension}`, DATA_B);
    const readDirectorySpy = vi.spyOn(vfs, 'readDirectory');

    const adapter = createVFSAdapter(vfs, path);
    const result = await adapter.load([docId, 'snapshot', HASH_A]);

    expect(result).toEqual(DATA_A);
    expect(readDirectorySpy).not.toHaveBeenCalled();
  });

  it('falls back to released legacy data when primary v3 and v2 are both missing', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    await vfs.writeFile(`${path}/${docId}_snapshot_${HASH_A}.automerge`, DATA_A);

    const adapter = createVFSAdapter(vfs, path);
    const result = await adapter.load(key);

    expect(result).toEqual(DATA_A);
  });

  it('reports a storage conflict, not a v2 fallback, when the primary v3 file is invalid', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    const v2Name = requireV2Name(docId, 'snapshot', HASH_A);
    const primaryName = encodePrimaryV3FileName(key);
    if (!primaryName) throw new Error('Expected v3 filename');
    await vfs.writeFile(`${path}/${primaryName}`, new Uint8Array([0xde, 0xad]));
    await vfs.writeFile(`${path}/${v2Name}`, DATA_A);

    const adapter = createVFSAdapter(vfs, path);
    const result = await adapter.load(key);

    expect(result).toBeUndefined();
  });

  it('skips empty v2 files instead of returning invalid empty data', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    const v2Name = requireV2Name(docId, 'snapshot', HASH_A);
    await vfs.writeFile(`${path}/${v2Name}`, EMPTY_DATA);

    const adapter = createVFSAdapter(vfs, path);
    const result = await adapter.load(key);

    expect(result).toBeUndefined();
  });

  it('skips empty legacy files instead of returning invalid empty data', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    await vfs.writeFile(`${path}/${docId}_snapshot_${HASH_A}.automerge`, EMPTY_DATA);

    const adapter = createVFSAdapter(vfs, path);
    expect(await adapter.load(key)).toBeUndefined();
  });

  it('ignores copied/manual compatibility-style .mf names when their wrapper key matches', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    await vfs.writeFile(
      `${path}/${docId.slice(0, 6)}.s.${HASH_A.slice(0, 8)} (1).mf`,
      encodeV3StorageWrapper(key, DATA_A),
    );

    const adapter = createVFSAdapter(vfs, path);
    expect(await adapter.load(key)).toBeUndefined();
  });

  it('ignores unrelated .mf files and still falls back to valid legacy data', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    await vfs.writeFile(
      `${path}/${docId.slice(0, 6)}.s.${HASH_A.slice(0, 8)}.mf`,
      encodeV3StorageWrapper([docId, 'snapshot', HASH_B], DATA_B),
    );
    await vfs.writeFile(`${path}/${docId}_snapshot_${HASH_A}.automerge`, DATA_A);

    const adapter = createVFSAdapter(vfs, path);
    expect(await adapter.load(key)).toEqual(DATA_A);
  });

  it('exact remove lists once, removes every same-key physical file, and leaves invalid or different-key .mf files', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const otherDocId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
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
    const v2Name = requireV2Name(docId, 'snapshot', HASH_A);

    if (!primaryName) throw new Error('Expected v3 filename');

    await Promise.all([
      vfs.writeFile(`${path}/${primaryName}`, encodeV3StorageWrapper(key, DATA_A)),
      ...duplicateNames.map((name, index) =>
        vfs.writeFile(`${path}/${name}`, encodeV3StorageWrapper(key, new Uint8Array([index + 10]))),
      ),
      vfs.writeFile(
        `${path}/${otherKeyName}`,
        encodeV3StorageWrapper([otherDocId, 'snapshot', HASH_A], DATA_B),
      ),
      vfs.writeFile(`${path}/${invalidName}`, new Uint8Array([0xde, 0xad])),
      vfs.writeFile(`${path}/${v2Name}`, DATA_A),
      vfs.writeFile(`${path}/${docId}_snapshot_${HASH_A}.automerge`, DATA_A),
      vfs.writeFile(`${path}/${docId}_snapshot_${HASH_A}`, DATA_B),
    ]);
    const readDirectorySpy = vi.spyOn(vfs, 'readDirectory');
    const { getDeletedPaths, getMaxConcurrentDeletes } = trackDeleteConcurrency(vfs);

    const adapter = createVFSAdapter(vfs, path);
    await adapter.remove(key);

    expect(readDirectorySpy).toHaveBeenCalledTimes(1);
    expect(getMaxConcurrentDeletes()).toBeLessThanOrEqual(4);
    expect(
      getDeletedPaths()
        .map((target) => target.slice(path.length + 1))
        .sort(),
    ).toEqual(
      [
        primaryName,
        ...duplicateNames,
        v2Name,
        `${docId}_snapshot_${HASH_A}.automerge`,
        `${docId}_snapshot_${HASH_A}`,
      ].sort(),
    );

    const remainingNames = (await vfs.readDirectory(path)).map(([name]) => name).sort();
    expect(remainingNames).toEqual([invalidName, otherKeyName].sort());
  });
});

describe('createVFSAdapter – loadRange handles both legacy and v2 files', () => {
  it('returns all legacy snapshot files for a doc', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const legacyName = `${docId}_snapshot_${HASH_A}.automerge`;
    await vfs.writeFile(`${path}/${legacyName}`, DATA_A);

    const adapter = createVFSAdapter(vfs, path);
    const chunks = await adapter.loadRange([docId]);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.data).toEqual(DATA_A);
  });

  it('returns all v2 snapshot files for a doc', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const v2Name = requireV2Name(docId, 'snapshot', HASH_A);
    await vfs.writeFile(`${path}/${v2Name}`, DATA_A);

    const adapter = createVFSAdapter(vfs, path);
    const chunks = await adapter.loadRange([docId]);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.data).toEqual(DATA_A);
  });

  it('does not expose duplicate logical entries when both legacy and v2 exist for the same key', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const legacyName = `${docId}_snapshot_${HASH_A}.automerge`;
    const v2Name = requireV2Name(docId, 'snapshot', HASH_A);
    await vfs.writeFile(`${path}/${legacyName}`, DATA_A);
    await vfs.writeFile(`${path}/${v2Name}`, DATA_A);

    const adapter = createVFSAdapter(vfs, path);
    const chunks = await adapter.loadRange([docId]);

    expect(chunks).toHaveLength(1);
  });

  it('prefers v2 data when both legacy and v2 exist for the same key', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const legacyName = `${docId}_snapshot_${HASH_A}.automerge`;
    const v2Name = requireV2Name(docId, 'snapshot', HASH_A);
    const legacyData = new Uint8Array([10, 20, 30]);
    const v2Data = new Uint8Array([40, 50, 60]);
    await vfs.writeFile(`${path}/${legacyName}`, legacyData);
    await vfs.writeFile(`${path}/${v2Name}`, v2Data);

    const adapter = createVFSAdapter(vfs, path);
    const chunks = await adapter.loadRange([docId]);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.data).toEqual(v2Data);
  });

  it('filters by kind when prefix is [docId, kind]', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const snapshotName = `${docId}_snapshot_${HASH_A}.automerge`;
    const incrementalName = `${docId}_incremental_${HASH_B}.automerge`;
    await vfs.writeFile(`${path}/${snapshotName}`, DATA_A);
    await vfs.writeFile(`${path}/${incrementalName}`, DATA_B);

    const adapter = createVFSAdapter(vfs, path);
    const snapshots = await adapter.loadRange([docId, 'snapshot']);

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]?.data).toEqual(DATA_A);
    expect(snapshots[0]?.key[1]).toBe('snapshot');
  });

  it('filters v2 files by kind when prefix is [docId, kind]', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const v2Snapshot = requireV2Name(docId, 'snapshot', HASH_A);
    const v2Incremental = requireV2Name(docId, 'incremental', HASH_B);
    await vfs.writeFile(`${path}/${v2Snapshot}`, DATA_A);
    await vfs.writeFile(`${path}/${v2Incremental}`, DATA_B);

    const adapter = createVFSAdapter(vfs, path);
    const incrementals = await adapter.loadRange([docId, 'incremental']);

    expect(incrementals).toHaveLength(1);
    expect(incrementals[0]?.data).toEqual(DATA_B);
    expect(incrementals[0]?.key[1]).toBe('incremental');
  });

  it('returns logical key with original hex hash from a v2 file', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const v2Name = requireV2Name(docId, 'snapshot', HASH_A);
    await vfs.writeFile(`${path}/${v2Name}`, DATA_A);

    const adapter = createVFSAdapter(vfs, path);
    const chunks = await adapter.loadRange([docId]);

    expect(chunks[0]?.key).toEqual([docId, 'snapshot', HASH_A]);
  });

  it('supports merge-by-copy: loading a directory with files from two sources', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    // Source A has a legacy snapshot; Source B has a v2 incremental – both for the same doc.
    const legacySnapshot = `${docId}_snapshot_${HASH_A}.automerge`;
    const v2Incremental = requireV2Name(docId, 'incremental', HASH_B);
    await vfs.writeFile(`${path}/${legacySnapshot}`, DATA_A);
    await vfs.writeFile(`${path}/${v2Incremental}`, DATA_B);

    const adapter = createVFSAdapter(vfs, path);
    const all = await adapter.loadRange([docId]);

    expect(all).toHaveLength(2);
    const kinds = all.map((c) => c.key[1]).sort((a, b) => String(a).localeCompare(String(b)));
    expect(kinds).toEqual(['incremental', 'snapshot']);
  });

  it('returns logical key with the full Automerge key from a v3 wrapper file', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    const fileName = encodePrimaryV3FileName(key);
    if (!fileName) throw new Error('Expected v3 filename');
    await vfs.writeFile(`${path}/${fileName}`, encodeV3StorageWrapper(key, DATA_A));

    const adapter = createVFSAdapter(vfs, path);
    const chunks = await adapter.loadRange([docId]);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.key).toEqual(key);
    expect(chunks[0]?.data).toEqual(DATA_A);
  });

  it('skips invalid and empty v3 wrapper files during loadRange', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const validKey: StorageKey = [docId, 'snapshot', HASH_A];
    const validName = encodePrimaryV3FileName(validKey);
    if (!validName) throw new Error('Expected v3 filename');
    await vfs.writeFile(`${path}/${validName}`, encodeV3StorageWrapper(validKey, DATA_A));
    await vfs.writeFile(
      `${path}/${docId.slice(0, 6)}.s.${HASH_B.slice(0, 8)}.1.mf`,
      new Uint8Array([1]),
    );
    await vfs.writeFile(
      `${path}/${docId.slice(0, 6)}.i.${HASH_B.slice(0, 8)}.2.mf`,
      encodeV3StorageWrapper([docId, 'incremental', HASH_B], EMPTY_DATA),
    );

    const adapter = createVFSAdapter(vfs, path);
    const chunks = await adapter.loadRange([docId]);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.key).toEqual(validKey);
  });

  it('prefers valid v3 over valid v2 and legacy for the same logical key', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    const v2Name = requireV2Name(docId, 'snapshot', HASH_A);
    const v3Name = encodePrimaryV3FileName(key);
    if (!v3Name) throw new Error('Expected v3 filename');
    await vfs.writeFile(`${path}/${docId}_snapshot_${HASH_A}.automerge`, DATA_A);
    await vfs.writeFile(`${path}/${v2Name}`, DATA_B);
    await vfs.writeFile(
      `${path}/${v3Name}`,
      encodeV3StorageWrapper(key, new Uint8Array([9, 9, 9])),
    );

    const adapter = createVFSAdapter(vfs, path);
    const chunks = await adapter.loadRange([docId]);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.data).toEqual(new Uint8Array([9, 9, 9]));
    expect(chunks[0]?.key).toEqual(key);
  });

  it('invalid v3 does not hide a valid v2 or legacy file for the same key', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    const v2Name = requireV2Name(docId, 'snapshot', HASH_A);
    const v3Name = encodePrimaryV3FileName(key);
    if (!v3Name) throw new Error('Expected v3 filename');
    await vfs.writeFile(`${path}/${v3Name}`, new Uint8Array([0]));
    await vfs.writeFile(`${path}/${v2Name}`, DATA_A);

    const adapter = createVFSAdapter(vfs, path);
    const chunks = await adapter.loadRange([docId]);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.data).toEqual(DATA_A);
  });
});

describe('createVFSAdapter – remove deletes matching legacy and v2 files', () => {
  it('removes an existing v2 snapshot file', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const v2Name = requireV2Name(docId, 'snapshot', HASH_A);
    await vfs.writeFile(`${path}/${v2Name}`, DATA_A);

    const adapter = createVFSAdapter(vfs, path);
    await adapter.remove([docId, 'snapshot', HASH_A]);

    const entries = await vfs.readDirectory(path);
    expect(entries.map(([n]) => n)).not.toContain(v2Name);
  });

  it('removes an existing legacy file for the key', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const legacyName = `${docId}_snapshot_${HASH_A}.automerge`;
    await vfs.writeFile(`${path}/${legacyName}`, DATA_A);

    const adapter = createVFSAdapter(vfs, path);
    await adapter.remove([docId, 'snapshot', HASH_A]);

    const entries = await vfs.readDirectory(path);
    expect(entries.map(([n]) => n)).not.toContain(legacyName);
  });

  it('removes both legacy and v2 files when both exist for the same key', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const legacyName = `${docId}_snapshot_${HASH_A}.automerge`;
    const v2Name = requireV2Name(docId, 'snapshot', HASH_A);
    await vfs.writeFile(`${path}/${legacyName}`, DATA_A);
    await vfs.writeFile(`${path}/${v2Name}`, DATA_A);

    const adapter = createVFSAdapter(vfs, path);
    await adapter.remove([docId, 'snapshot', HASH_A]);

    const entries = await vfs.readDirectory(path);
    const names = entries.map(([n]) => n);
    expect(names).not.toContain(legacyName);
    expect(names).not.toContain(v2Name);
  });

  it('does not throw when the key is already absent', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const adapter = createVFSAdapter(vfs, path);

    await expect(adapter.remove([docId, 'snapshot', HASH_A])).resolves.toBeUndefined();
  });

  it('leaves unrelated files untouched', async () => {
    const { vfs, path } = await setupVfs();
    const docA = getDocumentId();
    const docB = getDocumentId();
    const v2A = requireV2Name(docA, 'snapshot', HASH_A);
    const v2B = requireV2Name(docB, 'snapshot', HASH_B);
    await vfs.writeFile(`${path}/${v2A}`, DATA_A);
    await vfs.writeFile(`${path}/${v2B}`, DATA_B);

    const adapter = createVFSAdapter(vfs, path);
    await adapter.remove([docA, 'snapshot', HASH_A]);

    const entries = await vfs.readDirectory(path);
    expect(entries.map(([n]) => n)).toContain(v2B);
  });

  it('removes a valid same-key primary v3 file', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    const primaryName = encodePrimaryV3FileName(key);
    if (!primaryName) throw new Error('Expected v3 filename');
    await vfs.writeFile(`${path}/${primaryName}`, encodeV3StorageWrapper(key, DATA_A));

    const adapter = createVFSAdapter(vfs, path);
    await adapter.remove(key);

    const entries = await vfs.readDirectory(path);
    expect(entries).toHaveLength(0);
  });

  it('leaves unrelated non-primary .mf names untouched during exact remove', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    const primaryName = encodePrimaryV3FileName(key);
    if (!primaryName) throw new Error('Expected v3 filename');
    const copiedName = `${docId.slice(0, 6)}.s.${HASH_A.slice(0, 8)} - copy.mf`;
    await vfs.writeFile(`${path}/${primaryName}`, encodeV3StorageWrapper(key, DATA_A));
    await vfs.writeFile(`${path}/${copiedName}`, encodeV3StorageWrapper(key, DATA_A));

    const adapter = createVFSAdapter(vfs, path);
    await adapter.remove(key);

    const names = (await vfs.readDirectory(path)).map(([name]) => name);
    expect(names).toEqual([copiedName]);
  });

  it('does not blindly remove an invalid primary v3 file', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    const primaryName = encodePrimaryV3FileName(key);
    if (!primaryName) throw new Error('Expected v3 filename');
    await vfs.writeFile(`${path}/${primaryName}`, new Uint8Array([0xde, 0xad]));

    const adapter = createVFSAdapter(vfs, path);
    await adapter.remove(key);

    const names = (await vfs.readDirectory(path)).map(([name]) => name);
    expect(names).toEqual([primaryName]);
  });
});

describe('createVFSAdapter – removeRange deletes matching legacy and v2 files', () => {
  it('deletes matching v2 files for the prefix', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const v2Name = requireV2Name(docId, 'snapshot', HASH_A);
    await vfs.writeFile(`${path}/${v2Name}`, DATA_A);

    const adapter = createVFSAdapter(vfs, path);
    await adapter.removeRange([docId]);

    const entries = await vfs.readDirectory(path);
    expect(entries.map(([n]) => n)).not.toContain(v2Name);
  });

  it('deletes matching legacy files for the prefix', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const legacyName = `${docId}_snapshot_${HASH_A}.automerge`;
    await vfs.writeFile(`${path}/${legacyName}`, DATA_A);

    const adapter = createVFSAdapter(vfs, path);
    await adapter.removeRange([docId]);

    const entries = await vfs.readDirectory(path);
    expect(entries.map(([n]) => n)).not.toContain(legacyName);
  });

  it('deletes both legacy and v2 files within the prefix', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const legacyName = `${docId}_snapshot_${HASH_A}.automerge`;
    const v2Name = requireV2Name(docId, 'snapshot', HASH_A);
    await vfs.writeFile(`${path}/${legacyName}`, DATA_A);
    await vfs.writeFile(`${path}/${v2Name}`, DATA_A);

    const adapter = createVFSAdapter(vfs, path);
    await adapter.removeRange([docId]);

    const entries = await vfs.readDirectory(path);
    const names = entries.map(([n]) => n);
    expect(names).not.toContain(legacyName);
    expect(names).not.toContain(v2Name);
  });

  it('deletes only strict primary v3 files within the prefix', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const snapshotKey: StorageKey = [docId, 'snapshot', HASH_A];
    const incrementalKey: StorageKey = [docId, 'incremental', HASH_B];
    const snapshotName = encodePrimaryV3FileName(snapshotKey);
    const incrementalName = encodePrimaryV3FileName(incrementalKey);
    if (!snapshotName || !incrementalName) throw new Error('Expected v3 filename');
    await vfs.writeFile(`${path}/${snapshotName}`, encodeV3StorageWrapper(snapshotKey, DATA_A));
    await vfs.writeFile(
      `${path}/${incrementalName}`,
      encodeV3StorageWrapper(incrementalKey, DATA_B),
    );

    const adapter = createVFSAdapter(vfs, path);
    await adapter.removeRange([docId]);

    const entries = await vfs.readDirectory(path);
    expect(entries).toHaveLength(0);
  });

  it('removeRange leaves unrelated same-prefix .mf names untouched', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const snapshotKey: StorageKey = [docId, 'snapshot', HASH_A];
    const snapshotName = encodePrimaryV3FileName(snapshotKey);
    if (!snapshotName) throw new Error('Expected v3 filename');
    await vfs.writeFile(`${path}/${snapshotName}`, encodeV3StorageWrapper(snapshotKey, DATA_A));
    await vfs.writeFile(
      `${path}/${docId.slice(0, 6)}.s.${HASH_A.slice(0, 8)}-noise.mf`,
      new Uint8Array([0xde, 0xad]),
    );

    const adapter = createVFSAdapter(vfs, path);
    await adapter.removeRange([docId]);

    const names = (await vfs.readDirectory(path)).map(([name]) => name);
    expect(names).toEqual([`${docId.slice(0, 6)}.s.${HASH_A.slice(0, 8)}-noise.mf`]);
  });

  it('leaves unrelated doc files untouched', async () => {
    const { vfs, path } = await setupVfs();
    const docA = getDocumentId();
    const docB = getDocumentId();
    const legacyA = `${docA}_snapshot_${HASH_A}.automerge`;
    const v2B = requireV2Name(docB, 'snapshot', HASH_B);
    await vfs.writeFile(`${path}/${legacyA}`, DATA_A);
    await vfs.writeFile(`${path}/${v2B}`, DATA_B);

    const adapter = createVFSAdapter(vfs, path);
    await adapter.removeRange([docA]);

    const entries = await vfs.readDirectory(path);
    const names = entries.map(([n]) => n);
    expect(names).not.toContain(legacyA);
    expect(names).toContain(v2B);
  });

  it('does not create, rename, migrate, or rewrite any file', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const legacyName = `${docId}_snapshot_${HASH_A}.automerge`;
    await vfs.writeFile(`${path}/${legacyName}`, DATA_A);

    const adapter = createVFSAdapter(vfs, path);
    const entriesBefore = await vfs.readDirectory(path);
    await adapter.removeRange([docId]);
    const entriesAfter = await vfs.readDirectory(path);

    // After removeRange the legacy file is gone, and no new files were created.
    expect(entriesBefore).toHaveLength(1);
    expect(entriesAfter).toHaveLength(0);
  });
});

describe('createVFSAdapter – remove error handling', () => {
  it('throws when vfs.delete raises a non-FileNotFound error during remove', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const v2Name = requireV2Name(docId, 'snapshot', HASH_A);
    await vfs.writeFile(`${path}/${v2Name}`, DATA_A);

    const permissionError = new VfsError(FileSystemError.NoPermissions, 'denied');
    vi.spyOn(vfs, 'delete').mockRejectedValueOnce(permissionError);

    const adapter = createVFSAdapter(vfs, path);
    await expect(adapter.remove([docId, 'snapshot', HASH_A])).rejects.toThrow(permissionError);
  });

  it('ignores FileNotFound during remove (file already gone)', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const v2Name = requireV2Name(docId, 'snapshot', HASH_A);
    await vfs.writeFile(`${path}/${v2Name}`, DATA_A);

    const notFoundError = new VfsError(FileSystemError.FileNotFound, 'gone');
    vi.spyOn(vfs, 'delete').mockRejectedValueOnce(notFoundError);

    const adapter = createVFSAdapter(vfs, path);
    await expect(adapter.remove([docId, 'snapshot', HASH_A])).resolves.toBeUndefined();
  });

  it('throws when vfs.delete raises a non-FileNotFound error during removeRange', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const v2Name = requireV2Name(docId, 'snapshot', HASH_A);
    await vfs.writeFile(`${path}/${v2Name}`, DATA_A);

    const permissionError = new VfsError(FileSystemError.NoPermissions, 'denied');
    vi.spyOn(vfs, 'delete').mockRejectedValueOnce(permissionError);

    const adapter = createVFSAdapter(vfs, path);
    await expect(adapter.removeRange([docId])).rejects.toThrow(permissionError);
  });

  it('ignores FileNotFound during removeRange (file already gone)', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const v2Name = requireV2Name(docId, 'snapshot', HASH_A);
    await vfs.writeFile(`${path}/${v2Name}`, DATA_A);

    const notFoundError = new VfsError(FileSystemError.FileNotFound, 'gone');
    vi.spyOn(vfs, 'delete').mockRejectedValueOnce(notFoundError);

    const adapter = createVFSAdapter(vfs, path);
    await expect(adapter.removeRange([docId])).resolves.toBeUndefined();
  });
});

describe('createVFSAdapter – marker file (storage-adapter-id) is unaffected', () => {
  it('loads the marker key from its legacy-format file', async () => {
    const { vfs, path } = await setupVfs();
    const markerName =
      partialKeyToFileName(['storage-adapter-id']) ?? 'storage-adapter-id.automerge';
    const markerData = new Uint8Array([0xff]);
    await vfs.writeFile(`${path}/${markerName}`, markerData);

    const adapter = createVFSAdapter(vfs, path);
    const result = await adapter.load(['storage-adapter-id']);

    expect(result).toEqual(markerData);
  });
});
