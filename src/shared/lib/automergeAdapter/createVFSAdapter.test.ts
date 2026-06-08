import { Repo } from '@automerge/automerge-repo';
import { describe, expect, it } from 'vitest';
import { VirtualFileSystem } from '../virtualFileSystem';
import { MemoryFileSystem } from '../virtualFileSystem/MemoryFileSystem';
import { createVFSAdapter } from './createVFSAdapter';
import { encodeStorageKeyToV2FileName } from './filenameCodecV2';
import { partialKeyToFileName } from './partialKeyToFileName';
import type { StorageKey } from './types';

// Real 64-char hex hash (SHA-256 shape) used throughout the codec tests.
const HASH_A = '0df10d48afdaa0df1a484b006e4854cec8640d416745ce0cc874c07027b69cc2';
const HASH_B = '1af20e59befbb1e02b595c117f9965dfd7751e527856df1dd985d18138c7add3';

// Obtain a valid Automerge document ID so the StorageKey types are satisfied.
const getDocumentId = () => new Repo().create({}).documentId;

const DATA_A = new Uint8Array([1, 2, 3]);
const DATA_B = new Uint8Array([4, 5, 6]);

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

describe('createVFSAdapter – save uses v2 compact filenames', () => {
  it('saves a snapshot with a v2 compact filename (shorter than 112 chars)', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];

    const adapter = createVFSAdapter(vfs, path);
    await adapter.save(key, DATA_A);

    const entries = await vfs.readDirectory(path);
    const names = entries.map(([name]) => name);
    const expectedV2 = requireV2Name(docId, 'snapshot', HASH_A);

    expect(names).toContain(expectedV2);
    expect(expectedV2.length).toBeLessThan(112);
    expect(expectedV2.length).toBeLessThanOrEqual(80);
  });

  it('saves an incremental with a v2 compact filename', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'incremental', HASH_B];

    const adapter = createVFSAdapter(vfs, path);
    await adapter.save(key, DATA_B);

    const entries = await vfs.readDirectory(path);
    const names = entries.map(([name]) => name);
    expect(names).toContain(requireV2Name(docId, 'incremental', HASH_B));
  });

  it('saved v2 filename contains no path separators or traversal characters', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const adapter = createVFSAdapter(vfs, path);
    await adapter.save([docId, 'snapshot', HASH_A], DATA_A);

    const entries = await vfs.readDirectory(path);
    const [firstEntry] = entries;
    const name = firstEntry?.[0];
    expect(name).not.toContain('/');
    expect(name).not.toContain('\\');
    expect(name).not.toContain('..');
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

  it('returns undefined for a missing key', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const adapter = createVFSAdapter(vfs, path);

    const result = await adapter.load([docId, 'snapshot', HASH_A]);

    expect(result).toBeUndefined();
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
});

describe('createVFSAdapter – remove deletes by logical key regardless of physical format', () => {
  it('removes a legacy snapshot file', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const legacyName = `${docId}_snapshot_${HASH_A}.automerge`;
    await vfs.writeFile(`${path}/${legacyName}`, DATA_A);

    const adapter = createVFSAdapter(vfs, path);
    await adapter.remove([docId, 'snapshot', HASH_A]);

    const entries = await vfs.readDirectory(path);
    expect(entries.map(([n]) => n)).not.toContain(legacyName);
  });

  it('removes a v2 snapshot file', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const v2Name = requireV2Name(docId, 'snapshot', HASH_A);
    await vfs.writeFile(`${path}/${v2Name}`, DATA_A);

    const adapter = createVFSAdapter(vfs, path);
    await adapter.remove([docId, 'snapshot', HASH_A]);

    const entries = await vfs.readDirectory(path);
    expect(entries.map(([n]) => n)).not.toContain(v2Name);
  });

  it('does not throw when the key is already absent', async () => {
    const { vfs, path } = await setupVfs();
    const docId = getDocumentId();
    const adapter = createVFSAdapter(vfs, path);

    await expect(adapter.remove([docId, 'snapshot', HASH_A])).resolves.toBeUndefined();
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
