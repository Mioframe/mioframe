import type {
  FileContent,
  FSNodeStat,
  IFileSystemProvider,
} from './IFileSystemProvider';
import { FSNodeType as FileTypeEnum } from './IFileSystemProvider';
import type { VfsEvent } from './EventEmitter';
import { EventEmitter } from './EventEmitter';
import { PathUtils } from './PathUtils';
import { FileSystemError, VfsError } from './VfsError';
import { LockManager } from './LockManager';
import type { Promisable } from 'type-fest';

export interface VfsWatchOptions {
  /**
   * If true, watches for changes in all nested directories.
   * If false (default), watches only direct children.
   */
  recursive?: boolean;
}

/**
 * Main Virtual File System (VFS) class.
 *
 * Provides a unified interface for working with files and directories,
 * abstracting away specific storage implementations (InMemory, IndexedDB, Network, etc.).
 *
 * Features:
 * - Mount point support.
 * - Operation atomicity (via LockManager).
 * - Event system (watch).
 * - Automatic file movement between different providers.
 */
export class VirtualFileSystem {
  private mounts: Map<
    string,
    { provider: IFileSystemProvider; unwatch: () => void }
  > = new Map();
  private events = new EventEmitter();

  private readonly locks: LockManager;

  /**
   * @param locksManager Optional lock manager. If not provided, a new one is created.
   */
  constructor(locksManager?: LockManager) {
    this.locks = locksManager || new LockManager();
  }

  /**
   * Subscribes to events for a specific path.
   * @param path Path to the file or directory.
   * @param callback Callback function.
   * @param options Watch options (e.g., recursive).
   * @returns Function to unsubscribe.
   */
  public watch(
    path: string,
    callback: (event: VfsEvent) => Promisable<void>,
    options?: VfsWatchOptions,
  ): () => void;

  public watch(
    pathOrCallback: string | ((event: VfsEvent) => void),
    callback?: (event: VfsEvent) => Promisable<void>,
    options?: VfsWatchOptions,
  ): () => void {
    let targetPath: string | null = null;
    let listener: (event: VfsEvent) => Promisable<void>;

    const recursive = options?.recursive ?? false;

    if (typeof pathOrCallback === 'string') {
      if (!callback)
        throw new Error('Callback is required when watching a path');
      targetPath = PathUtils.normalize(pathOrCallback);
      listener = callback;
    } else {
      listener = pathOrCallback;
    }

    const wrappedListener = (event: VfsEvent) => {
      if (targetPath) {
        const checkPath = (p: string) => {
          if (recursive) {
            return PathUtils.isChildOrSame(targetPath, p);
          } else {
            return PathUtils.isDirectChild(targetPath, p);
          }
        };

        const matchPath = checkPath(event.path);
        const matchNewPath = event.newPath ? checkPath(event.newPath) : false;

        if (matchPath || matchNewPath) {
          listener(event);
        }
      } else {
        listener(event);
      }
    };

    return this.events.subscribe(wrappedListener);
  }

  /**
   * Mounts a file system provider at the specified path.
   *
   * @param path Mount path (e.g., '/mnt/disk1').
   * @param provider Provider instance (e.g., MemoryFileSystem).
   *
   * @example
   * vfs.mount('/data', new MemoryFileSystem());
   */
  public mount(path: string, provider: IFileSystemProvider): void {
    const normalizedMountPath = PathUtils.normalize(path);

    if (this.mounts.has(normalizedMountPath)) {
      this.unmount(normalizedMountPath);
    }

    // Подписка на события провайдера для их ретрансляции в глобальную шину VFS
    // с коррекцией путей (добавление префикса точки монтирования).
    const unwatch = provider.watch((event) => {
      const absolutePath =
        normalizedMountPath === '/'
          ? event.path
          : PathUtils.join(normalizedMountPath, event.path);

      const mappedEvent: VfsEvent = {
        ...event,
        path: absolutePath,
      };

      if (event.newPath) {
        mappedEvent.newPath =
          normalizedMountPath === '/'
            ? event.newPath
            : PathUtils.join(normalizedMountPath, event.newPath);
      }

      this.events.emit(mappedEvent);
    });

    this.mounts.set(normalizedMountPath, { provider, unwatch });

    // Сортируем точки монтирования: более длинные (специфичные) пути проверяются первыми.
    // Это нужно для корректного разрешения вложенных монтирований.
    const sortedEntries = Array.from(this.mounts.entries()).sort(
      (a, b) => b[0].length - a[0].length,
    );
    const newMap = new Map<
      string,
      { provider: IFileSystemProvider; unwatch: () => void }
    >();
    sortedEntries.forEach(([k, v]) => newMap.set(k, v));
    this.mounts = newMap;
  }

