import type {
  IFileSystemProvider,
  FileContent,
  FSNodeCapabilities,
  FSNodeStat,
  WriteOptions,
} from './IFileSystemProvider';
import { FSNodeType } from './IFileSystemProvider';
import { FileSystemError, VfsError } from './VfsError';
import { PathUtils } from './PathUtils';

interface FileEntry extends FSNodeStat {
  type: FSNodeType.File;
  content: File;
}

interface DirectoryEntry extends FSNodeStat {
  type: FSNodeType.Directory;
}

type AnyEntry = FileEntry | DirectoryEntry;

/**
 * In-memory file system implementation.
 * All data is stored in RAM and will be lost on page/application reload.
 * Used for temporary files, tests, or caching.
 */
export class MemoryFileSystem implements IFileSystemProvider {
  /** Storage: Path -> Entry object */
  private store: Map<string, AnyEntry> = new Map();

  private static readonly ROOT_CAPABILITIES = {
    canDelete: false,
    canChangePath: false,
    canEditChildren: true,
  } satisfies FSNodeCapabilities;

  private static readonly FILE_CAPABILITIES = {
    canDelete: true,
    canChangePath: true,
  } satisfies FSNodeCapabilities;

  private static readonly DIRECTORY_CAPABILITIES = {
    canDelete: true,
    canChangePath: true,
    canEditChildren: true,
  } satisfies FSNodeCapabilities;

  constructor() {
    // Initialize the root directory
    this.store.set('/', {
      type: FSNodeType.Directory,
      size: 0,
      creationTime: Date.now(),
      modificationTime: Date.now(),
      capabilities: MemoryFileSystem.ROOT_CAPABILITIES,
    });
  }

  /**
   * Retrieves an entry from the file system store.
   * @param path - The path to the entry to retrieve
   * @returns The entry at the specified path
   * @throws VfsError if the entry is not found
   */
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

  private getCapabilities(path: string, entry: AnyEntry): FSNodeCapabilities {
    if (path === '/') {
      return MemoryFileSystem.ROOT_CAPABILITIES;
    }

    if (entry.type === FSNodeType.Directory) {
      return entry.capabilities ?? MemoryFileSystem.DIRECTORY_CAPABILITIES;
    }

    return entry.capabilities ?? MemoryFileSystem.FILE_CAPABILITIES;
  }

  /**
   * Retrieves file system statistics for a given path.
   * @param path - The path to get statistics for
   * @returns A promise that resolves to the file system statistics
   */
  public async stat(path: string): Promise<FSNodeStat> {
    const normalized = PathUtils.normalize(path);
    const entry = this.getEntry(normalized);

    return Promise.resolve({
      type: entry.type,
      size: entry.size,
      creationTime: entry.creationTime,
      modificationTime: entry.modificationTime,
      capabilities: this.getCapabilities(normalized, entry),
    });
  }

  /**
   * Reads the contents of a directory.
   * @param path - The path of the directory to read
   * @returns A promise that resolves to an array of [filename, FSNodeStat] tuples
   * @throws VfsError if the path is not a directory
   */
  public async readDirectory(path: string): Promise<[string, FSNodeStat][]> {
    const normalized = PathUtils.normalize(path);
    const entry = this.getEntry(normalized);

    if (entry.type !== FSNodeType.Directory) {
      throw new VfsError(
        FileSystemError.FileNotADirectory,
        `${path} is not a directory`,
      );
    }

    const children: [string, FSNodeStat][] = [];
    const searchPrefix = normalized === '/' ? normalized : `${normalized}/`;

    // Linear store iteration (acceptable for MemoryFS, but optimization needed for large volumes)
    for (const [key, childEntry] of this.store.entries()) {
      if (key.startsWith(searchPrefix) && key !== normalized) {
        const relativePath = key.substring(searchPrefix.length);
        // Return only direct children
        if (!relativePath.includes('/')) {
          children.push([relativePath, childEntry]);
        }
      }
    }
    return Promise.resolve(children);
  }

  /**
   * Creates a new directory at the specified path.
   * @param path - The path where the directory should be created
   * @returns A promise that resolves when the directory is created
   * @throws VfsError if the directory already exists or parent is not a directory
   */
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

    if (parentEntry.type !== FSNodeType.Directory) {
      throw new VfsError(
        FileSystemError.FileNotADirectory,
        `Parent path ${parentPath} is not a directory`,
      );
    }

    this.store.set(normalized, {
      type: FSNodeType.Directory,
      size: 0,
      creationTime: Date.now(),
      modificationTime: Date.now(),
      capabilities: MemoryFileSystem.DIRECTORY_CAPABILITIES,
    });

