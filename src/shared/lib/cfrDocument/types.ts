import type { output } from 'zod/v4-mini';
import { int, object, optional, string, unknown } from 'zod/v4-mini';
import type { FileForStorageAdapter } from '../fsStorageAdapter';
import type { ItemWithChildren } from '@shared/lib/useIterable';

import type { Reactive } from 'vue';
import type { AMDocumentId } from '../automerge/automergeTypes';

export const zodDocumentContent = object({
  name: string(),
  type: string(),
  body: unknown(),
  version: optional(int()),
});

/**
 * Conflict-free Replicated Document
 */
export type CFRDocumentContent = output<typeof zodDocumentContent>;

export interface CFRDocument {
  content: CFRDocumentContent | undefined;
  change: (callback: (doc: CFRDocumentContent) => void) => void;
}

/**
 * Реактивный репозиторий документов
 * @deprecated
 */
export interface RepoRef
  extends Reactive<{
    documents: Iterable<[AMDocumentId, CFRDocument]>;
  }> {
  /**
   * Создание документа
   * @param initialValue Начальное состояние документа
   * @returns
   */
  create: <Z extends typeof zodDocumentContent>(
    initialValue: output<Z>,
  ) => CFRDocument;

  /**
   * Удаление документа
   * @param documentId
   * @returns
   */
  remove: (documentId: AMDocumentId) => void;
}

interface FileForDocumentFolder extends FileForStorageAdapter {}

/**
 * Директория с любыми файлами и папками для создания DocumentFolder
 */
export interface DirectoryForDocumentFolder
  extends ItemWithChildren<
    [string, FileForDocumentFolder | DirectoryForDocumentFolder]
  > {
  /**
   * Получить имя директории
   * @returns
   */
  getName: () => string;
  /**
   * Записать файл в директорию
   * @param name - Название файла
   * @param file - Файл
   * @returns
   */
  writeFile: (
    name: string,
    file?: FileSystemWriteChunkType,
  ) => Promise<FileForDocumentFolder>;

  /**
   * Удалить файл по названию
   * @param name - Название файла
   * @returns
   */
  removeByName: (name: string) => Promise<void>;

  /**
   * Создать директорию
   * @param name - Название директории
   * @returns
   */
  createDirectory: (name: string) => Promise<DirectoryForDocumentFolder>;
}

/**
 * Базовый интерфейс элементов папки документов
 */
export interface FolderItem {
  name: string;
}
