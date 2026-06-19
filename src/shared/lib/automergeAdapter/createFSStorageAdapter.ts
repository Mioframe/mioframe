import type {
  DirectoryForStorageAdapter,
  FileForStorageAdapter,
  PartialStorageKey,
  StorageKey,
} from './types';
import type { AMStorageAdapterInterface } from '../automerge/automergeTypes';
import { toString } from 'es-toolkit/compat';
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
 * Creates an Automerge storage adapter backed by a `DirectoryForStorageAdapter`.
 * New chunk writes use short v3 `.mf` wrapper files, while non-chunk entries such as the marker
 * file keep their legacy filenames. Reads and listings remain backward-compatible with legacy and
 * v2 chunk files.
 * @param directory - Directory abstraction supplying Automerge storage entries.
 * @returns Automerge storage adapter interface.
 */
export const createFSStorageAdapter = (
  directory: DirectoryForStorageAdapter,
): AMStorageAdapterInterface => {
  const readFileBytes = async (entry: FileForStorageAdapter): Promise<Uint8Array> => {
    const file = await entry.read();
    return new Uint8Array(await file.arrayBuffer());
  };

  const collectFileHandles = async (): Promise<Map<string, FileForStorageAdapter>> => {
    const handles = new Map<string, FileForStorageAdapter>();

    for await (const [rawName, entry] of directory.entries()) {
      if ('read' in entry) {
        handles.set(toString(rawName), entry);
      }
    }

    return handles;
  };

  const io: StorageFilePolicyIo = {
    listNames: async () => [...(await collectFileHandles()).keys()],
    readBytes: async (name) => {
      const entry = (await collectFileHandles()).get(name);
      return entry ? readFileBytes(entry) : undefined;
    },
  };

  const load = (key: PartialStorageKey) => loadStorageChunk(io, key);

  const save = async (key: StorageKey, data: Uint8Array<ArrayBuffer>) => {
    const fileName = toWritableStorageFileName(key);
    const chunkKey = isChunkStorageKey(key) ? key : undefined;

    if (!fileName) {
      throw new Error('fileName is undefined');
    }

    if (!('writeFile' in directory)) {
      console.warn(
        "FSStorageAdapter couldn't write new file, because a directory don't have writeFile method",
      );
    }

    if (chunkKey && data.length === 0) {
      return;
    }

    const writableFileName = chunkKey
      ? await resolveStorageChunkWriteTarget(io, chunkKey)
      : fileName;
    const writableData = chunkKey ? encodeV3StorageWrapper(chunkKey, data) : data;

    await directory.writeFile?.(
      writableFileName,
      writableData instanceof Uint8Array ? new Uint8Array(writableData) : writableData,
    );
  };

  const remove = async (key: StorageKey) => {
    const handles = await collectFileHandles();

    await Promise.all(
      (await collectStorageFileNamesForKey(io, key)).map(async (name) => {
        const entry = handles.get(name);

        if (entry?.remove) {
          await entry.remove();
        } else {
          await directory.removeByName?.(name);
        }
      }),
    );
  };

  const loadRange = (keyPrefix: PartialStorageKey) => loadStorageChunksByPrefix(io, keyPrefix);

  const removeRange = async (keyPrefix: PartialStorageKey) => {
    const handles = await collectFileHandles();

    await Promise.all(
      (await collectStorageFileNamesForPrefix(io, keyPrefix)).map(async (name) => {
        const entry = handles.get(name);

        if (entry?.remove) {
          await entry.remove();
        } else {
          await directory.removeByName?.(name);
        }
      }),
    );
  };

  const adapter: AMStorageAdapterInterface = {
    load,
    save,
    remove,
    loadRange,
    removeRange,
  };

  return adapter;
};