    return Promise.resolve();
  }

  /**
   * Reads the contents of a file.
   * @param path - The path of the file to read
   * @returns A promise that resolves to the File object
   * @throws VfsError if the path is a directory or file not found
   */
  public async readFile(path: string): Promise<File> {
    const normalized = PathUtils.normalize(path);
    const entry = this.getEntry(normalized);

    if (entry.type !== FSNodeType.File) {
      throw new VfsError(
        FileSystemError.FileIsADirectory,
        `${path} is a directory`,
      );
    }

    return Promise.resolve(entry.content);
  }

  /**
   * Writes content to a file at the specified path.
   * @param path - The path where the file should be written
   * @param content - The content to write to the file
   * @param options - Write options including overwrite and create flags
   * @returns A promise that resolves when the file is written
   * @throws VfsError if file operations fail (e.g., file exists, parent not found)
   */
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
    if (!parentEntry || parentEntry.type !== FSNodeType.Directory) {
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
      if (entry.type !== FSNodeType.File) {
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
    } else {
      if (!options.create) {
        return Promise.reject(
          new VfsError(
            FileSystemError.FileNotFound,
            `File does not exist and create is false: ${path}`,
          ),
        );
      }
      this.store.set(normalized, {
        type: FSNodeType.File,
        content: file,
        size: file.size,
        creationTime: now,
        modificationTime: now,
        capabilities: MemoryFileSystem.FILE_CAPABILITIES,
      });
    }
  }

  /**
   * Deletes a file or directory at the specified path.
   * @param path - The path to delete
   * @param recursive - Whether to delete directories recursively
   * @returns A promise that resolves when the deletion is complete
   * @throws Error if directory is not empty and recursive is false
   */
  public async delete(path: string, recursive: boolean): Promise<void> {
    const normalized = PathUtils.normalize(path);
    const entry = this.getEntry(normalized);

    if (entry.capabilities?.canDelete !== true) {
      throw new VfsError(
        FileSystemError.NoPermissions,
        `Deletion is not allowed for path: ${path}`,
      );
    }

    if (entry.type === FSNodeType.Directory) {
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
        for (const [path, entry] of this.store.entries()) {
          if (path.startsWith(searchPrefix)) {
            if (entry.capabilities?.canDelete !== true) {
              throw new VfsError(
                FileSystemError.NoPermissions,
                `Deletion is not allowed for path: ${path}`,
              );
            }

            toDelete.add(path);
          }
        }
        toDelete.forEach((key) => this.store.delete(key));
      }
    }

    this.store.delete(normalized);
  }

  /**
   * Renames (moves) a file or directory from oldPath to newPath.
   * @param oldPath - The current path of the file or directory
   * @param newPath - The new path for the file or directory
   * @returns A promise that resolves when the rename operation is complete
   * @throws VfsError if the operation is not supported (e.g., moving directory into itself)
   */
  public async move(oldPath: string, newPath: string): Promise<void> {
    const normalizedOld = PathUtils.normalize(oldPath);
    const normalizedNew = PathUtils.normalize(newPath);

    if (normalizedOld === normalizedNew) return;

    // PROTECTION: Cannot move folder inside itself or its subfolders
    // /A -> /A/B (not allowed)
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
    if (!newParentEntry || newParentEntry.type !== FSNodeType.Directory) {
      return Promise.reject(
        new VfsError(
          FileSystemError.FileNotFound,
          `Target parent directory not found: ${newParentPath}`,
        ),
      );
    }
    if (newParentEntry.capabilities?.canEditChildren !== true) {
      throw new VfsError(
        FileSystemError.NoPermissions,
        `Path change is not allowed inside directory: ${newParentPath}`,
      );
    }

    if (entry.type === FSNodeType.Directory) {
      const searchPrefix =
        normalizedOld === '/' ? normalizedOld : `${normalizedOld}/`;
      const newPrefix =
        normalizedNew === '/' ? normalizedNew : `${normalizedNew}/`;

      const entriesToMove = new Set<[string, AnyEntry]>();

      // Collecting all nested elements
      for (const [key, childEntry] of this.store.entries()) {
        if (key.startsWith(searchPrefix) && key !== normalizedOld) {
          entriesToMove.add([key, childEntry]);
        }
      }

      // Moving nested elements
      for (const [oldKey, childEntry] of entriesToMove) {
        const relativePath = oldKey.substring(searchPrefix.length);
        const newKey = PathUtils.join(newPrefix, relativePath);

        if (childEntry.capabilities?.canChangePath !== true) {
          throw new VfsError(
            FileSystemError.NoPermissions,
            `Path change is not allowed for path: ${oldKey}`,
          );
        }

        this.store.delete(oldKey);
        this.store.set(newKey, {
          ...childEntry,
          modificationTime: Date.now(),
        });
      }

      // Moving the directory itself
      if (entry.capabilities?.canChangePath !== true) {
        throw new VfsError(
          FileSystemError.NoPermissions,
          `Path change is not allowed for path: ${normalizedOld}`,
        );
      }
      this.store.delete(normalizedOld);
      this.store.set(normalizedNew, {
        ...entry,
        modificationTime: Date.now(),
      });
    } else {
      // Moving the file
      if (entry.capabilities?.canChangePath !== true) {
        throw new VfsError(
          FileSystemError.NoPermissions,
          `Path change is not allowed for path: ${normalizedOld}`,
        );
      }
      this.store.delete(normalizedOld);
      this.store.set(normalizedNew, {
        ...entry,
        modificationTime: Date.now(),
      });
    }
  }
}
