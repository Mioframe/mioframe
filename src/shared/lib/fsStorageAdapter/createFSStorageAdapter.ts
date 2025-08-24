import type {
  DirectoryForStorageAdapter,
  PartialAutomergeFileName,
  PartialStorageKey,
  StorageKey,
} from './types';
import {
  fileExtension,
  KEY_SEPARATE,
  zodPartialAutomergeFileName,
  zodPartialStorageKey,
} from './types';
import { zodIs } from '../validateZodScheme';
import { find, from, toArray } from 'ix/Ix.asynciterable';
import { filter, map } from 'ix/Ix.asynciterable.operators';
import { isNil, isString } from 'es-toolkit';
import type {
  AMChunk,
  AMStorageAdapterInterface,
} from '../automerge/automergeTypes';
import { useSnackbar } from '@shared/ui/Snackbar';
import { toString } from 'es-toolkit/compat';

export const partialKeyToFileName = (
  key: PartialStorageKey,
  { withExtension = true }: { withExtension: boolean },
): PartialAutomergeFileName | undefined => {
  const partialStorageKey = zodIs(key, zodPartialStorageKey) ? key : undefined;

  if (partialStorageKey) {
    const maybePartialAutomergeFileName = withExtension
      ? `${partialStorageKey.join(KEY_SEPARATE)}.${fileExtension}`
      : partialStorageKey.join(KEY_SEPARATE);

    return zodIs(maybePartialAutomergeFileName, zodPartialAutomergeFileName)
      ? maybePartialAutomergeFileName
      : undefined;
  }

  return undefined;
};

export const fileNameToPartialKey = (
  fileName: unknown,
): PartialStorageKey | undefined => {
  const partialAutomergeFileName = zodIs(fileName, zodPartialAutomergeFileName)
    ? fileName
    : undefined;

  const maybePartialStorageKey = partialAutomergeFileName
    ?.replace(`.${fileExtension}`, '')
    .split(KEY_SEPARATE);

  return zodIs(maybePartialStorageKey, zodPartialStorageKey)
    ? maybePartialStorageKey
    : undefined;
};

export const createStorageAdapter = (
  directory: DirectoryForStorageAdapter,
): AMStorageAdapterInterface => {
  const { addSnackbar } = useSnackbar();

  const findEntry = async (key: PartialStorageKey) => {
    const fileName = partialKeyToFileName(key, { withExtension: false });
    if (fileName) {
      const [, entry] =
        (await find(from(directory.entries()), {
          predicate: ([name]) => toString(name).startsWith(fileName),
        })) ?? [];

      return entry;
    }

    return undefined;
  };

  const load = async (
    key: PartialStorageKey,
  ): Promise<Uint8Array | undefined> => {
    try {
      const entry = await findEntry(key);

      if (entry && 'read' in entry) {
        const file = await entry.read();

        return new Uint8Array(await file.arrayBuffer());
      }

      return undefined;
    } catch (error) {
      addSnackbar({
        text: error instanceof Error ? error.message : 'file loading error',
      });

      console.debug('load', key);

      throw error;
    }
  };

  const save = async (key: StorageKey, data: Uint8Array<ArrayBuffer>) => {
    try {
      const fileName = partialKeyToFileName(key);
      if (!fileName) {
        throw new Error('fileName is undefined');
      }
      await directory.writeFile(fileName, data);
    } catch (error) {
      addSnackbar({
        text: error instanceof Error ? error.message : 'file saving error',
      });

      console.debug('save', data);

      throw error;
    }
  };

  const remove = async (key: StorageKey) => {
    try {
      const entry = await findEntry(key);

      if (entry && 'remove' in entry) {
        await entry.remove();
      }
    } catch (error) {
      addSnackbar({
        text: error instanceof Error ? error.message : 'file deletion error',
      });

      console.debug('remove', key);

      throw error;
    }
  };

  const loadRange = async (
    keyPrefix: PartialStorageKey,
  ): Promise<AMChunk[]> => {
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
            return (
              'read' in entry &&
              !!keyPrefixString &&
              isString(name) &&
              name.startsWith(keyPrefixString)
            );
          }),
          map(async ([name, entry]): Promise<AMChunk | undefined> => {
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

      return chunkList;
    } catch (error) {
      addSnackbar({
        text:
          error instanceof Error ? error.message : 'error loading file range',
      });

      console.debug('loadRange', keyPrefix);

      throw error;
    }
  };

  const removeRange = async (keyPrefix: PartialStorageKey) => {
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
      addSnackbar({
        text:
          error instanceof Error ? error.message : 'error deleting file range',
      });

      console.debug('removeRange', keyPrefix);

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
