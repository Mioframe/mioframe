import type { StorageAdapterInterface } from '@automerge/automerge-repo';
import { isStandardBufferView } from '@shared/lib/isStandardBufferView';
import { FileSystemError, PathUtils, type VirtualFileSystem, VfsError } from '../virtualFileSystem';
import type { PartialStorageKey, StorageKey } from './types';
import { isChunkStorageKey, toWritableStorageFileName } from './storageKeyHelpers';
import {
  collectStorageFileNamesForKey,
  collectStorageFileNamesForPrefix,
  loadStorageChunk,
  loadStorageChunksByPrefix,
  resolveStorageChunkWriteTarget,
  type StorageFilePolicyIo,
} from './storageFilePolicy';
import { encodeV3StorageWrapper } from './wrapperCodecV3';

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

  const io: StorageFilePolicyIo = {
    listNames: async () => (await vfs.readDirectory(path)).map(([name]) => name),
    readBytes: tryReadDirectFile,
  };

  const load = (key: PartialStorageKey) => loadStorageChunk(io, key);

  const loadRange = (keyPrefix: PartialStorageKey) => loadStorageChunksByPrefix(io, keyPrefix);

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
    await deleteMatchingFiles(await collectStorageFileNamesForKey(io, key));
  };

  const removeRange = async (keyPrefix: PartialStorageKey) => {
    await deleteMatchingFiles(await collectStorageFileNamesForPrefix(io, keyPrefix));
  };

  const save = async (key: StorageKey, data: Uint8Array): Promise<void> => {
    const fileName = toWritableStorageFileName(key);
    const chunkKey = isChunkStorageKey(key) ? key : undefined;

    if (!fileName) {
      throw new Error('fileName is undefined');
    }

    if (chunkKey && data.length === 0) {
      return;
    }

    const writableFileName = chunkKey
      ? await resolveStorageChunkWriteTarget(io, chunkKey)
      : fileName;
    const fullPath = PathUtils.join(path, writableFileName);
    const writableData = chunkKey ? encodeV3StorageWrapper(chunkKey, data) : data;

    if (writableData instanceof Blob || writableData instanceof ArrayBuffer) {
      await vfs.writeFile(fullPath, writableData);
    } else if (
      isStandardBufferView(writableData) &&
      writableData.byteOffset === 0 &&
      writableData.byteLength === writableData.buffer.byteLength
    ) {
      await vfs.writeFile(fullPath, new Uint8Array(writableData));
    } else {
      await vfs.writeFile(fullPath, new Uint8Array(writableData));
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
