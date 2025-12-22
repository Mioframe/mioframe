import type {
  IFileSystemProvider,
  FileContent,
  FileStat,
  WriteOptions,
} from './IFileSystemProvider';
import { FileType } from './IFileSystemProvider';
import { FileSystemError, VfsError } from './VfsError';
import type { VfsEvent } from './EventEmitter';
import { EventEmitter } from './EventEmitter';
import { PathUtils } from './PathUtils';

interface Entry {
  path: string;
  size: number;
  creationTime: number;
  modificationTime: number;
}

interface FileEntry extends Entry {
  type: FileType.File;
  content: File;
}

interface DirectoryEntry extends Entry {
  type: FileType.Directory;
}

type AnyEntry = FileEntry | DirectoryEntry;

/**
 * Реализация файловой системы в памяти (In-Memory).
 * Все данные хранятся в RAM и теряются при перезагрузке страницы/приложения.
 * Используется для временных файлов, тестов или кеширования.
 */
export class MemoryFileSystem implements IFileSystemProvider {
  /** Хранилище: Путь -> Объект записи */
  private store: Map<string, AnyEntry> = new Map();
  private events = new EventEmitter();

  constructor() {
    // Инициализация корневой директории
    this.store.set('/', {
      path: '/',
      type: FileType.Directory,
      size: 0,
      creationTime: Date.now(),
      modificationTime: Date.now(),
    });
  }

  private getEntry(path: string): AnyEntry {
    const entry = this.store.get(path);
    if (!entry) {
      throw new VfsError(
        FileSystemError.FileNotFound,
        `File not found: ${path}`,
      );
    }
    return entry;
  }

  public async stat(path: string): Promise<FileStat> {
    const normalized = PathUtils.normalize(path);
    const entry = this.getEntry(normalized);

    return Promise.resolve({
      type: entry.type,
      size: entry.size,
      creationTime: entry.creationTime,
      modificationTime: entry.modificationTime,
    });
  }

  public async readDirectory(path: string): Promise<[string, FileType][]> {
    const normalized = PathUtils.normalize(path);
    const entry = this.getEntry(normalized);

    if (entry.type !== FileType.Directory) {
      throw new VfsError(
        FileSystemError.FileNotADirectory,
        `${path} is not a directory`,
      );
    }

    const children: [string, FileType][] = [];
    const searchPrefix = normalized === '/' ? normalized : `${normalized}/`;

    // Линейный перебор Store (для MemoryFS это допустимо, но для больших объемов нужна оптимизация)
    for (const [key, childEntry] of this.store.entries()) {
      if (key.startsWith(searchPrefix) && key !== normalized) {
        const relativePath = key.substring(searchPrefix.length);
        // Возвращаем только прямых потомков
        if (!relativePath.includes('/')) {
          children.push([relativePath, childEntry.type]);
        }
      }
    }
    return Promise.resolve(children);
  }

  public async createDirectory(path: string): Promise<void> {
    const normalized = PathUtils.normalize(path);
    if (this.store.has(normalized)) {
      throw new VfsError(
        FileSystemError.FileExists,
        `Directory already exists: ${path}`,
      );
    }

    const parentPath = PathUtils.dirname(normalized);
    const parentEntry = this.getEntry(parentPath);

    if (parentEntry.type !== FileType.Directory) {
      throw new VfsError(
        FileSystemError.FileNotADirectory,
        `Parent path ${parentPath} is not a directory`,
      );
    }

    this.store.set(normalized, {
      path: normalized,
      type: FileType.Directory,
      size: 0,
      creationTime: Date.now(),
      modificationTime: Date.now(),
    });

    this.events.emit({ type: 'create', path: normalized });
    return Promise.resolve();
  }

  public async readFile(path: string): Promise<File> {
    const normalized = PathUtils.normalize(path);
    const entry = this.getEntry(normalized);

    if (entry.type !== FileType.File) {
      throw new VfsError(
        FileSystemError.FileIsADirectory,
        `${path} is a directory`,
      );
    }

    return Promise.resolve(entry.content);
  }

