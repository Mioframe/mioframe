import type { Promisable } from 'type-fest';
import type { output } from 'zod/v4-mini';
import {
  literal,
  optional,
  string,
  templateLiteral,
  tuple,
  union,
} from 'zod/v4-mini';
import { zodSimpleDocumentId, zodStrictDocumentId } from '../automerge';

export const zodHash = string();

export type Hash = output<typeof zodHash>;

export const zodChangedType = union([
  literal('snapshot'),
  literal('incremental'),
]);

export type ChangedType = output<typeof zodChangedType>;

const zodStorageAdapterId = literal('storage-adapter-id');

export const zodPartialStorageKey = union([
  tuple([zodStorageAdapterId]),
  tuple([zodStrictDocumentId]),
  tuple([zodStrictDocumentId, zodChangedType]),
  tuple([zodStrictDocumentId, zodChangedType, zodHash]),
]);

export type PartialStorageKey = output<typeof zodPartialStorageKey>;

export const KEY_SEPARATE = '_';

export const fileExtension = 'automerge';

const zodFileExtension = literal(`.${fileExtension}`);

export const zodAutomergeFileName = union([
  zodStorageAdapterId,
  templateLiteral([zodStorageAdapterId, zodFileExtension]),
  zodSimpleDocumentId,
  templateLiteral([zodSimpleDocumentId, zodFileExtension]),
  templateLiteral([zodSimpleDocumentId, KEY_SEPARATE, zodChangedType]),
  templateLiteral([
    zodSimpleDocumentId,
    KEY_SEPARATE,
    zodChangedType,
    zodFileExtension,
  ]),
  templateLiteral([
    zodSimpleDocumentId,
    KEY_SEPARATE,
    zodChangedType,
    KEY_SEPARATE,
    zodHash,
  ]),
  templateLiteral([
    zodSimpleDocumentId,
    KEY_SEPARATE,
    zodChangedType,
    KEY_SEPARATE,
    zodHash,
    zodFileExtension,
  ]),
]);

export type AutomergeFileName = output<typeof zodAutomergeFileName>;

export const zodStorageKey = union([
  tuple([zodStorageAdapterId]),
  tuple([zodStrictDocumentId, zodChangedType, zodHash]),
]);

export type StorageKey = output<typeof zodStorageKey>;

export const zodPartialAutomergeFileName = templateLiteral([
  zodSimpleDocumentId,
  optional(
    templateLiteral([
      KEY_SEPARATE,
      zodChangedType,
      optional(templateLiteral([KEY_SEPARATE, zodHash])),
    ]),
  ),
  optional(zodFileExtension),
]);

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
