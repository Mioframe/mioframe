import type { StorageAdapterInterface } from '@automerge/automerge-repo';
import type { AMChunk } from '@shared/lib/automerge';
import { zodIs } from '@shared/lib/validateZodScheme';
import { isStandardBufferView } from '@shared/lib/isStandardBufferView';
import { PathUtils, type VirtualFileSystem } from '../virtualFileSystem';
import type {
  PartialAutomergeFileName,
  PartialStorageKey,
  StorageKey,
} from './types';
import { KEY_SEPARATE, zodPartialAutomergeFileName } from './types';
import { fileNameToPartialKey } from './fileNameToPartialKey';
import { partialKeyToFileName } from './partialKeyToFileName';

export const createVFSAdapter = (
  vfs: VirtualFileSystem,
  path: string,
): StorageAdapterInterface => {
  const load = async (
    key: PartialStorageKey,
  ): Promise<Uint8Array | undefined> => {
    const fileName = partialKeyToFileName(key, { withExtension: false });

    const directoryContent = await vfs.readDirectory(path);

    if (fileName) {
      const [name] =
        directoryContent.find(([name]) => name.startsWith(fileName)) ?? [];

      if (name) {
        const filePath = PathUtils.join(path, name);

        const file = await vfs.readFile(filePath);

        return new Uint8Array(await file.arrayBuffer());
      }
    }

    return undefined;
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

    if (keyPrefixString) {
      const directoryContent = await vfs.readDirectory(path);

      const rangeContent = directoryContent.filter(([name]) =>
        name.startsWith(keyPrefixString),
      );

      const chunkList = await Promise.allSettled(
        rangeContent.map(async ([fileName]): Promise<AMChunk | undefined> => {
          const file = await vfs.readFile(PathUtils.join(path, fileName));

          const key = fileNameToPartialKey(fileName);

          if (key) {
            return {
              key,
              data: new Uint8Array(await file.arrayBuffer()),
            };
          }
          return undefined;
        }),
      );

      return chunkList.reduce((acc: AMChunk[], value) => {
        if (value.status === 'fulfilled' && value.value) {
          acc.push(value.value);
        }
        return acc;
      }, []);
    }

    return [];
  };

  const remove = async (key: StorageKey) => {
    const fileName = partialKeyToFileName(key);

    if (fileName) {
      await vfs.delete(PathUtils.join(path, fileName));
    }
  };

  const removeRange = async (keyPrefix: PartialStorageKey) => {
    const maybePartialAutomergeFileName = keyPrefix.join(KEY_SEPARATE);

    const keyPrefixString: PartialAutomergeFileName | undefined = zodIs(
      maybePartialAutomergeFileName,
      zodPartialAutomergeFileName,
    )
      ? maybePartialAutomergeFileName
      : undefined;

    if (keyPrefixString) {
      const directoryContent = await vfs.readDirectory(path);

      const rangeContent = directoryContent.filter(([name]) =>
        name.startsWith(keyPrefixString),
      );

      await Promise.allSettled(
        rangeContent.map(async ([name]) => {
          await vfs.delete(PathUtils.join(path, name));
        }),
      );
    }
  };

  const save = async (key: StorageKey, data: Uint8Array): Promise<void> => {
    const fileName = partialKeyToFileName(key);

    if (!fileName) {
      throw new Error('fileName is undefined');
    }

    const fullPath = PathUtils.join(path, fileName);

    if (data instanceof Blob || data instanceof ArrayBuffer) {
      await vfs.writeFile(fullPath, data);
    } else if (
      isStandardBufferView(data) &&
      data.byteOffset === 0 &&
      data.byteLength === data.buffer.byteLength
    ) {
      await vfs.writeFile(fullPath, data);
    } else {
      await vfs.writeFile(fullPath, new Uint8Array(data));
    }
  };

  return {
    load,
    loadRange,
    remove,
    removeRange,
    save,
  };
};
