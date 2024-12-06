import type { StorageAdapterInterface, Chunk } from '@automerge/automerge-repo';
import type {
  DirectoryForAdapter,
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
import { useNotifications } from '../../ui/Notifications';
import { find, from } from 'ix/Ix.asynciterable';
import { filter, map } from 'ix/Ix.asynciterable.operators';

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
  const { pushError } = useNotifications();

  const load = async (
    key: PartialStorageKey,
  ): Promise<Uint8Array | undefined> => {
    try {
      debug('load', key);

      const fileName = partialKeyToFileName(key);

      const [, entry] =
        (await find(from(directory.children), {
          predicate: ([name]) => name === fileName,
        })) ?? [];

      if (entry && 'read' in entry) {
        const file = await entry.read();

        return new Uint8Array(await file.arrayBuffer());
      }

      return undefined;
    } catch (error) {
      pushError('file loading error', error);
      throw error;
    }
  };

  const save = async (key: StorageKey, data: Uint8Array) => {
    try {
      debug('save', key);

      const fileName = partialKeyToFileName(key);

      await directory.writeFile(fileName, data);
    } catch (error) {
      pushError('file saving error', error);
      throw error;
    }
  };

  const remove = async (key: StorageKey) => {
    try {
      debug('remove', key);

      const fileName = partialKeyToFileName(key);

      await directory.removeByName(fileName);
    } catch (error) {
      pushError('file deletion error', error);
      throw error;
    }
  };

  const loadRange = async (keyPrefix: PartialStorageKey): Promise<Chunk[]> => {
    try {
      debug('loadRange', keyPrefix);

      const keyPrefixString: PartialFileName = parseSelf(
        keyPrefix.join(KEY_SEPARATE),
        zodPartialFileName,
      );

      const chunkList: Chunk[] = [];

      await from(directory.children)
        .pipe(
          filter(([name, entry]) => {
            debug('loadRange filter', { name, keyPrefixString });
            return 'read' in entry && name.startsWith(keyPrefixString);
          }),
          map(async ([name, entry]): Promise<Chunk> => {
            debug('loadRange map', name, entry);
            return {
              key: fileNameToPartialKey(name),
              data:
                'read' in entry
                  ? new Uint8Array(await (await entry.read()).arrayBuffer())
                  : undefined,
            };
          }),
        )
        .forEach((v) => {
          chunkList.push(v);
        });

      debug('loadRange chunkList', chunkList);

      return chunkList;
    } catch (error) {
      pushError('error loading file range', error);
      throw error;
    }
  };

  const removeRange = async (keyPrefix: PartialStorageKey) => {
    try {
      debug('removeRange', keyPrefix);

      const keyPrefixString: PartialFileName = parseSelf(
        keyPrefix.join(KEY_SEPARATE),
        zodPartialFileName,
      );

      await from(directory.children).forEach(async ([name, entry]) => {
        if ('read' in entry && name.startsWith(keyPrefixString)) {
          await entry.remove();
        }
      });
    } catch (error) {
      pushError('error deleting file range', error);
      throw error;
    }
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
