import { Repo } from '@automerge/automerge-repo';
import { describe, expect, it, vi } from 'vitest';
import type { DirectoryForStorageAdapter, FileForStorageAdapter, StorageKey } from './types';
import { createFSStorageAdapter } from './createFSStorageAdapter';
import { encodeStorageKeyToV2FileName } from './filenameCodecV2';
import { encodePrimaryV3FileName } from './filenameCodecV3';
import { partialKeyToFileName } from './partialKeyToFileName';
import { encodeV3StorageWrapper } from './wrapperCodecV3';

const HASH_A = '0df10d48afdaa0df1a484b006e4854cec8640d416745ce0cc874c07027b69cc2';
const DATA_A = new Uint8Array([1, 2, 3]);
const DATA_B = new Uint8Array([4, 5, 6]);
const EMPTY_DATA = new Uint8Array();

const getDocumentId = () => new Repo().create({}).documentId;

const requireV2Name = (docId: string, kind: 'snapshot' | 'incremental', hash: string): string => {
  const name = encodeStorageKeyToV2FileName(docId, kind, hash);
  if (!name) throw new Error('Expected v2 filename');
  return name;
};

class MemoryDirectory implements DirectoryForStorageAdapter {
  readonly files = new Map<string, Uint8Array>();

  private static toFile(name: string, data: Uint8Array): File {
    return new File([Uint8Array.from(data).buffer], name);
  }

  entries(): AsyncIterableIterator<[PropertyKey, FileForStorageAdapter]> {
    const files = this.files;

    async function* iterate(): AsyncIterableIterator<[PropertyKey, FileForStorageAdapter]> {
      await Promise.resolve();

      for (const name of files.keys()) {
        yield [
          name,
          {
            read: async () => {
              await Promise.resolve();
              return MemoryDirectory.toFile(name, files.get(name) ?? new Uint8Array());
            },
            remove: async () => {
              await Promise.resolve();
              files.delete(name);
            },
          },
        ];
      }
    }

    return iterate();
  }

  async writeFile(name: string, file?: FileSystemWriteChunkType): Promise<FileForStorageAdapter> {
    await Promise.resolve();

    const bytes =
      file instanceof Uint8Array
        ? new Uint8Array(file)
        : file instanceof ArrayBuffer
          ? new Uint8Array(file)
          : new Uint8Array();
    this.files.set(name, bytes);

    return {
      read: async () => {
        await Promise.resolve();
        return MemoryDirectory.toFile(name, bytes);
      },
      remove: async () => {
        await Promise.resolve();
        this.files.delete(name);
      },
    };
  }

  async removeByName(name: string): Promise<void> {
    await Promise.resolve();
    this.files.delete(name);
  }
}

class DirectReadMemoryDirectory extends MemoryDirectory {
  entriesCalls = 0;
  readFileByNameCalls = 0;

  override entries(): AsyncIterableIterator<[PropertyKey, FileForStorageAdapter]> {
    this.entriesCalls += 1;
    return super.entries();
  }

  async readFileByName(name: string): Promise<File | undefined> {
    this.readFileByNameCalls += 1;
    await Promise.resolve();

    const bytes = this.files.get(name);
    return bytes ? new File([Uint8Array.from(bytes).buffer], name) : undefined;
  }
}

