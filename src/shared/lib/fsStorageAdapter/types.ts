import type { DocumentId } from '@automerge/automerge-repo';
import { isValidDocumentId } from '@automerge/automerge-repo';
import { isString } from 'lodash-es';
import type { Promisable } from 'type-fest';
import type { TypeOf } from 'zod';
import { custom, literal, string, tuple, union } from 'zod';

export const zodDocumentId = custom<DocumentId>(
  (val) => isValidDocumentId(val) || val === 'storage-adapter-id',
);

export const zodHash = string();

export type Hash = TypeOf<typeof zodHash>;

export const zodChangedType = literal('snapshot').or(literal('incremental'));

export type ChangedType = TypeOf<typeof zodChangedType>;

export const zodStorageKey = tuple([zodDocumentId, zodChangedType, zodHash]);

export type StorageKey = TypeOf<typeof zodStorageKey>;

export const zodPartialStorageKey = union([
  tuple([zodDocumentId]),
  tuple([zodDocumentId, zodChangedType]),
  tuple([zodDocumentId, zodChangedType, zodHash]),
]);

export type PartialStorageKey = TypeOf<typeof zodPartialStorageKey>;

export const KEY_SEPARATE = '_';

export const zodAutomergeFileName =
  custom<`${DocumentId}${typeof KEY_SEPARATE}${ChangedType}${typeof KEY_SEPARATE}${Hash}`>(
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

export type AutomergeFileName = TypeOf<typeof zodAutomergeFileName>;

export const zodPartialAutomergeFileName = custom<
  | `${DocumentId}${typeof KEY_SEPARATE}${ChangedType}${typeof KEY_SEPARATE}${Hash}`
  | `${DocumentId}${typeof KEY_SEPARATE}${ChangedType}`
  | DocumentId
>((data) => {
  if (isString(data)) {
    const array = data.split(KEY_SEPARATE);
    return zodPartialStorageKey.safeParse(array).success;
  }
  return false;
});

export type PartialAutomergeFileName = TypeOf<
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
