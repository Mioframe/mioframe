import { isValidDocumentId } from '@automerge/automerge-repo';
import { isString } from 'es-toolkit';
import type { Promisable } from 'type-fest';
import type { output } from 'zod/v4-mini';
import { custom, literal, string, tuple, union } from 'zod/v4-mini';
import type { AMDocumentId } from '../cfrDocument/automergeTypes';

export const zodDocumentId = custom<AMDocumentId>(
  (val) => isValidDocumentId(val) || val === 'storage-adapter-id',
);

export const zodHash = string();

export type Hash = output<typeof zodHash>;

export const zodChangedType = union([
  literal('snapshot'),
  literal('incremental'),
]);

export type ChangedType = output<typeof zodChangedType>;

export const zodStorageKey = tuple([zodDocumentId, zodChangedType, zodHash]);

export type StorageKey = output<typeof zodStorageKey>;

export const zodPartialStorageKey = union([
  tuple([zodDocumentId]),
  tuple([zodDocumentId, zodChangedType]),
  tuple([zodDocumentId, zodChangedType, zodHash]),
]);

export type PartialStorageKey = output<typeof zodPartialStorageKey>;

export const KEY_SEPARATE = '_';

export const zodAutomergeFileName =
  custom<`${AMDocumentId}${typeof KEY_SEPARATE}${ChangedType}${typeof KEY_SEPARATE}${Hash}`>(
    (data) => {
      if (isString(data)) {
        const array = data.split(KEY_SEPARATE);
        if (array.length === 3) {
          return zodStorageKey.safeParse(array).success;
        }
      }
      return false;
    },
  );

export type AutomergeFileName = output<typeof zodAutomergeFileName>;

export const zodPartialAutomergeFileName = custom<
  | `${AMDocumentId}${typeof KEY_SEPARATE}${ChangedType}${typeof KEY_SEPARATE}${Hash}`
  | `${AMDocumentId}${typeof KEY_SEPARATE}${ChangedType}`
  | AMDocumentId
>((data) => {
  if (isString(data)) {
    const array = data.split(KEY_SEPARATE);
    return zodPartialStorageKey.safeParse(array).success;
  }
  return false;
});

export type PartialAutomergeFileName = output<
  typeof zodPartialAutomergeFileName
>;

/**
 * Файл для адаптера automerge-repo
 */
export interface FileForStorageAdapter {
  read: () => Promisable<File>;
  remove: () => Promisable<void>;
}

/**
 * Директория для адаптера automerge-repo
 * минимальный набор методов для работы с файловой системой
 */
export interface DirectoryForStorageAdapter {
  entries(): AsyncIterableIterator<
    [PropertyKey, FileForStorageAdapter | DirectoryForStorageAdapter]
  >;
  writeFile: (
    name: string,
    file?: FileSystemWriteChunkType,
  ) => Promisable<FileForStorageAdapter>;
  removeByName: (name: string) => Promisable<void>;
}