describe('createFSStorageAdapter', () => {
  it('uses the full-key fingerprint to avoid colliding on a shared doc prefix', async () => {
    const directory = new MemoryDirectory();
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

    const adapter = createFSStorageAdapter(directory);
    await adapter.save(keyA, DATA_A);
    await adapter.save(keyB, DATA_B);

    expect(nameA).not.toBe(nameB);
    expect([...directory.files.keys()].sort()).toEqual([nameA, nameB].sort());
  });

  it('does not overwrite an invalid existing .mf file during save and reports a conflict', async () => {
    const directory = new MemoryDirectory();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    const primaryName = encodePrimaryV3FileName(key);
    if (!primaryName) throw new Error('Expected v3 filename');
    directory.files.set(primaryName, new Uint8Array([0xde, 0xad]));

    const adapter = createFSStorageAdapter(directory);

    await expect(adapter.save(key, DATA_A)).rejects.toThrow();
    expect(directory.files.get(primaryName)).toEqual(new Uint8Array([0xde, 0xad]));
    expect(await adapter.load(key)).toBeUndefined();
  });

  it('loadRange prefers valid v3 over valid v2 and legacy and skips invalid v3', async () => {
    const directory = new MemoryDirectory();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    const v2Name = requireV2Name(docId, 'snapshot', HASH_A);
    const v3Name = encodePrimaryV3FileName(key);
    if (!v3Name) throw new Error('Expected v3 filename');
    directory.files.set(v3Name, new Uint8Array([0]));
    directory.files.set(v2Name, DATA_A);

    const adapter = createFSStorageAdapter(directory);
    expect(await adapter.loadRange([docId])).toEqual([{ key, data: DATA_A }]);

    directory.files.set(v3Name, encodeV3StorageWrapper(key, DATA_B));
    expect(await adapter.loadRange([docId])).toEqual([{ key, data: DATA_B }]);
  });

  it('remove deletes the primary v3, v2, and legacy files but leaves compatibility copies', async () => {
    const directory = new MemoryDirectory();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    const primaryName = encodePrimaryV3FileName(key);
    if (!primaryName) throw new Error('Expected v3 filename');
    const compatibilityName = `${docId.slice(0, 6)}.s.${HASH_A.slice(0, 8)} - copy.mf`;
    directory.files.set(primaryName, encodeV3StorageWrapper(key, DATA_A));
    directory.files.set(compatibilityName, encodeV3StorageWrapper(key, DATA_A));
    directory.files.set(requireV2Name(docId, 'snapshot', HASH_A), DATA_A);
    directory.files.set(`${docId}_snapshot_${HASH_A}.automerge`, DATA_A);

    const adapter = createFSStorageAdapter(directory);
    await adapter.remove(key);

    expect([...directory.files.keys()]).toEqual([compatibilityName]);
  });

  it('keeps marker file behavior unchanged', async () => {
    const directory = new MemoryDirectory();
    const markerName =
      partialKeyToFileName(['storage-adapter-id']) ?? 'storage-adapter-id.automerge';
    directory.files.set(markerName, new Uint8Array([0xff]));

    const adapter = createFSStorageAdapter(directory);
    expect(await adapter.load(['storage-adapter-id'])).toEqual(new Uint8Array([0xff]));
  });

  it('does not write empty chunk data as a v3 storage file', async () => {
    const directory = new MemoryDirectory();
    const key: StorageKey = [getDocumentId(), 'snapshot', HASH_A];

    const adapter = createFSStorageAdapter(directory);
    await adapter.save(key, EMPTY_DATA);

    expect(directory.files.size).toBe(0);
  });

  it('reuses one directory scan during a logical remove operation', async () => {
    const directory = new MemoryDirectory();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    const primaryName = encodePrimaryV3FileName(key);
    if (!primaryName) throw new Error('Expected v3 filename');
    directory.files.set(primaryName, encodeV3StorageWrapper(key, DATA_A));
    directory.files.set(`${docId}_snapshot_${HASH_A}.automerge`, DATA_A);
    const entriesSpy = vi.spyOn(directory, 'entries');

    const adapter = createFSStorageAdapter(directory);
    await adapter.remove(key);

    expect(entriesSpy).toHaveBeenCalledTimes(1);
  });
});

describe('createFSStorageAdapter direct read-by-name fast path', () => {
  it('reads the deterministic primary v3 file via readFileByName without calling entries()', async () => {
    const directory = new DirectReadMemoryDirectory();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    const primaryName = encodePrimaryV3FileName(key);
    if (!primaryName) throw new Error('Expected v3 filename');
    directory.files.set(primaryName, encodeV3StorageWrapper(key, DATA_A));

    const adapter = createFSStorageAdapter(directory);

    expect(await adapter.load(key)).toEqual(DATA_A);
    expect(directory.readFileByNameCalls).toBeGreaterThan(0);
    expect(directory.entriesCalls).toBe(0);
  });

  it('writes the primary v3 filename without calling entries() when the target is missing', async () => {
    const directory = new DirectReadMemoryDirectory();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    const primaryName = encodePrimaryV3FileName(key);
    if (!primaryName) throw new Error('Expected v3 filename');

    const adapter = createFSStorageAdapter(directory);
    await adapter.save(key, DATA_A);

    expect(directory.files.has(primaryName)).toBe(true);
    expect(directory.entriesCalls).toBe(0);
  });

  it('reports a storage conflict without falling back to a directory listing when the target is invalid', async () => {
    const directory = new DirectReadMemoryDirectory();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    const primaryName = encodePrimaryV3FileName(key);
    if (!primaryName) throw new Error('Expected v3 filename');
    directory.files.set(primaryName, new Uint8Array([0xde, 0xad]));

    const adapter = createFSStorageAdapter(directory);

    await expect(adapter.save(key, DATA_A)).rejects.toThrow();
    expect(directory.entriesCalls).toBe(0);
    expect(await adapter.load(key)).toBeUndefined();
  });

  it('keeps working through the entries()-based fallback when readFileByName is absent', async () => {
    const directory = new MemoryDirectory();
    const docId = getDocumentId();
    const key: StorageKey = [docId, 'snapshot', HASH_A];
    const primaryName = encodePrimaryV3FileName(key);
    if (!primaryName) throw new Error('Expected v3 filename');
    directory.files.set(primaryName, encodeV3StorageWrapper(key, DATA_A));
    const entriesSpy = vi.spyOn(directory, 'entries');

    const adapter = createFSStorageAdapter(directory);

    expect(await adapter.load(key)).toEqual(DATA_A);
    expect(entriesSpy).toHaveBeenCalled();
  });
});
