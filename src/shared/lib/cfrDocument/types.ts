import type { DocumentId } from '@automerge/automerge-repo';
import type { TypeOf } from 'zod';
import { number, object, string, unknown } from 'zod';
import type { FileForStorageAdapter } from '../fsStorageAdapter';
import type {
  ItemWithChildren,
  Collection,
} from '@shared/ui/TreeMenu/useIterable';

import type { AutomergeValue } from '@automerge/automerge';

export type AutomergeMap = {
  [Key in string]?: AutomergeValue;
};

export const zodDocumentContent = object({
  name: string(),
  type: string(),
  body: unknown(),
  version: number().int().optional(),
});

/**
 * Conflict-free Replicated Document
 */
export type DocumentContent = TypeOf<typeof zodDocumentContent>;

// частично совместим с DocHandle // TODO: может следует разделить CFRDocument и DocHandle
export interface CFRDocument {
  doc(): Promise<DocumentContent | undefined>;
  delete(): void;
  change(callback: (doc: DocumentContent) => void): void;
  on: (
    event: 'change',
    fn: (payload: { doc?: DocumentContent }) => unknown,
  ) => void;
  off: (
    event: 'change',
    fn: (payload: { doc?: DocumentContent }) => unknown,
  ) => void;
}

/**
 * Папка с документами
 * части документов объединены в CFRDocument
 * @deprecated - Вместо папки с документами - репозитории. Не смешивать файловую структуру с репозиториями документов.
 */
export interface DocumentFolder
  extends ItemWithChildren<
    [DocumentId, CFRDocument] | [string, DocumentFolder]
  > {
  /**
   * Имя папки
   */
  name: string;

  /**
   * Создание документа
   * @param initialValue Начальное состояние документа
   * @returns
   */
  createDocument: <Z extends typeof zodDocumentContent>(
    initialValue: TypeOf<Z>,
  ) => CFRDocument;

  /**
   * Создание подпапки
   * @param name Название папки
   * @returns
   */
  createFolder: (name: string) => Promise<DocumentFolder>;
  /**
   * Удаление документа
   * @param documentId
   * @returns
   */
  remove: (documentId: DocumentId) => void;
  /**
   * Подписать обработчик на изменение содержимого папки
   * @param handler - Обработчик изменения содержимого
   * @returns
   */
  onChange: (
    handler: (
      content: Collection<[DocumentId, CFRDocument] | [string, DocumentFolder]>,
    ) => unknown,
  ) => unknown;
  /**
   * Отписать обработчик от изменения содержимого папки
   * @param handler - Обработчик подписанный ранее
   * @returns
   */
  offChange: (
    handler: (
      content: Collection<[DocumentId, CFRDocument] | [string, DocumentFolder]>,
    ) => unknown,
  ) => unknown;
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
