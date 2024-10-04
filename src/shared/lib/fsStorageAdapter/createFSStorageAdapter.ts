import type { StorageAdapterInterface, Chunk } from '@automerge/automerge-repo';
import type {
  DirectoryEntryApiForAdapter,
  FileEntryApiForAdapter,
  PartialFileName,
  PartialStorageKey,
  StorageKey,
} from './types';
import {
  KEY_SEPARATE,
  zodPartialFileName,
  zodPartialStorageKey,
} from './types';
import { createLogModule } from '../logger';
import { parseSelf } from '../validateZodScheme';

export const partialKeyToFileName = (
  key: PartialStorageKey,
): PartialFileName => {
  log.debug('keyToFileName', key);
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

const log = createLogModule('createFSStorageAdapter');

export const createFSStorageAdapter = (
  directoryEntryApi: DirectoryEntryApiForAdapter,
): StorageAdapterInterface => {
  const load = async (
    key: PartialStorageKey,
  ): Promise<Uint8Array | undefined> => {
    log.debug('load', key);

    const fileName = partialKeyToFileName(key);

    const listFromDirectory = await directoryEntryApi.getList();

    const entry = listFromDirectory.get(fileName);
    if (entry && 'read' in entry) {
      const file = await entry.read();

      return new Uint8Array(await file.arrayBuffer());
    }

    return undefined;
  };

  const save = async (key: StorageKey, data: Uint8Array) => {
    log.debug('save', key);

    const fileName = partialKeyToFileName(key);

    await directoryEntryApi.writeFile(fileName, data);
  };

  const remove = async (key: StorageKey) => {
    log.debug('remove', key);

    const fileName = partialKeyToFileName(key);

    await directoryEntryApi.removeByName(fileName);
  };

  const loadRange = async (keyPrefix: PartialStorageKey): Promise<Chunk[]> => {
    log.debug('loadRange', keyPrefix);

    const keyPrefixString: PartialFileName = parseSelf(
      keyPrefix.join(KEY_SEPARATE),
      zodPartialFileName,
    );

    const listFromDirectory = await directoryEntryApi.getList();

    const fileList: {
      key: PartialStorageKey;
      entry: FileEntryApiForAdapter;
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
    log.debug('removeRange', keyPrefix);

    const keyPrefixString: PartialFileName = parseSelf(
      keyPrefix.join(KEY_SEPARATE),
      zodPartialFileName,
    );

    const listFromDirectory = await directoryEntryApi.getList();

    const removeEntryList: FileEntryApiForAdapter[] = [];

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
