import type { Promisable } from 'type-fest';
import type { output } from 'zod/v4-mini';
import { literal, string, templateLiteral, tuple, union } from 'zod/v4-mini';
import { zodDocumentId, zodSimpleDocumentId } from '../automerge';

export const zodHash = string();

/** Hash suffix stored in Automerge incremental filenames. */
export type Hash = output<typeof zodHash>;

export const zodChangedType = union([literal('snapshot'), literal('incremental')]);

/** Supported Automerge storage change kinds. */
export type ChangedType = output<typeof zodChangedType>;

const zodStorageAdapterId = literal('storage-adapter-id');

export const zodPartialStorageKey = union([
  tuple([zodStorageAdapterId]),
  tuple([zodDocumentId]),
  tuple([zodDocumentId, zodChangedType]),
  tuple([zodDocumentId, zodChangedType, zodHash]),
]);

/** Partial storage-key tuple accepted by the filename conversion helpers. */
export type PartialStorageKey = output<typeof zodPartialStorageKey>;

export const KEY_SEPARATE = '_';

export const fileExtension = 'automerge';

const zodFileExtension = literal(`.${fileExtension}`);

export const zodAutomergeFileName = union([
  zodStorageAdapterId,
  templateLiteral([zodStorageAdapterId, zodFileExtension]),
  zodDocumentId,
  templateLiteral([zodSimpleDocumentId, zodFileExtension]),
  templateLiteral([zodSimpleDocumentId, KEY_SEPARATE, zodChangedType]),
  templateLiteral([zodSimpleDocumentId, KEY_SEPARATE, zodChangedType, zodFileExtension]),
  templateLiteral([zodSimpleDocumentId, KEY_SEPARATE, zodChangedType, KEY_SEPARATE, zodHash]),
  templateLiteral([
    zodSimpleDocumentId,
    KEY_SEPARATE,
    zodChangedType,
    KEY_SEPARATE,
    zodHash,
    zodFileExtension,
  ]),
]);

/** Full Automerge storage filename contract. */
export type AutomergeFileName = output<typeof zodAutomergeFileName>;

export const zodStorageKey = union([
  tuple([zodStorageAdapterId]),
  tuple([zodDocumentId, zodChangedType, zodHash]),
]);

/** Complete storage-key tuple for persisted Automerge files. */
export type StorageKey = output<typeof zodStorageKey>;

export const zodPartialAutomergeFileName = union([
  zodStorageAdapterId,
  templateLiteral([zodStorageAdapterId, zodFileExtension]),
  zodDocumentId,
  templateLiteral([zodSimpleDocumentId, zodFileExtension]),
  templateLiteral([zodSimpleDocumentId, KEY_SEPARATE, zodChangedType]),
  templateLiteral([zodSimpleDocumentId, KEY_SEPARATE, zodChangedType, zodFileExtension]),
  templateLiteral([zodSimpleDocumentId, KEY_SEPARATE, zodChangedType, KEY_SEPARATE, zodHash]),
  templateLiteral([
    zodSimpleDocumentId,
    KEY_SEPARATE,
    zodChangedType,
    KEY_SEPARATE,
    zodHash,
    zodFileExtension,
  ]),
]);

/** Filename variants that can be produced from a partial storage key. */
export type PartialAutomergeFileName = output<typeof zodPartialAutomergeFileName>;

/**
 * Файл для адаптера automerge-repo
 */
export interface FileForStorageAdapter {
  /** Reads the current file contents. */
  read: () => Promisable<File>;
  /** Removes the file when the backing storage supports deletion. */
  remove?: () => Promisable<void>;
}

/**
 * Директория для адаптера automerge-repo
 * минимальный набор методов для работы с файловой системой
 */
export interface DirectoryForStorageAdapter {
  /** Iterates child files and directories. */
  entries():
    | AsyncIterableIterator<[PropertyKey, FileForStorageAdapter | DirectoryForStorageAdapter]>
    | IterableIterator<[PropertyKey, FileForStorageAdapter | DirectoryForStorageAdapter]>;
  /** Writes a child file by name when the backing storage supports writes. */
  writeFile?: (name: string, file?: FileSystemWriteChunkType) => Promisable<FileForStorageAdapter>;
  /** Removes a child entry by name when the backing storage supports deletion. */
  removeByName?: (name: string) => Promisable<void>;
}
