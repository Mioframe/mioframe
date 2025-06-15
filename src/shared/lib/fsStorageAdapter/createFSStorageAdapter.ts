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
import { zodIs } from '../validateZodScheme';
import { find, from, toArray } from 'ix/Ix.asynciterable';
import { filter, map } from 'ix/Ix.asynciterable.operators';
import { useNotifications } from '@shared/ui/Notifications';
import { isNil, isString } from 'es-toolkit';
import type {
  AMChunk,
  AMStorageAdapterInterface,
} from '../automerge/automergeTypes';

export const partialKeyToFileName = (
  key: PartialStorageKey,
): PartialAutomergeFileName | undefined => {
  debug('keyToFileName', key);

  const partialStorageKey = zodIs(key, zodPartialStorageKey) ? key : undefined;
  const maybePartialAutomergeFileName = partialStorageKey?.join(KEY_SEPARATE);

  return zodIs(maybePartialAutomergeFileName, zodPartialAutomergeFileName)
    ? maybePartialAutomergeFileName
    : undefined;
};

export const fileNameToPartialKey = (
  fileName: unknown,
): PartialStorageKey | undefined => {
  const partialAutomergeFileName = zodIs(fileName, zodPartialAutomergeFileName)
    ? fileName
    : undefined;

  const maybePartialStorageKey = partialAutomergeFileName?.split(KEY_SEPARATE);

  return zodIs(maybePartialStorageKey, zodPartialStorageKey)
    ? maybePartialStorageKey
    : undefined;
};

const { debug } = createLogger('createFSStorageAdapter');

export const createStorageAdapter = (
  directory: DirectoryForStorageAdapter,
): AMStorageAdapterInterface => {
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
    debug('save', { key });
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
    debug('remove', { key });
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

  const loadRange = async (keyPrefix: PartialStorageKey): Promise<AMChunk[]> => {
    debug('loadRange', keyPrefix);
    try {
      const maybePartialAutomergeFileName = keyPrefix.join(KEY_SEPARATE);

      const keyPrefixString: PartialAutomergeFileName | undefined = zodIs(
        maybePartialAutomergeFileName,
        zodPartialAutomergeFileName,
      )
        ? maybePartialAutomergeFileName
        : undefined;

      const chunkList: AMChunk[] = await toArray(
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
          map(async ([name, entry]): Promise<AMChunk | undefined> => {
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
      const maybePartialAutomergeFileName = keyPrefix.join(KEY_SEPARATE);

      const keyPrefixString: PartialAutomergeFileName | undefined = zodIs(
        maybePartialAutomergeFileName,
        zodPartialAutomergeFileName,
      )
        ? maybePartialAutomergeFileName
        : undefined;

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

  const adapter: AMStorageAdapterInterface = {
    load,
    save,
    remove,
    loadRange,
    removeRange,
  };

  return adapter;
};
