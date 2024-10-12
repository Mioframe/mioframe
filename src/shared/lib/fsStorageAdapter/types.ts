import type { DocumentId } from '@automerge/automerge-repo';
import { isValidDocumentId } from '@automerge/automerge-repo';
import { isString } from 'lodash-es';
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

export const zodFileName =
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

export type FileName = TypeOf<typeof zodFileName>;

export const zodPartialFileName = custom<
  | `${DocumentId}${typeof KEY_SEPARATE}${ChangedType}${typeof KEY_SEPARATE}${Hash}`
  | `${DocumentId}${typeof KEY_SEPARATE}${ChangedType}`
  | `${DocumentId}`
>((data) => {
  if (isString(data)) {
    const array = data.split(KEY_SEPARATE);
    return zodPartialStorageKey.safeParse(array).success;
  }
  return false;
});

export type PartialFileName = TypeOf<typeof zodPartialFileName>;

export interface FileForAdapter {
  read: () => Promise<File>;
  remove: () => Promise<void>;
}

export interface DirectoryForAdapter {
  get: () => Promise<Map<string, FileForAdapter | DirectoryForAdapter>>;
  writeFile: (
    name: string,
    file?: FileSystemWriteChunkType,
  ) => Promise<FileForAdapter>;
  removeByName: (name: string) => Promise<void>;
}
