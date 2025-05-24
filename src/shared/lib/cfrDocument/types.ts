import type { DocumentId } from '@automerge/automerge-repo';
import type { output } from 'zod/v4-mini';
import { int, object, optional, string, unknown } from 'zod/v4-mini';
import type { FileForStorageAdapter } from '../fsStorageAdapter';
import type { ItemWithChildren } from '@shared/lib/useIterable';

import type { AutomergeValue } from '@automerge/automerge';
import type { ComputedRef, Reactive } from 'vue';

export type AutomergeMap = {
  [Key in string]?: AutomergeValue;
};

export const zodDocumentContent = object({
  name: string(),
  type: string(),
  body: unknown(),
  version: optional(int()),
});

/**
 * Conflict-free Replicated Document
 */
export type DocumentContent = output<typeof zodDocumentContent>;

export interface UseCFRDocument {
  content: ComputedRef<DocumentContent | undefined>;
  name: ComputedRef<string | undefined>;
  documentType: ComputedRef<string | undefined>;
  readDoc: () => Promise<DocumentContent | undefined>;
  change: (callback: (doc: DocumentContent) => void) => void;
}

/**
 * Реактивный репозиторий документов
 * @deprecated
 */
export interface RepoRef
  extends Reactive<{
    documents: Iterable<[DocumentId, UseCFRDocument]>;
  }> {
  /**
   * Создание документа
   * @param initialValue Начальное состояние документа
   * @returns
   */
  create: <Z extends typeof zodDocumentContent>(
    initialValue: output<Z>,
  ) => UseCFRDocument;

  /**
   * Удаление документа
   * @param documentId
   * @returns
   */
  remove: (documentId: DocumentId) => void;
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
