import type { StorageAdapterInterface } from '@automerge/automerge-repo';
import type { AMChunk } from '@shared/lib/automerge';
import { isStandardBufferView } from '@shared/lib/isStandardBufferView';
import { FileSystemError, PathUtils, type VirtualFileSystem, VfsError } from '../virtualFileSystem';
import type { PartialStorageKey, StorageKey } from './types';
import { fileNameToPartialKey } from './fileNameToPartialKey';
import { partialKeyToFileName } from './partialKeyToFileName';
import { encodeStorageKeyToV2FileName, isV2FileName } from './filenameCodecV2';

const keysEqual = (a: PartialStorageKey, b: PartialStorageKey): boolean => {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
};

const keyStartsWith = (key: PartialStorageKey, prefix: PartialStorageKey): boolean => {
  if (key.length < prefix.length) return false;

  for (let i = 0; i < prefix.length; i++) {
    if (key[i] !== prefix[i]) return false;
  }

  return true;
};

const toV2FileName = (key: StorageKey): string | undefined => {
  const [part0, part1, part2] = key;

  if (part1 && part2) {
    const v2 = encodeStorageKeyToV2FileName(part0, part1, part2);

    if (v2) {
      return v2;
    }
  }

  return partialKeyToFileName(key);
};

/**
 * Creates an Automerge storage adapter backed by a VirtualFileSystem path.
 * New writes use v2 compact filenames. Reads and listings recognise both legacy and v2 files.
 * @param vfs - Mounted virtual file system.
 * @param path - Absolute path of the repository directory inside the VFS.
 * @returns Automerge storage adapter interface.
 */
export const createVFSAdapter = (vfs: VirtualFileSystem, path: string): StorageAdapterInterface => {
  const listDeduplicatedEntries = async (): Promise<
    Map<string, { fileName: string; key: PartialStorageKey; isV2: boolean }>
  > => {
    const directoryContent = await vfs.readDirectory(path);
    const seen = new Map<string, { fileName: string; key: PartialStorageKey; isV2: boolean }>();

    for (const [fileName] of directoryContent) {
      const key = fileNameToPartialKey(fileName);

      if (!key) continue;

      const keyStr = key.join('\x00');
      const isV2 = isV2FileName(fileName);
      const existing = seen.get(keyStr);

      if (!existing || (!existing.isV2 && isV2)) {
        seen.set(keyStr, { fileName, key, isV2 });
      }
    }

    return seen;
  };

  const load = async (key: PartialStorageKey): Promise<Uint8Array | undefined> => {
    const allEntries = await listDeduplicatedEntries();
    const matched = [...allEntries.values()].find((entry) => keysEqual(entry.key, key));

    if (!matched) {
      return undefined;
    }

    const file = await vfs.readFile(PathUtils.join(path, matched.fileName));

    return new Uint8Array(await file.arrayBuffer());
  };

  const loadRange = async (keyPrefix: PartialStorageKey): Promise<AMChunk[]> => {
    const allEntries = await listDeduplicatedEntries();
    const matched = [...allEntries.values()].filter((entry) => keyStartsWith(entry.key, keyPrefix));

    const chunkList = await Promise.allSettled(
      matched.map(async ({ fileName, key }): Promise<AMChunk | undefined> => {
        const file = await vfs.readFile(PathUtils.join(path, fileName));

        return {
          key,
          data: new Uint8Array(await file.arrayBuffer()),
        };
      }),
    );

    return chunkList.reduce((acc: AMChunk[], value) => {
      if (value.status === 'fulfilled' && value.value) {
        acc.push(value.value);
      }

      return acc;
    }, []);
  };

  const remove = async (key: StorageKey) => {
    const allEntries = await listDeduplicatedEntries();
    const matched = [...allEntries.values()].find((entry) => keysEqual(entry.key, key));

    if (!matched) {
      return;
    }

    try {
      await vfs.delete(PathUtils.join(path, matched.fileName));
    } catch (error) {
      if (error instanceof VfsError && error.code === FileSystemError.FileNotFound) {
        return;
      }

      throw error;
    }
  };

  const removeRange = async (keyPrefix: PartialStorageKey) => {
    const allEntries = await listDeduplicatedEntries();

    await Promise.allSettled(
      [...allEntries.values()]
        .filter((entry) => keyStartsWith(entry.key, keyPrefix))
        .map(async (entry) => {
          await vfs.delete(PathUtils.join(path, entry.fileName));
        }),
    );
  };

  const save = async (key: StorageKey, data: Uint8Array): Promise<void> => {
    const fileName = toV2FileName(key);

    if (!fileName) {
      throw new Error('fileName is undefined');
    }

    const fullPath = PathUtils.join(path, fileName);

    if (data instanceof Blob || data instanceof ArrayBuffer) {
      await vfs.writeFile(fullPath, data);
    } else if (
      isStandardBufferView(data) &&
      data.byteOffset === 0 &&
      data.byteLength === data.buffer.byteLength
    ) {
      await vfs.writeFile(fullPath, data);
    } else {
      await vfs.writeFile(fullPath, new Uint8Array(data));
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
