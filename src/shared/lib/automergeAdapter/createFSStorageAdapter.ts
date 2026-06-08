import type {
  DirectoryForStorageAdapter,
  FileForStorageAdapter,
  PartialStorageKey,
  StorageKey,
} from './types';
import { from, toArray } from 'ix/Ix.asynciterable';
import { filter, map } from 'ix/Ix.asynciterable.operators';
import { isNil } from 'es-toolkit';
import type { AMChunk, AMStorageAdapterInterface } from '../automerge/automergeTypes';
import { toString } from 'es-toolkit/compat';
import {
  listStorageFileEntries,
  selectReadableStorageEntries,
  storageKeyEquals,
  storageKeyStartsWith,
  toWritableStorageFileName,
} from './storageKeyHelpers';

/**
 * Creates an Automerge storage adapter backed by a `DirectoryForStorageAdapter`.
 * New writes use v2 compact filenames. Reads and listings recognise both legacy and v2 files.
 * @param directory - Directory abstraction supplying Automerge storage entries.
 * @returns Automerge storage adapter interface.
 */
export const createFSStorageAdapter = (
  directory: DirectoryForStorageAdapter,
): AMStorageAdapterInterface => {
  const collectFileHandles = async (): Promise<Map<string, FileForStorageAdapter>> => {
    const handles = new Map<string, FileForStorageAdapter>();

    for await (const [rawName, entry] of directory.entries()) {
      if ('read' in entry) {
        handles.set(toString(rawName), entry);
      }
    }

    return handles;
  };

  const listDeduplicatedEntries = async (): Promise<
    Map<
      string,
      { name: string; entry: FileForStorageAdapter; key: PartialStorageKey; isV2: boolean }
    >
  > => {
    const handles = await collectFileHandles();
    const deduped = selectReadableStorageEntries(handles.keys());
    const result = new Map<
      string,
      { name: string; entry: FileForStorageAdapter; key: PartialStorageKey; isV2: boolean }
    >();

    for (const [keyStr, { name, key, isV2 }] of deduped) {
      const entry = handles.get(name);

      if (entry) {
        result.set(keyStr, { name, entry, key, isV2 });
      }
    }

    return result;
  };

  const load = async (key: PartialStorageKey): Promise<Uint8Array | undefined> => {
    const allEntries = await listDeduplicatedEntries();
    const matched = [...allEntries.values()].find((entry) => storageKeyEquals(entry.key, key));

    if (!matched) {
      return undefined;
    }

    const file = await matched.entry.read();

    return new Uint8Array(await file.arrayBuffer());
  };

  const save = async (key: StorageKey, data: Uint8Array<ArrayBuffer>) => {
    const fileName = toWritableStorageFileName(key);

    if (!fileName) {
      throw new Error('fileName is undefined');
    }

    if (!('writeFile' in directory)) {
      console.warn(
        "FSStorageAdapter couldn't write new file, because a directory don't have writeFile method",
      );
    }

    await directory.writeFile?.(fileName, data);
  };

  const remove = async (key: StorageKey) => {
    const handles = await collectFileHandles();
    const matching = listStorageFileEntries(handles.keys()).filter(({ key: entryKey }) =>
      storageKeyEquals(entryKey, key),
    );

    await Promise.all(
      matching.map(async ({ name }) => {
        const entry = handles.get(name);

        if (entry?.remove) {
          await entry.remove();
        } else {
          await directory.removeByName?.(name);
        }
      }),
    );
  };

  const loadRange = async (keyPrefix: PartialStorageKey): Promise<AMChunk[]> => {
    const allEntries = await listDeduplicatedEntries();

    const matched = [...allEntries.values()].filter((entry) =>
      storageKeyStartsWith(entry.key, keyPrefix),
    );

    const chunkList: AMChunk[] = await toArray(
      from(matched).pipe(
        map(async ({ entry, key }): Promise<AMChunk | undefined> => {
          return {
            key,
            data: new Uint8Array(await (await entry.read()).arrayBuffer()),
          };
        }),
        filter((v) => !isNil(v)),
      ),
    );

    return chunkList;
  };

  const removeRange = async (keyPrefix: PartialStorageKey) => {
    const handles = await collectFileHandles();
    const matching = listStorageFileEntries(handles.keys()).filter(({ key }) =>
      storageKeyStartsWith(key, keyPrefix),
    );

    await Promise.all(
      matching.map(async ({ name }) => {
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
