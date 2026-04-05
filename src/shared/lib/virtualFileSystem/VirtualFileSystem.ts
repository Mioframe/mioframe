import type {
  FileContent,
  FSNodeStat,
  IFileSystemProvider,
} from './IFileSystemProvider';
import { FSNodeType } from './IFileSystemProvider';
import type { VfsEvent } from './EventEmitter';
import { EventEmitter, VfsEventSource, VfsEventType } from './EventEmitter';
import { PathUtils } from './PathUtils';
import { FileSystemError, VfsError } from './VfsError';
import { LockManager } from './LockManager';
import type { Promisable } from 'type-fest';

/**
 * Options for watching file system events.
 */
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
  /**
   * Map of mount points to their associated providers and unwatch functions.
   * Keys are normalized paths where the provider is mounted.
   */
  private mounts: Map<
    string,
    { provider: IFileSystemProvider; unwatch?: () => void }
  > = new Map();

  /**
   * Event emitter for managing VFS events.
   */
  private events = new EventEmitter();

  /**
   * Lock manager to ensure atomic operations on files.
   */
  private readonly locks: LockManager;

  /**
   * Creates a VirtualFileSystem instance.
   *
   * @param locksManager Optional lock manager. If not provided, a new one is created.
   */
  constructor(locksManager?: LockManager) {
    this.locks = locksManager ?? new LockManager();
  }

  private emitVfsEvent(event: Omit<VfsEvent, 'source'>) {
    this.events.emit({
      source: VfsEventSource.VFS,
      ...event,
    });
  }

  private emitProviderEvent(mountPath: string, event: VfsEvent) {
    const prefixedPath =
      mountPath === '/' ? event.path : PathUtils.join(mountPath, event.path);
    const prefixedNewPath = event.newPath
      ? mountPath === '/'
        ? event.newPath
        : PathUtils.join(mountPath, event.newPath)
      : undefined;

    this.events.emit({
      ...event,
      source: VfsEventSource.PROVIDER,
      path: prefixedPath,
      newPath: prefixedNewPath,
      mountPath,
      providerPath: event.path,
      providerNewPath: event.newPath,
    });
  }

  /**
   * Subscribes to events for a specific path or all paths if no path is specified.
   *
   * @param path Path to the file or directory. If not provided, listens to all VFS events.
   * @param callback Callback function to execute when an event occurs.
   * @param options Watch options (e.g., recursive).
   * @returns Function to unsubscribe from events.
   */
  public watch(
    path: string,
    callback: (event: VfsEvent) => Promisable<void>,
    options?: VfsWatchOptions,
  ): () => void;

  /**
   * Subscribes to all events with a single listener function.
   *
   * @param callback Callback function to execute when an event occurs.
   * @returns Function to unsubscribe from events.
   */
  public watch(callback: (event: VfsEvent) => Promisable<void>): () => void;

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
        // Check if event path is inside watched tree (descendants)
        const checkDescendant = (p: string) => {
          if (recursive) {
            return PathUtils.isChildOrSame(targetPath, p);
          } else {
            return PathUtils.isDirectChild(targetPath, p);
          }
        };

        // Check if event path is an ancestor of watched path (parents)
        const checkAncestor = (p: string) => {
          return PathUtils.isSameOrDescendantOf(targetPath, p);
        };

        const matchDescendant = checkDescendant(event.path);
        const matchNewDescendant = event.newPath
          ? checkDescendant(event.newPath)
          : false;
        const matchAncestor = checkAncestor(event.path);
        const matchNewAncestor = event.newPath
          ? checkAncestor(event.newPath)
          : false;

        if (
          matchDescendant ||
          matchNewDescendant ||
          matchAncestor ||
          matchNewAncestor
        ) {
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
    // Validate that path is not empty
    if (path === '') {
      throw new Error('Mount path cannot be empty');
    }

    const normalizedMountPath = PathUtils.normalize(path);

    if (this.mounts.has(normalizedMountPath)) {
      this.unmount(normalizedMountPath);
    }

    const unwatch = provider.watch?.((event) => {
      this.emitProviderEvent(normalizedMountPath, event);
    });

    this.mounts.set(normalizedMountPath, { provider, unwatch });

    // Sort mounts to prioritize more specific (longer) mount points first,
    // which is necessary for proper nested mount resolution.
    const sortedEntries = Array.from(this.mounts.entries()).sort(
      (a, b) => b[0].length - a[0].length,
    );
    const newMap = new Map<
      string,
      { provider: IFileSystemProvider; unwatch?: () => void }
    >();
    sortedEntries.forEach(([k, v]) => newMap.set(k, v));
    this.mounts = newMap;

    this.emitVfsEvent({
      type: VfsEventType.MOUNT,
      path: normalizedMountPath,
    });
  }

  /**
   * Unmounts a provider at the specified path.
   *
   * @param path Path where the provider was mounted.
   */
  public unmount(path: string): void {
    const normalized = PathUtils.normalize(path);
    const mount = this.mounts.get(normalized);
    if (mount) {
      mount.unwatch?.();
      this.mounts.delete(normalized);
      this.emitVfsEvent({ type: VfsEventType.UNMOUNT, path: normalized });
    }
  }

  /**
   * Determines the responsible provider for the specified path
   * and returns the path relative to that provider's root.
   *
   * @param path The absolute path to resolve
   * @returns Object containing the provider instance and the relative path
   * @throws VfsError if no provider is mounted at the given path
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
   *
   * @param path Absolute path to the file or directory
   * @returns Promise that resolves to FileStat object with node statistics
   */
  public async stat(path: string): Promise<FSNodeStat> {
    const { provider, relativePath } = this.resolve(path);
    return provider.stat(relativePath);
  }

  /**
   * Reads the content of a file.
   *
   * @param path Absolute path to the file
   * @returns Promise that resolves to File object (Blob)
   */
  public async readFile(path: string): Promise<File> {
    return this.locks.request(path, async () => {
      const { provider, relativePath } = this.resolve(path);
      return provider.readFile(relativePath);
    });
  }

  /**
   * Writes content to a file. If the file doesn't exist, it creates it; if it does, it overwrites it.
   *
   * @param path Absolute path to the file
   * @param content Content (string, Blob, BufferSource)
   */
  public async writeFile(path: string, content: FileContent): Promise<void> {
    return this.locks.request(path, async () => {
      const { provider, relativePath } = this.resolve(path);

      const exists = await provider
        .stat(relativePath)
        .then(() => true)
        .catch(() => false);

      await provider.writeFile(relativePath, content, {
        create: true,
        overwrite: true,
      });

      const stat = await provider.stat(relativePath);

      this.emitVfsEvent({
        type: exists ? VfsEventType.UPDATE : VfsEventType.CREATE,
        path,
        nodeType: FSNodeType.File,
        size: stat.size,
      });
    });
  }

  /**
   * Reads the contents of a directory.
   *
   * @param path Absolute path to the directory
   * @returns Promise that resolves to array of tuples [name, type]
   */
  public async readDirectory(path: string): Promise<[string, FSNodeStat][]> {
    const { provider, relativePath } = this.resolve(path);
    return provider.readDirectory(relativePath);
  }

  /**
   * Creates a new directory.
   *
   * @param path Absolute path to the new directory
   * @throws VfsError if the directory already exists or parent not found
   */
  public async createDirectory(path: string): Promise<void> {
    const { provider, relativePath } = this.resolve(path);
    await provider.createDirectory(relativePath);
    this.emitVfsEvent({
      type: VfsEventType.CREATE,
      path,
      nodeType: FSNodeType.Directory,
    });
  }

  /**
   * Deletes a file or directory.
   *
   * @param path Absolute path to the item to delete
   * @param recursive If true, deletes non-empty directories recursively
   */
  async #unlockedDelete(
    path: string,
    recursive: boolean = false,
  ): Promise<void> {
    const { provider, relativePath } = this.resolve(path);

    // Check canDelete flag before deletion
    const stat = await provider.stat(relativePath);
    if (stat.canDelete !== true) {
      throw new VfsError(
        FileSystemError.NoPermissions,
        `Deletion is not allowed for path: ${path}`,
      );
    }

    return provider.delete(relativePath, recursive);
  }

  /**
   * Deletes a file or directory.
   *
   * @param path Absolute path to the item to delete
   * @param recursive If true, deletes non-empty directories recursively
   */
  public async delete(path: string, recursive: boolean = false): Promise<void> {
    const stat = await this.stat(path);

    await this.locks.request(path, async () =>
      this.#unlockedDelete(path, recursive),
    );
    this.emitVfsEvent({
      type: VfsEventType.DELETE,
      path,
      nodeType: stat.type,
    });
  }

  /**
   * Renames or moves a file/directory.
   * Supports moving between different providers (cross-provider move).
   *
   * @param oldPath Current path of the item
   * @param newPath New path for the item
   */
  public async move(oldPath: string, newPath: string): Promise<void> {
    if (oldPath === newPath) {
      return;
    }

    // Check for recursive renaming
    // Cannot rename directory so that new name is inside old path
    // For example: /A -> /A/B (not allowed as B would be inside A)
    if (PathUtils.isChildOrSame(oldPath, newPath)) {
      throw new VfsError(
        FileSystemError.NotSupported,
        `Cannot rename directory to a path inside itself: ${oldPath} -> ${newPath}`,
      );
    }

    // Get node type before move
    const stat = await this.stat(oldPath);

    // 1. Sort paths for locking to avoid deadlock.
    // If one process does rename(A, B) and another does rename(B, A), without sorting deadlocks can occur.
    // Always lock the "smaller" path first.
    const pathA = oldPath < newPath ? oldPath : newPath;
    const pathB = oldPath < newPath ? newPath : oldPath;

    return this.locks.request(pathA, async () => {
      return this.locks.request(pathB, async () => {
        const source = this.resolve(oldPath);
        const target = this.resolve(newPath);

        if (source.provider === target.provider) {
          await source.provider.move(source.relativePath, target.relativePath);
        } else {
          await this.moveCrossProvider(oldPath, newPath);
        }

        this.emitVfsEvent({
          type: VfsEventType.RENAME,
          path: oldPath,
          newPath,
          nodeType: stat.type,
        });
      });
    });
  }

  /**
   * Helper method for moving files/directories between different providers.
   * Locks should already be acquired by the calling method (move).
   *
   * @param sourcePath Source path of the item to move
   * @param targetPath Target path where to move the item
   */

  private async moveCrossProvider(
    sourcePath: string,
    targetPath: string,
  ): Promise<void> {
    const source = this.resolve(sourcePath);
    const target = this.resolve(targetPath);

    const sourceStat = await source.provider.stat(source.relativePath);

    if (sourceStat.type === FSNodeType.File) {
      const rawContent = await source.provider.readFile(source.relativePath);
      await target.provider.writeFile(target.relativePath, rawContent, {
        create: true,
        overwrite: true,
      });

      await this.#unlockedDelete(sourcePath);
    } else if (sourceStat.type === FSNodeType.Directory) {
      try {
        await target.provider.createDirectory(target.relativePath);
      } catch (e) {
        if (!(e instanceof VfsError) || e.code !== FileSystemError.FileExists)
          throw e;
      }

      const entries = await source.provider.readDirectory(source.relativePath);

      for (const [name] of entries) {
        const childSource = PathUtils.join(sourcePath, name);
        const childTarget = PathUtils.join(targetPath, name);

        await this.move(childSource, childTarget);
      }

      await this.#unlockedDelete(sourcePath);
    }
    // Note: RENAME event is emitted by the caller (move method)
  }

  /**
   * Checks if a file or directory exists.
   *
   * @param path Absolute path to check
   * @returns Promise that resolves to true if item exists, false otherwise
   */
  public async exists(path: string): Promise<boolean> {
    try {
      await this.stat(path);
      return true;
    } catch (e: unknown) {
      if (e instanceof VfsError && e.code === FileSystemError.FileNotFound)
        return false;
      throw e;
    }
  }

  /**
   * Convenient method for reading text content from a file.
   *
   * @param path Absolute path to the file
   * @returns Promise that resolves to the text content of the file
   */
  public async readText(path: string): Promise<string> {
    const file = await this.readFile(path);
    return file.text();
  }

  /**
   * Getter for listing all mount points.
   *
   * @returns Array of mounted paths
   */
  get mountsList() {
    return Array.from(this.mounts.keys());
  }
}
