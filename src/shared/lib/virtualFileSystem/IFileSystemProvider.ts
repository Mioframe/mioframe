import type { VfsEvent } from './EventEmitter';

export type FileContent = string | Blob | BufferSource;

export enum FileType {
  Unknown,
  File,
  Directory,
}

export interface FileStat {
  /** Тип ресурса */
  type: FileType;
  /** Размер в байтах */
  size: number;
  /** Время создания */
  creationTime: number;
  /** Время последнего изменения */
  modificationTime: number;
}

export interface WriteOptions {
  /** Создать файл, если он не существует */
  create: boolean;
  /** Перезаписать файл, если он существует */
  overwrite: boolean;
}

export interface IFileSystemProvider {
  stat(path: string): Promise<FileStat>;
  readFile(path: string): Promise<File>;
  writeFile(
    path: string,
    content: FileContent,
    options: WriteOptions,
  ): Promise<void>;

  readDirectory(path: string): Promise<[string, FileType][]>;
  createDirectory(path: string): Promise<void>;

  delete(path: string, recursive: boolean): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;

  // todo: добавить отслеживание по путям, или не нужно? например нужно будет отслеживать локальные папки периодическим опросом всех вложенных директорий
  watch(callback: (event: VfsEvent) => void): () => void;
}