  /**
   * Unmounts a provider at the specified path.
   * @param path Path where the provider was mounted.
   */
  public unmount(path: string): void {
    const normalized = PathUtils.normalize(path);
    const mount = this.mounts.get(normalized);
    if (mount) {
      mount.unwatch();
      this.mounts.delete(normalized);
    }
  }

  /**
   * Determines the responsible provider for the specified path
   * and returns the path relative to that provider's root.
   */
  private resolve(path: string): {
    provider: IFileSystemProvider;
    relativePath: string;
  } {
    const normalized = PathUtils.normalize(path);

    for (const [mountPoint, { provider }] of this.mounts) {
      const mountCheck = mountPoint === '/' ? '/' : `${mountPoint}/`;

      if (normalized === mountPoint || normalized.startsWith(mountCheck)) {
        let relativePath = normalized.slice(mountPoint.length);
        if (!relativePath.startsWith('/')) relativePath = `/${relativePath}`;
        return { provider, relativePath };
      }
    }

    throw new VfsError(
      FileSystemError.FileNotFound,
      `No provider mounted for path: ${path}`,
    );
  }

  // --- API Methods ---

  /**
   * Gets information about a file or directory.
   * @param path Absolute path.
   * @returns FileStat object.
   */
  public async stat(path: string): Promise<FSNodeStat> {
    const { provider, relativePath } = this.resolve(path);
    return provider.stat(relativePath);
  }

  /**
   * Reads the content of a file.
   * @param path Absolute path to the file.
   * @returns File object (Blob).
   */
  public async readFile(path: string): Promise<File> {
    return this.locks.request(path, async () => {
      const { provider, relativePath } = this.resolve(path);
      return provider.readFile(relativePath);
    });
  }

  /**
   * Writes content to a file. If the file doesn't exist, it creates it; if it does, it overwrites it.
   * @param path Absolute path to the file.
   * @param content Content (string, Blob, BufferSource).
   */
  public async writeFile(path: string, content: FileContent): Promise<void> {
    return this.locks.request(path, async () => {
      const { provider, relativePath } = this.resolve(path);
      return provider.writeFile(relativePath, content, {
        create: true,
        overwrite: true,
      });
    });
  }

  /**
   * Reads the contents of a directory.
   * @param path Absolute path to the directory.
   * @returns Array of tuples [name, type].
   */
  public async readDirectory(path: string): Promise<[string, FSNodeStat][]> {
    const { provider, relativePath } = this.resolve(path);
    return provider.readDirectory(relativePath);
  }

  /**
   * Creates a new directory.
   * @param path Absolute path.
   * @throws VfsError if the directory already exists or parent not found.
   */
  public async createDirectory(path: string): Promise<void> {
    const { provider, relativePath } = this.resolve(path);
    return provider.createDirectory(relativePath);
  }

  /**
   * Deletes a file or directory.
   * @param path Absolute path.
   * @param recursive If true, deletes non-empty directories recursively.
   */
  public async delete(path: string, recursive: boolean = false): Promise<void> {
    return this.locks.request(path, async () => {
      const { provider, relativePath } = this.resolve(path);

      // Проверяем флаг canDelete перед удалением
      const stat = await provider.stat(relativePath);
      if (stat.canDelete !== true) {
        throw new VfsError(
          FileSystemError.NoPermissions,
          `Deletion is not allowed for path: ${path}`,
        );
      }

      return provider.delete(relativePath, recursive);
    });
  }

