import type { StorageAdapterInterface } from '@automerge/automerge-repo';
import type { AMChunk } from '@shared/lib/automerge';
import { isStandardBufferView } from '@shared/lib/isStandardBufferView';
import { FileSystemError, PathUtils, type VirtualFileSystem, VfsError } from '../virtualFileSystem';
import type { PartialStorageKey, StorageKey } from './types';
import { fileNameToPartialKey } from './fileNameToPartialKey';
import { encodeStorageKeyToV2FileName, isV2FileName } from './filenameCodecV2';
import {
  selectReadableStorageEntries,
  storageKeyEquals,
  storageKeyStartsWith,
  toWritableStorageFileName,
} from './storageKeyHelpers';

/**
 * Creates an Automerge storage adapter backed by a VirtualFileSystem path.
 * New writes use v2 compact filenames. Reads and listings recognise both legacy and v2 files.
 * @param vfs - Mounted virtual file system.
 * @param path - Absolute path of the repository directory inside the VFS.
 * @returns Automerge storage adapter interface.
 */
export const createVFSAdapter = (vfs: VirtualFileSystem, path: string): StorageAdapterInterface => {
  const listDeduplicatedEntries = async (): Promise<
    Map<string, { name: string; key: PartialStorageKey; isV2: boolean }>
  > => {
    const directoryContent = await vfs.readDirectory(path);

    return selectReadableStorageEntries(directoryContent.map(([name]) => name));
  };

  const load = async (key: PartialStorageKey): Promise<Uint8Array | undefined> => {
    const allEntries = await listDeduplicatedEntries();
    const matched = [...allEntries.values()].find((entry) => storageKeyEquals(entry.key, key));

    if (!matched) {
      return undefined;
    }

    const file = await vfs.readFile(PathUtils.join(path, matched.name));

    return new Uint8Array(await file.arrayBuffer());
  };

  const loadRange = async (keyPrefix: PartialStorageKey): Promise<AMChunk[]> => {
    const allEntries = await listDeduplicatedEntries();
    const matched = [...allEntries.values()].filter((entry) =>
      storageKeyStartsWith(entry.key, keyPrefix),
    );

    const chunkList = await Promise.allSettled(
      matched.map(async ({ name, key }): Promise<AMChunk | undefined> => {
        const file = await vfs.readFile(PathUtils.join(path, name));

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
    const [part0, part1, part2] = key;

    if (part1 && part2) {
      // Full chunk key: delete only the v2 file; legacy files are read-only compatibility.
      const v2FileName = encodeStorageKeyToV2FileName(part0, part1, part2);

      if (!v2FileName) return;

      try {
        await vfs.delete(PathUtils.join(path, v2FileName));
      } catch (error) {
        if (error instanceof VfsError && error.code === FileSystemError.FileNotFound) {
          return;
        }

        throw error;
      }

      return;
    }

    // Non-chunk key (e.g. 'storage-adapter-id'): delete by lookup.
    const allEntries = await listDeduplicatedEntries();
    const matched = [...allEntries.values()].find((entry) => storageKeyEquals(entry.key, key));

    if (!matched) {
      return;
    }

    try {
      await vfs.delete(PathUtils.join(path, matched.name));
    } catch (error) {
      if (error instanceof VfsError && error.code === FileSystemError.FileNotFound) {
        return;
      }

      throw error;
    }
  };

  const removeRange = async (keyPrefix: PartialStorageKey) => {
    // Only v2 files are deleted; legacy files are read-only compatibility.
    const directoryContent = await vfs.readDirectory(path);

    await Promise.allSettled(
      directoryContent
        .filter(([name]) => isV2FileName(name))
        .map(async ([name]) => {
          const key = fileNameToPartialKey(name);

          if (key && storageKeyStartsWith(key, keyPrefix)) {
            await vfs.delete(PathUtils.join(path, name));
          }
        }),
    );
  };

  const save = async (key: StorageKey, data: Uint8Array): Promise<void> => {
    const fileName = toWritableStorageFileName(key);

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
