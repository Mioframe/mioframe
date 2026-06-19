import type {
  DirectoryForStorageAdapter,
  FileForStorageAdapter,
  PartialStorageKey,
  StorageKey,
  StorageKeyPrefix,
} from './types';
import type { AMStorageAdapterInterface } from '../automerge/automergeTypes';
import { toString } from 'es-toolkit/compat';
import {
  loadStorageEntriesByPrefix,
  loadStorageEntry,
  removeStorageEntriesByPrefix,
  removeStorageEntry,
  saveStorageEntry,
  type MutableStorageFilePolicyIo,
} from './storageFilePolicy';

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

  const createOperationIo = (): MutableStorageFilePolicyIo => {
    let handlesPromise: Promise<Map<string, FileForStorageAdapter>> | undefined;

    const getHandles = async (): Promise<Map<string, FileForStorageAdapter>> => {
      handlesPromise ??= (async () => {
        const handles = new Map<string, FileForStorageAdapter>();

        for await (const [rawName, entry] of directory.entries()) {
          if ('read' in entry) {
            handles.set(toString(rawName), entry);
          }
        }

        return handles;
      })();

      return handlesPromise;
    };

    return {
      listNames: async () => [...(await getHandles()).keys()],
      readBytes: async (name) => {
        if (directory.readFileByName) {
          const file = await directory.readFileByName(name);
          return file ? new Uint8Array(await file.arrayBuffer()) : undefined;
        }

        const entry = (await getHandles()).get(name);
        return entry ? readFileBytes(entry) : undefined;
      },
      writeBytes: async (name, data) => {
        if (!directory.writeFile) {
          console.warn(
            "FSStorageAdapter couldn't write new file, because a directory don't have writeFile method",
          );
          return;
        }

        await directory.writeFile(name, new Uint8Array(data));
      },
      removeName: async (name) => {
        if (directory.removeByName) {
          await directory.removeByName(name);
          return;
        }

        const entry = (await getHandles()).get(name);

        if (entry?.remove) {
          await entry.remove();
        }
      },
    };
  };

  const adapter: AMStorageAdapterInterface = {
    load: (key: PartialStorageKey) => loadStorageEntry(createOperationIo(), key),
    save: (key: StorageKey, data: Uint8Array<ArrayBuffer>) =>
      saveStorageEntry(createOperationIo(), key, data),
    remove: (key: StorageKey) => removeStorageEntry(createOperationIo(), key),
    loadRange: (keyPrefix: StorageKeyPrefix) =>
      loadStorageEntriesByPrefix(createOperationIo(), keyPrefix),
    removeRange: (keyPrefix: StorageKeyPrefix) =>
      removeStorageEntriesByPrefix(createOperationIo(), keyPrefix),
  };

  return adapter;
};
