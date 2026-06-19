import type { StorageAdapterInterface } from '@automerge/automerge-repo';
import { FileSystemError, PathUtils, type VirtualFileSystem, VfsError } from '../virtualFileSystem';
import type { PartialStorageKey, StorageKey } from './types';
import {
  loadStorageEntriesByPrefix,
  loadStorageEntry,
  removeStorageEntriesByPrefix,
  removeStorageEntry,
  saveStorageEntry,
  type MutableStorageFilePolicyIo,
} from './storageFilePolicy';

/**
 * Creates an Automerge storage adapter backed by a VirtualFileSystem path.
 * New chunk writes use short v3 `.mf` wrapper files, while non-chunk entries such as the marker
 * file keep their legacy filenames. Reads and listings remain backward-compatible with legacy and
 * v2 chunk files.
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

  const createOperationIo = (): MutableStorageFilePolicyIo => {
    let namesPromise: Promise<readonly string[]> | undefined;

    const getNames = async (): Promise<readonly string[]> => {
      namesPromise ??= vfs.readDirectory(path).then((entries) => entries.map(([name]) => name));
      return namesPromise;
    };

    return {
      listNames: getNames,
      readBytes: tryReadDirectFile,
      writeBytes: async (name, data) => {
        await vfs.writeFile(PathUtils.join(path, name), new Uint8Array(data));
      },
      removeName: async (name) => {
        try {
          await vfs.delete(PathUtils.join(path, name));
        } catch (error) {
          if (!(error instanceof VfsError && error.code === FileSystemError.FileNotFound)) {
            throw error;
          }
        }
      },
    };
  };

  return {
    load: (key: PartialStorageKey) => loadStorageEntry(createOperationIo(), key),
    loadRange: (keyPrefix: PartialStorageKey) =>
      loadStorageEntriesByPrefix(createOperationIo(), keyPrefix),
    remove: (key: StorageKey) => removeStorageEntry(createOperationIo(), key),
    removeRange: (keyPrefix: PartialStorageKey) =>
      removeStorageEntriesByPrefix(createOperationIo(), keyPrefix),
    save: (key: StorageKey, data: Uint8Array) => saveStorageEntry(createOperationIo(), key, data),
  };
};
