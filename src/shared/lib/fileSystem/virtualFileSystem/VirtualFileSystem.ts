import type {
  FileContent,
  FileStat,
  FileType,
  IFileSystemProvider,
} from './IFileSystemProvider';
import { FileType as FileTypeEnum } from './IFileSystemProvider';
import type { VfsEvent } from './EventEmitter';
import { EventEmitter } from './EventEmitter';
import { PathUtils } from './PathUtils';
import { FileSystemError, VfsError } from './VfsError';
import { LockManager } from './LockManager';

export interface VfsWatchOptions {
  /**
   * Если true, отслеживает изменения во всех вложенных директориях.
   * Если false (по умолчанию), отслеживает только прямых потомков.
   */
  recursive?: boolean;
}

/**
 * Основной класс Виртуальной Файловой Системы (VFS).
 *
 * Предоставляет единый интерфейс для работы с файлами и директориями,
 * абстрагируясь от конкретных реализаций хранения (InMemory, IndexedDB, Network и т.д.).
 *
 * Особенности:
 * - Поддержка точек монтирования (mount points).
 * - Атомарность операций (через LockManager).
 * - Система событий (watch).
 * - Автоматическое перемещение файлов между разными провайдерами.
 */
export class VirtualFileSystem {
  private mounts: Map<
    string,
    { provider: IFileSystemProvider; unwatch: () => void }
  > = new Map();
  private events = new EventEmitter();

  private readonly locks: LockManager;

  /**
   * @param locksManager Опциональный менеджер блокировок. Если не передан, создается новый.
   */
  constructor(locksManager?: LockManager) {
    this.locks = locksManager || new LockManager();
  }

  /**
   * Подписывается на ВСЕ события файловой системы.
   * @param callback Функция обратного вызова.
   * @returns Функция для отписки.
   */
  public watch(callback: (event: VfsEvent) => void): () => void;
  /**
   * Подписывается на события по конкретному пути.
   * @param path Путь к файлу или директории.
   * @param callback Функция обратного вызова.
   * @param options Опции наблюдения (например, рекурсивно).
   * @returns Функция для отписки.
   */
  public watch(
    path: string,
    callback: (event: VfsEvent) => void,
    options?: VfsWatchOptions,
  ): () => void;

  public watch(
    pathOrCallback: string | ((event: VfsEvent) => void),
    callback?: (event: VfsEvent) => void,
    options?: VfsWatchOptions,
  ): () => void {
    let targetPath: string | null = null;
    let listener: (event: VfsEvent) => void;

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
   * Монтирует провайдер файловой системы по указанному пути.
   *
   * @param path Путь монтирования (например, '/mnt/disk1').
   * @param provider Экземпляр провайдера (например, MemoryFileSystem).
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
   * Размонтирует провайдер по указанному пути.
   * @param path Путь, по которому был смонтирован провайдер.
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
   * Определяет ответственный провайдер для указанного пути
   * и возвращает путь относительно корня этого провайдера.
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
   * Получает информацию о файле или директории.
   * @param path Абсолютный путь.
   * @returns Объект FileStat.
   */
  public async stat(path: string): Promise<FileStat> {
    const { provider, relativePath } = this.resolve(path);
    return provider.stat(relativePath);
  }

  /**
   * Читает содержимое файла.
   * @param path Абсолютный путь к файлу.
   * @returns Объект File (Blob).
   */
  public async readFile(path: string): Promise<File> {
    return this.locks.request(path, async () => {
      const { provider, relativePath } = this.resolve(path);
      return provider.readFile(relativePath);
    });
  }

  /**
   * Записывает содержимое в файл. Если файла нет — создает, если есть — перезаписывает.
   * @param path Абсолютный путь к файлу.
   * @param content Содержимое (string, Blob, BufferSource).
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
   * Читает содержимое директории.
   * @param path Абсолютный путь к директории.
   * @returns Массив кортежей [имя, тип].
   */
  public async readDirectory(path: string): Promise<[string, FileType][]> {
    const { provider, relativePath } = this.resolve(path);
    return provider.readDirectory(relativePath);
  }

  /**
   * Создает новую директорию.
   * @param path Абсолютный путь.
   * @throws VfsError если директория уже существует или родитель не найден.
   */
  public async createDirectory(path: string): Promise<void> {
    const { provider, relativePath } = this.resolve(path);
    return provider.createDirectory(relativePath);
  }

  /**
   * Удаляет файл или директорию.
   * @param path Абсолютный путь.
   * @param recursive Если true, удаляет непустые директории рекурсивно.
   */
  public async delete(path: string, recursive: boolean = false): Promise<void> {
    return this.locks.request(path, async () => {
      const { provider, relativePath } = this.resolve(path);
      return provider.delete(relativePath, recursive);
    });
  }

  /**
   * Переименовывает или перемещает файл/директорию.
   * Поддерживает перемещение между разными провайдерами (cross-provider move).
   *
   * @param oldPath Текущий путь.
   * @param newPath Новый путь.
   */
  public async rename(oldPath: string, newPath: string): Promise<void> {
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
   * Вспомогательный метод для перемещения между провайдерами.
   * Блокировки уже должны быть захвачены вызывающим методом (rename).
   */
  private async moveCrossProvider(
    oldPath: string,
    newPath: string,
  ): Promise<void> {
    const source = this.resolve(oldPath);
    const target = this.resolve(newPath);

    const stat = await source.provider.stat(source.relativePath);

    if (stat.type === FileTypeEnum.File) {
      const rawContent = await source.provider.readFile(source.relativePath);
      await target.provider.writeFile(target.relativePath, rawContent, {
        create: true,
        overwrite: true,
      });
      await source.provider.delete(source.relativePath, false);
    } else if (stat.type === FileTypeEnum.Directory) {
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
        const childSource = PathUtils.join(oldPath, name);
        const childTarget = PathUtils.join(newPath, name);

        // Рекурсивный вызов публичного API для корректной обработки вложенности
        await this.rename(childSource, childTarget);
      }

      // 4. Удаляем пустую исходную папку
      await source.provider.delete(source.relativePath, false);
    }
  }

  /**
   * Проверяет существование файла или директории.
   * @param path Абсолютный путь.
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
   * Удобный метод для чтения текстового содержимого файла.
   * @param path Абсолютный путь.
   */
  public async readText(path: string): Promise<string> {
    const file = await this.readFile(path);
    return file.text();
  }
}
