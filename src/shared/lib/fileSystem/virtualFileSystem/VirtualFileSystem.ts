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
  recursive?: boolean;
}

export class VirtualFileSystem {
  private mounts: Map<
    string,
    { provider: IFileSystemProvider; unwatch: () => void }
  > = new Map();
  private events = new EventEmitter();

  private readonly locks: LockManager;

  constructor(locksManager?: LockManager) {
    this.locks = locksManager || new LockManager();
  }

  // fixme: упростить watch, что бы всегда указывать путь отслеживания
  public watch(callback: (event: VfsEvent) => void): () => void;
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

  public mount(path: string, provider: IFileSystemProvider): void {
    const normalizedMountPath = PathUtils.normalize(path);

    if (this.mounts.has(normalizedMountPath)) {
      this.unmount(normalizedMountPath);
    }

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

  public unmount(path: string): void {
    const normalized = PathUtils.normalize(path);
    const mount = this.mounts.get(normalized);
    if (mount) {
      mount.unwatch();
      this.mounts.delete(normalized);
    }
  }

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
  public async stat(path: string): Promise<FileStat> {
    const { provider, relativePath } = this.resolve(path);
    return provider.stat(relativePath);
  }

  public async readFile(path: string): Promise<File> {
    return this.locks.request(path, async () => {
      const { provider, relativePath } = this.resolve(path);
      return provider.readFile(relativePath);
    });
  }

  public async writeFile(path: string, content: FileContent): Promise<void> {
    return this.locks.request(path, async () => {
      const { provider, relativePath } = this.resolve(path);
      return provider.writeFile(relativePath, content, {
        create: true,
        overwrite: true,
      });
    });
  }

  public async readDirectory(path: string): Promise<[string, FileType][]> {
    const { provider, relativePath } = this.resolve(path);
    return provider.readDirectory(relativePath);
  }

  public async createDirectory(path: string): Promise<void> {
    const { provider, relativePath } = this.resolve(path);
    return provider.createDirectory(relativePath);
  }

  public async delete(path: string, recursive: boolean = false): Promise<void> {
    return this.locks.request(path, async () => {
      const { provider, relativePath } = this.resolve(path);
      return provider.delete(relativePath, recursive);
    });
  }

  public async rename(oldPath: string, newPath: string): Promise<void> {
    return this.locks.request(oldPath, async () => {
      return this.locks.request(newPath, async () => {
        const source = this.resolve(oldPath);
        const target = this.resolve(newPath);

        if (source.provider === target.provider) {
          return source.provider.rename(
            source.relativePath,
            target.relativePath,
          );
        }

        // Cross-provider move implementation
        await this.moveCrossProvider(oldPath, newPath);
      });
    });
  }

  /**
   * Helper for moving files/folders across different providers.
   * Assumes locks for oldPath and newPath are already acquired by the caller (rename).
   */
  private async moveCrossProvider(
    oldPath: string,
    newPath: string,
  ): Promise<void> {
    const source = this.resolve(oldPath);
    const target = this.resolve(newPath);

    // Get stats directly from provider to decide strategy
    const stat = await source.provider.stat(source.relativePath);

    if (stat.type === FileTypeEnum.File) {
      // 1. Read source
      const rawContent = await source.provider.readFile(source.relativePath);

      // 2. Write target (create if needed)
      await target.provider.writeFile(target.relativePath, rawContent, {
        create: true,
        overwrite: true,
      });

      // 3. Delete source
      await source.provider.delete(source.relativePath, false);
    } else if (stat.type === FileTypeEnum.Directory) {
      // 1. Create target directory
      try {
        await target.provider.createDirectory(target.relativePath);
      } catch (e: unknown) {
        const err = e;
        if (!(err instanceof VfsError)) throw e;
        if (err.code !== FileSystemError.FileExists) throw e;
      }

      // 2. Read children
      const entries = await source.provider.readDirectory(source.relativePath);

      // 3. Move children recursively
      for (const [name] of entries) {
        const childSource = PathUtils.join(oldPath, name);
        const childTarget = PathUtils.join(newPath, name);

        // RECURSION: Call the public API rename()
        await this.rename(childSource, childTarget);
      }

      // 4. Delete empty source directory
      await source.provider.delete(source.relativePath, false);
    }
  }

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

  public async readText(path: string): Promise<string> {
    const file = await this.readFile(path);
    return file.text();
  }
}
