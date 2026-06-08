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
import { encodeStorageKeyToV2FileName, isV2FileName } from './filenameCodecV2';
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
    const [part0, part1, part2] = key;

    if (part1 && part2) {
      // Full chunk key: delete only the v2 file; legacy files are read-only compatibility.
      const v2FileName = encodeStorageKeyToV2FileName(part0, part1, part2);

      if (v2FileName) {
        await directory.removeByName?.(v2FileName);
      }

      return;
    }

    // Non-chunk key (e.g. 'storage-adapter-id'): delete by lookup.
    const allEntries = await listDeduplicatedEntries();
    const matched = [...allEntries.values()].find((entry) => storageKeyEquals(entry.key, key));

    if (matched?.entry.remove) {
      await matched.entry.remove();
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
    // Only v2 files are deleted; legacy files are read-only compatibility.
    for await (const [rawName, entry] of directory.entries()) {
      if (!('read' in entry)) continue;

      const name = toString(rawName);

      if (!isV2FileName(name)) continue;

      const key = fileNameToPartialKey(name);

      if (key && storageKeyStartsWith(key, keyPrefix)) {
        await directory.removeByName?.(name);
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