  /**
   * Renames or moves a file/directory.
   * Supports moving between different providers (cross-provider move).
   *
   * @param oldPath Current path.
   * @param newPath New path.
   */
  public async rename(oldPath: string, newPath: string): Promise<void> {
    if (oldPath === newPath) {
      return;
    }

    // Проверка на рекурсивное переименование
    // Нельзя переименовывать директорию так, чтобы новое имя было внутри старого пути
    // Например: /A -> /A/B (нельзя, так как B внутри A)
    if (PathUtils.isChildOrSame(oldPath, newPath)) {
      throw new VfsError(
        FileSystemError.NotSupported,
        `Cannot rename directory to a path inside itself: ${oldPath} -> ${newPath}`,
      );
    }

    // 1. Сортируем пути для блокировки, чтобы избежать Deadlock (взаимной блокировки).
    // Если один процесс делает rename(A, B), а другой rename(B, A), без сортировки возможен клин.
    // Всегда блокируем "меньший" путь первым.
    const pathA = oldPath < newPath ? oldPath : newPath;
    const pathB = oldPath < newPath ? newPath : oldPath;

    return this.locks.request(pathA, async () => {
      return this.locks.request(pathB, async () => {
        const source = this.resolve(oldPath);
        const target = this.resolve(newPath);

        // Оптимизация: если провайдер один и тот же, используем его нативный rename
        if (source.provider === target.provider) {
          return source.provider.rename(
            source.relativePath,
            target.relativePath,
          );
        }

        // Если провайдеры разные, выполняем перенос через Copy + Delete
        await this.moveCrossProvider(oldPath, newPath);
      });
    });
  }

  /**
   * Helper method for moving between providers.
   * Locks should already be acquired by the calling method (rename).
   */
  private async moveCrossProvider(
    sourcePath: string,
    targetPath: string,
  ): Promise<void> {
    const source = this.resolve(sourcePath);
    const target = this.resolve(targetPath);

    const sourceStat = await source.provider.stat(source.relativePath);

    if (sourceStat.type === FileTypeEnum.File) {
      const rawContent = await source.provider.readFile(source.relativePath);
      await target.provider.writeFile(target.relativePath, rawContent, {
        create: true,
        overwrite: true,
      });

      await this.delete(sourcePath);
    } else if (sourceStat.type === FileTypeEnum.Directory) {
      // 1. Создаем папку в целевом месте
      try {
        await target.provider.createDirectory(target.relativePath);
      } catch (e: unknown) {
        const err = e;
        // Игнорируем ошибку, если папка уже существует (merge strategy)
        if (!(err instanceof VfsError)) throw e;
        if (err.code !== FileSystemError.FileExists) throw e;
      }

      // 2. Читаем содержимое исходной папки
      const entries = await source.provider.readDirectory(source.relativePath);

      // 3. Рекурсивно перемещаем содержимое
      for (const [name] of entries) {
        const childSource = PathUtils.join(sourcePath, name);
        const childTarget = PathUtils.join(targetPath, name);

        // Рекурсивный вызов публичного API для корректной обработки вложенности
        await this.rename(childSource, childTarget);
      }

      // 4. Удаляем пустую исходную папку
      await this.delete(sourcePath);
    }
  }

  /**
   * Checks if a file or directory exists.
   * @param path Absolute path.
   */
  public async exists(path: string): Promise<boolean> {
    try {
      await this.stat(path);
      return true;
    } catch (e) {
      if (e instanceof VfsError && e.code === FileSystemError.FileNotFound)
        return false;
      throw e;
    }
  }

  /**
   * Convenient method for reading text content from a file.
   * @param path Absolute path.
   */
  public async readText(path: string): Promise<string> {
    const file = await this.readFile(path);
    return file.text();
  }

  get mountsList() {
    return Array.from(this.mounts.keys());
  }
}
