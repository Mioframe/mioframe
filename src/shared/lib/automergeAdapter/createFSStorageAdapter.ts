import type {
  DirectoryForStorageAdapter,
  PartialAutomergeFileName,
  PartialStorageKey,
  StorageKey,
} from './types';
import { KEY_SEPARATE, zodPartialAutomergeFileName } from './types';
import { zodIs } from '../validateZodScheme';
import { find, from, toArray } from 'ix/Ix.asynciterable';
import { filter, map } from 'ix/Ix.asynciterable.operators';
import { isNil, isString } from 'es-toolkit';
import type {
  AMChunk,
  AMStorageAdapterInterface,
} from '../automerge/automergeTypes';
import { toString } from 'es-toolkit/compat';
import { partialKeyToFileName } from './partialKeyToFileName';
import { fileNameToPartialKey } from './fileNameToPartialKey';

export const createFSStorageAdapter = (
  directory: DirectoryForStorageAdapter,
): AMStorageAdapterInterface => {
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
    const entry = await findEntry(key);

    if (entry && 'read' in entry) {
      const file = await entry.read();

      return new Uint8Array(await file.arrayBuffer());
    }

    return undefined;
  };

  const save = async (key: StorageKey, data: Uint8Array<ArrayBuffer>) => {
    const fileName = partialKeyToFileName(key);
    if (!fileName) {
      throw new Error('fileName is undefined');
    }

    if (!('writeFile' in directory)) {
      // eslint-disable-next-line no-console -- warning about missing writeFile capability
      console.warn(
        "FSStorageAdapter couldn't write new file, because a directory don't have writeFile method",
      );
    }

    await directory.writeFile?.(fileName, data);
  };

  const remove = async (key: StorageKey) => {
    const entry = await findEntry(key);

    if (entry && 'remove' in entry) {
      if (!('remove' in entry)) {
        // eslint-disable-next-line no-console -- warning about missing remove capability
        console.warn(
          "FSStorageAdapter couldn't remove the entry, because this entry don't have remove method",
        );
      }

      await entry.remove?.();
    }
  };

  const loadRange = async (
    keyPrefix: PartialStorageKey,
  ): Promise<AMChunk[]> => {
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

          return undefined;
        }),
        filter((v) => !isNil(v)),
      ),
    );

    return chunkList;
  };

  const removeRange = async (keyPrefix: PartialStorageKey) => {
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
        if (!('remove' in entry)) {
          // eslint-disable-next-line no-console -- warning about missing remove capability
          console.warn(
            "FSStorageAdapter couldn't remove the entry, because this entry don't have remove method",
          );
        }

        await entry.remove?.();
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
