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
import { fileNameToPartialKey } from './fileNameToPartialKey';
import {
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
  const listDeduplicatedEntries = async (): Promise<
    Map<
      string,
      { name: string; entry: FileForStorageAdapter; key: PartialStorageKey; isV2: boolean }
    >
  > => {
    const entryHandles = new Map<string, FileForStorageAdapter>();
    const names: string[] = [];

    for await (const [rawName, entry] of directory.entries()) {
      if (!('read' in entry)) continue;

      const name = toString(rawName);
      entryHandles.set(name, entry);
      names.push(name);
    }

    const deduped = selectReadableStorageEntries(names);
    const result = new Map<
      string,
      { name: string; entry: FileForStorageAdapter; key: PartialStorageKey; isV2: boolean }
    >();

    for (const [keyStr, { name, key, isV2 }] of deduped) {
      const entry = entryHandles.get(name);

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
    for await (const [rawName, entry] of directory.entries()) {
      if (!('read' in entry)) continue;

      const name = toString(rawName);
      const entryKey = fileNameToPartialKey(name);

      if (entryKey && storageKeyEquals(entryKey, key)) {
        if (entry.remove) {
          await entry.remove();
        } else {
          await directory.removeByName?.(name);
        }
      }
    }
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
    for await (const [rawName, entry] of directory.entries()) {
      if (!('read' in entry)) continue;

      const name = toString(rawName);
      const key = fileNameToPartialKey(name);

      if (key && storageKeyStartsWith(key, keyPrefix)) {
        if (entry.remove) {
          await entry.remove();
        } else {
          await directory.removeByName?.(name);
        }
      }
    }
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