  public async writeFile(
    path: string,
    content: FileContent,
    options: WriteOptions,
  ): Promise<void> {
    const normalized = PathUtils.normalize(path);
    const parentPath = PathUtils.dirname(normalized);

    const now = Date.now();
    const entry = this.store.get(normalized);
    const parentEntry = this.store.get(parentPath);

    // Проверка родительской директории
    if (!parentEntry || parentEntry.type !== FileType.Directory) {
      return Promise.reject(
        new VfsError(
          FileSystemError.FileNotFound,
          `Parent directory not found: ${parentPath}`,
        ),
      );
    }

    const fileName = PathUtils.basename(path);
    const file =
      content instanceof File
        ? content
        : new File([content], fileName, { lastModified: now });

    if (entry) {
      // Обновление существующего файла
      if (entry.type !== FileType.File) {
        return Promise.reject(
          new VfsError(
            FileSystemError.FileIsADirectory,
            `${path} is a directory`,
          ),
        );
      }
      if (!options.overwrite) {
        return Promise.reject(
          new VfsError(
            FileSystemError.FileExists,
            `File already exists and overwrite is false: ${path}`,
          ),
        );
      }

      entry.content = file;
      entry.size = file.size;
      entry.modificationTime = now;
      this.events.emit({ type: 'update', path: normalized });
    } else {
      // Создание нового файла
      if (!options.create) {
        return Promise.reject(
          new VfsError(
            FileSystemError.FileNotFound,
            `File does not exist and create is false: ${path}`,
          ),
        );
      }
      this.store.set(normalized, {
        path: normalized,
        type: FileType.File,
        content: file,
        size: file.size,
        creationTime: now,
        modificationTime: now,
      });
      this.events.emit({ type: 'create', path: normalized });
    }
    return Promise.resolve();
  }

  public async delete(path: string, recursive: boolean): Promise<void> {
    const normalized = PathUtils.normalize(path);
    const entry = this.getEntry(normalized);

    if (entry.type === FileType.Directory) {
      const searchPrefix = normalized === '/' ? normalized : `${normalized}/`;

      let hasChildren = false;
      for (const key of this.store.keys()) {
        if (key.startsWith(searchPrefix) && key !== normalized) {
          hasChildren = true;
          break;
        }
      }

      if (hasChildren && !recursive) {
        return Promise.reject(new Error(`Directory not empty: ${path}`));
      }

      if (hasChildren && recursive) {
        const toDelete = new Set<string>();
        for (const key of this.store.keys()) {
          if (key.startsWith(searchPrefix)) {
            toDelete.add(key);
          }
        }
        toDelete.forEach((key) => this.store.delete(key));
      }
    }

    this.store.delete(normalized);
    this.events.emit({ type: 'delete', path: normalized });
    return Promise.resolve();
  }

  public async rename(oldPath: string, newPath: string): Promise<void> {
    const normalizedOld = PathUtils.normalize(oldPath);
    const normalizedNew = PathUtils.normalize(newPath);

    if (normalizedOld === normalizedNew) return Promise.resolve();

    // ЗАЩИТА: Нельзя перемещать папку внутрь самой себя или ее подпапок
    // /A -> /A/B (нельзя)
    if (PathUtils.isChildOrSame(normalizedOld, normalizedNew)) {
      return Promise.reject(
        new VfsError(
          FileSystemError.NotSupported,
          `Cannot move directory into itself: ${oldPath} -> ${newPath}`,
        ),
      );
    }

    const entry = this.getEntry(normalizedOld);

    if (this.store.has(normalizedNew)) {
      return Promise.reject(
        new VfsError(
          FileSystemError.FileExists,
          `Target already exists: ${newPath}`,
        ),
      );
    }

    const newParentPath = PathUtils.dirname(normalizedNew);
    const newParentEntry = this.store.get(newParentPath);
    if (!newParentEntry || newParentEntry.type !== FileType.Directory) {
      return Promise.reject(
        new VfsError(
          FileSystemError.FileNotFound,
          `Target parent directory not found: ${newParentPath}`,
        ),
      );
    }

    if (entry.type === FileType.Directory) {
      const searchPrefix =
        normalizedOld === '/' ? normalizedOld : `${normalizedOld}/`;
      const newPrefix =
        normalizedNew === '/' ? normalizedNew : `${normalizedNew}/`;

      const entriesToMove = new Set<[string, AnyEntry]>();

      // Сбор всех вложенных элементов
      for (const [key, childEntry] of this.store.entries()) {
        if (key.startsWith(searchPrefix) && key !== normalizedOld) {
          entriesToMove.add([key, childEntry]);
        }
      }

      // Перемещение вложенных элементов
      for (const [oldKey, childEntry] of entriesToMove) {
        const relativePath = oldKey.substring(searchPrefix.length);
        const newKey = PathUtils.join(newPrefix, relativePath);

        this.store.delete(oldKey);
        this.store.set(newKey, {
          ...childEntry,
          path: newKey,
          modificationTime: Date.now(),
        });
      }

      // Перемещение самой директории
      this.store.delete(normalizedOld);
      this.store.set(normalizedNew, {
        ...entry,
        path: normalizedNew,
        modificationTime: Date.now(),
      });
    } else {
      // Перемещение файла
      this.store.delete(normalizedOld);
      this.store.set(normalizedNew, {
        ...entry,
        path: normalizedNew,
        modificationTime: Date.now(),
      });
    }

    this.events.emit({
      type: 'rename',
      path: normalizedOld,
      newPath: normalizedNew,
    });
    return Promise.resolve();
  }

  public watch(callback: (event: VfsEvent) => void): () => void {
    return this.events.subscribe(callback);
  }
}
