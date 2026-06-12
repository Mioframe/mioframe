import type { StorageAdapterInterface } from '@automerge/automerge-repo';
import type { AMChunk } from '@shared/lib/automerge';
import { isStandardBufferView } from '@shared/lib/isStandardBufferView';
import { FileSystemError, PathUtils, type VirtualFileSystem, VfsError } from '../virtualFileSystem';
import type { PartialStorageKey, StorageKey } from './types';
import {
  listStorageFileEntries,
  selectReadableStorageEntries,
  storageKeyHasPrefix,
  storageKeyToId,
  toWritableStorageFileName,
} from './storageKeyHelpers';
import { partialKeyToFileName } from './partialKeyToFileName';

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

  const tryReadDirectFile = async (name: string): Promise<Uint8Array | undefined> => {
    try {
      const file = await vfs.readFile(PathUtils.join(path, name));

      return new Uint8Array(await file.arrayBuffer());
    } catch (error) {
      if (error instanceof VfsError && error.code === FileSystemError.FileNotFound) {
        return undefined;
      }

      throw error;
    }
  };

  const load = async (key: PartialStorageKey): Promise<Uint8Array | undefined> => {
    if (key.length === 3) {
      const v2Name = toWritableStorageFileName(key);

      if (v2Name) {
        const v2Data = await tryReadDirectFile(v2Name);

        if (v2Data) {
          return v2Data;
        }
      }

      const legacyName = partialKeyToFileName(key);

      if (legacyName && legacyName !== v2Name) {
        const legacyData = await tryReadDirectFile(legacyName);

        if (legacyData) {
          return legacyData;
        }
      }
    }

    const allEntries = await listDeduplicatedEntries();
    const keyId = storageKeyToId(key);
    const matched = allEntries.get(keyId);

    if (!matched) {
      return undefined;
    }

    return tryReadDirectFile(matched.name);
  };

  const loadRange = async (keyPrefix: PartialStorageKey): Promise<AMChunk[]> => {
    const allEntries = await listDeduplicatedEntries();
    const matched = [...allEntries.values()].filter((entry) =>
      storageKeyHasPrefix(entry.key, keyPrefix),
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
    const matching = listStorageFileEntries(directoryContent.map(([name]) => name))
      .filter(({ key: entryKey }) => storageKeyToId(entryKey) === storageKeyToId(key))
      .map(({ name }) => name);

    await deleteMatchingFiles(matching);
  };

  const removeRange = async (keyPrefix: PartialStorageKey) => {
    const directoryContent = await vfs.readDirectory(path);
    const matching = listStorageFileEntries(directoryContent.map(([name]) => name))
      .filter(({ key }) => storageKeyHasPrefix(key, keyPrefix))
      .map(({ name }) => name);

    await deleteMatchingFiles(matching);
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
