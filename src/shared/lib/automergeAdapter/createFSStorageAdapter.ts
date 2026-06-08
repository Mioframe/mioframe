import type { DirectoryForStorageAdapter, PartialStorageKey, StorageKey } from './types';
import { from, toArray } from 'ix/Ix.asynciterable';
import { filter, map } from 'ix/Ix.asynciterable.operators';
import { isNil } from 'es-toolkit';
import type { AMChunk, AMStorageAdapterInterface } from '../automerge/automergeTypes';
import { toString } from 'es-toolkit/compat';
import { partialKeyToFileName } from './partialKeyToFileName';
import { fileNameToPartialKey } from './fileNameToPartialKey';
import { encodeStorageKeyToV2FileName, isV2FileName } from './filenameCodecV2';
import type { FileForStorageAdapter } from './types';

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
    const seen = new Map<
      string,
      { name: string; entry: FileForStorageAdapter; key: PartialStorageKey; isV2: boolean }
    >();

    for await (const [rawName, entry] of directory.entries()) {
      if (!('read' in entry)) continue;

      const name = toString(rawName);
      const key = fileNameToPartialKey(name);

      if (!key) continue;

      const keyStr = key.join('\x00');
      const isV2 = isV2FileName(name);
      const existing = seen.get(keyStr);

      if (!existing || (!existing.isV2 && isV2)) {
        seen.set(keyStr, { name, entry, key, isV2 });
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

    const file = await matched.entry.read();

    return new Uint8Array(await file.arrayBuffer());
  };

  const save = async (key: StorageKey, data: Uint8Array<ArrayBuffer>) => {
    const fileName = toV2FileName(key);

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
    const allEntries = await listDeduplicatedEntries();
    const matched = [...allEntries.values()].find((entry) => keysEqual(entry.key, key));

    if (matched?.entry.remove) {
      await matched.entry.remove();
    }
  };

  const loadRange = async (keyPrefix: PartialStorageKey): Promise<AMChunk[]> => {
    const allEntries = await listDeduplicatedEntries();

    const matched = [...allEntries.values()].filter((entry) => keyStartsWith(entry.key, keyPrefix));

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
    const allEntries = await listDeduplicatedEntries();

    await from([...allEntries.values()]).forEach(async ({ entry, key }) => {
      if (keyStartsWith(key, keyPrefix) && entry.remove) {
        await entry.remove();
      }
    });
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
