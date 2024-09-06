import type {
  StorageAdapterInterface,
  StorageKey,
  Chunk,
} from '@automerge/automerge-repo';
import type { DirectoryEntryFSApi, FileEntryFSApi } from '../fileSystemApi';
import type { FileName } from './types';
import { KEY_SEPARATE, zodFileName, zodStorageKey } from './types';

export const keyToFileName = (key: unknown): FileName =>
  zodFileName.parse(zodStorageKey.parse(key).join(KEY_SEPARATE));

export const fileNameToKey = (fileName: unknown): StorageKey =>
  zodStorageKey.parse(zodFileName.parse(fileName).split(KEY_SEPARATE));

export const createFSStorageAdapter = (
  directoryEntryApi: DirectoryEntryFSApi,
): StorageAdapterInterface => {
  const load = async (key: StorageKey): Promise<Uint8Array | undefined> => {
    const fileName = keyToFileName(key);

    const listFromDirectory = await directoryEntryApi.getList();

    const entry = listFromDirectory.get(fileName);
    if (entry && 'read' in entry) {
      const file = await entry.read();

      return new Uint8Array(await file.arrayBuffer());
    }

    return undefined;
  };

  const save = async (key: StorageKey, data: Uint8Array) => {
    const fileName = keyToFileName(key);

    await directoryEntryApi.writeFile(fileName, data);
  };

  const remove = async (key: StorageKey) => {
    const fileName = keyToFileName(key);

    await directoryEntryApi.removeByName(fileName);
  };

  const loadRange = async (keyPrefix: StorageKey): Promise<Chunk[]> => {
    const keyPrefixString = keyPrefix.join(KEY_SEPARATE);

    const listFromDirectory = await directoryEntryApi.getList();

    const fileList: { key: StorageKey; entry: FileEntryFSApi }[] = [];

    listFromDirectory.forEach((entry, name) => {
      if (name.startsWith(keyPrefixString) && 'read' in entry) {
        const key = fileNameToKey(name);

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

  const removeRange = async (keyPrefix: StorageKey) => {
    const keyPrefixString = keyPrefix.join(KEY_SEPARATE);
    const listFromDirectory = await directoryEntryApi.getList();

    const removeEntryList: FileEntryFSApi[] = [];

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
