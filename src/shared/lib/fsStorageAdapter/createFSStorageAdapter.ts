import type { StorageAdapterInterface, Chunk } from '@automerge/automerge-repo';
import type {
  DirectoryForAdapter,
  FileForAdapter,
  PartialFileName,
  PartialStorageKey,
  StorageKey,
} from './types';
import {
  KEY_SEPARATE,
  zodPartialFileName,
  zodPartialStorageKey,
} from './types';
import { createLogger } from '../logger';
import { parseSelf } from '../validateZodScheme';

export const partialKeyToFileName = (
  key: PartialStorageKey,
): PartialFileName => {
  debug('keyToFileName', key);
  return parseSelf(
    parseSelf(key, zodPartialStorageKey).join(KEY_SEPARATE),
    zodPartialFileName,
  );
};

export const fileNameToPartialKey = (fileName: unknown): PartialStorageKey =>
  parseSelf(
    parseSelf(fileName, zodPartialFileName).split(KEY_SEPARATE),
    zodPartialStorageKey,
  );

const { debug } = createLogger('createStorageAdapter');

export const createStorageAdapter = (
  directory: DirectoryForAdapter,
): StorageAdapterInterface => {
  const load = async (
    key: PartialStorageKey,
  ): Promise<Uint8Array | undefined> => {
    debug('load', key);

    const fileName = partialKeyToFileName(key);

    const listFromDirectory = await directory.getList();

    const entry = listFromDirectory.get(fileName);
    if (entry && 'read' in entry) {
      const file = await entry.read();

      return new Uint8Array(await file.arrayBuffer());
    }

    return undefined;
  };

  const save = async (key: StorageKey, data: Uint8Array) => {
    debug('save', key);

    const fileName = partialKeyToFileName(key);

    await directory.writeFile(fileName, data);
  };

  const remove = async (key: StorageKey) => {
    debug('remove', key);

    const fileName = partialKeyToFileName(key);

    await directory.removeByName(fileName);
  };

  const loadRange = async (keyPrefix: PartialStorageKey): Promise<Chunk[]> => {
    debug('loadRange', keyPrefix);

    const keyPrefixString: PartialFileName = parseSelf(
      keyPrefix.join(KEY_SEPARATE),
      zodPartialFileName,
    );

    const listFromDirectory = await directory.getList();

    const fileList: {
      key: PartialStorageKey;
      entry: FileForAdapter;
    }[] = [];

    listFromDirectory.forEach((entry, name) => {
      if (name.startsWith(keyPrefixString) && 'read' in entry) {
        const key = fileNameToPartialKey(name);

        fileList.push({ key, entry });
      }
    });

    const chunkList: Chunk[] = await Promise.all(
      fileList.map(async ({ key, entry }) => ({
        key,
        data: new Uint8Array(await (await entry.read()).arrayBuffer()),
      })),
    );

    return chunkList;
  };

  const removeRange = async (keyPrefix: PartialStorageKey) => {
    debug('removeRange', keyPrefix);

    const keyPrefixString: PartialFileName = parseSelf(
      keyPrefix.join(KEY_SEPARATE),
      zodPartialFileName,
    );

    const listFromDirectory = await directory.getList();

    const removeEntryList: FileForAdapter[] = [];

    listFromDirectory.forEach((entry, name) => {
      if ('read' in entry && name.startsWith(keyPrefixString)) {
        removeEntryList.push(entry);
      }
    });

    await Promise.all(removeEntryList.map((entry) => entry.remove()));
  };

  const adapter: StorageAdapterInterface = {
    load,
    save,
    remove,
    loadRange,
    removeRange,
  };

  return adapter;
};
