import type { StorageAdapterInterface, Chunk } from '@automerge/automerge-repo';
import type {
  DirectoryForStorageAdapter,
  PartialAutomergeFileName,
  PartialStorageKey,
  StorageKey,
} from './types';
import {
  KEY_SEPARATE,
  zodPartialAutomergeFileName,
  zodPartialStorageKey,
} from './types';
import { createLogger } from '../logger';
import { checkSchema } from '../validateZodScheme';
import { find, from, toArray } from 'ix/Ix.asynciterable';
import { filter, map } from 'ix/Ix.asynciterable.operators';
import { isNil, isString } from 'lodash-es';
import { useNotifications } from '@shared/ui/Notifications';

export const partialKeyToFileName = (
  key: PartialStorageKey,
): PartialAutomergeFileName | undefined => {
  debug('keyToFileName', key);
  return checkSchema(
    checkSchema(key, zodPartialStorageKey).join(KEY_SEPARATE),
    zodPartialAutomergeFileName,
  );
};

export const fileNameToPartialKey = (
  fileName: unknown,
): PartialStorageKey | undefined =>
  checkSchema(
    checkSchema(fileName, zodPartialAutomergeFileName)?.split(KEY_SEPARATE),
    zodPartialStorageKey,
  );

const { debug } = createLogger('createFSStorageAdapter');

export const createStorageAdapter = (
  directory: DirectoryForStorageAdapter,
): StorageAdapterInterface => {
  const { pushError } = useNotifications();

  const load = async (
    key: PartialStorageKey,
  ): Promise<Uint8Array | undefined> => {
    debug('load', key);
    try {
      const fileName = partialKeyToFileName(key);

      const [, entry] =
        (await find(from(directory.entries()), {
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
    debug('save', key);
    try {
      const fileName = partialKeyToFileName(key);
      if (!fileName) {
        throw new Error('fileName is undefined');
      }
      await directory.writeFile(fileName, data);
    } catch (error) {
      pushError('file saving error', error);
      throw error;
    }
  };

  const remove = async (key: StorageKey) => {
    debug('remove', key);
    try {
      const fileName = partialKeyToFileName(key);
      if (!fileName) {
        throw new Error('fileName is undefined');
      }
      await directory.removeByName(fileName);
    } catch (error) {
      pushError('file deletion error', error);
      throw error;
    }
  };

  const loadRange = async (keyPrefix: PartialStorageKey): Promise<Chunk[]> => {
    debug('loadRange', keyPrefix);
    try {
      const keyPrefixString: PartialAutomergeFileName | undefined = checkSchema(
        keyPrefix.join(KEY_SEPARATE),
        zodPartialAutomergeFileName,
      );

      const chunkList: Chunk[] = await toArray(
        from(directory.entries()).pipe(
          filter(([name, entry]) => {
            debug('loadRange filter', { name, keyPrefixString });
            return (
              'read' in entry &&
              !!keyPrefixString &&
              isString(name) &&
              name.startsWith(keyPrefixString)
            );
          }),
          map(async ([name, entry]): Promise<Chunk | undefined> => {
            debug('loadRange map', name, entry);

            const key = fileNameToPartialKey(name);

            if (key) {
              return {
                key,
                data:
                  'read' in entry
                    ? new Uint8Array(await (await entry.read()).arrayBuffer())
                    : undefined,
              };
            }
          }),
          filter((v) => !isNil(v)),
        ),
      );

      debug('loadRange chunkList', chunkList);

      return chunkList;
    } catch (error) {
      pushError('error loading file range', error);
      throw error;
    }
  };

  const removeRange = async (keyPrefix: PartialStorageKey) => {
    debug('removeRange', keyPrefix);
    try {
      const keyPrefixString: PartialAutomergeFileName | undefined = checkSchema(
        keyPrefix.join(KEY_SEPARATE),
        zodPartialAutomergeFileName,
      );

      await from(directory.entries()).forEach(async ([name, entry]) => {
        if (
          'read' in entry &&
          keyPrefixString &&
          isString(name) &&
          name.startsWith(keyPrefixString)
        ) {
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
