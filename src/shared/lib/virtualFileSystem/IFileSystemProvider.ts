import type { VfsEvent } from './EventEmitter';

/**
 * File content type for I/O operations
 * Can be a string, Blob, or BufferSource (ArrayBuffer or ArrayBufferView)
 */
export type FileContent = string | Blob | BufferSource;

/**
 * File system node type enumeration
 */
export enum FSNodeType {
  /** Unknown type */
  Unknown,
  /** File */
  File,
  /** Directory */
  Directory,
}

export interface FSNodeCapabilities {
  /** Flag that explicitly allows deletion from the file system */
  canDelete?: boolean | undefined;
  /** Flag that explicitly allows renaming or moving the entry */
  canChangePath?: boolean | undefined;
  /** Flag that explicitly allows mutating directory contents */
  canEditChildren?: boolean | undefined;
}

/**
 * File system node statistics interface
 */
export interface FSNodeStat {
  /** Resource type */
  type: FSNodeType;
  /** Size in bytes */
  size?: number | undefined;
  /** Creation time */
  creationTime?: number | undefined;
  /** Last modification time */
  modificationTime?: number | undefined;
  /** Provider-reported capabilities for the node */
  capabilities?: FSNodeCapabilities | undefined;
}

/**
 * Write options for file operations
 */
export interface WriteOptions {
  /** Create file if it doesn't exist */
  create: boolean;
  /** Overwrite file if it exists */
  overwrite: boolean;
}

/**
 * Virtual file system provider interface
 * Defines the contract for file system operations
 */
export interface IFileSystemProvider {
  /**
   * Get file system node statistics by path
   * @param path Path to the file system node
   * @returns Promise that resolves to the node statistics
   */
  stat(path: string): Promise<FSNodeStat>;

  /**
   * Read file content
   * @param path Path to the file
   * @returns Promise that resolves to a File object with the file content
   */
  readFile(path: string): Promise<File>;

  /**
   * Write content to a file
   * @param path Path to the file
   * @param content Content to write
   * @param options Write options
   * @returns Promise that resolves after the write operation completes
   */
  writeFile(path: string, content: FileContent, options: WriteOptions): Promise<void>;

  /**
   * Read directory contents
   * @param path Path to the directory
   * @returns Promise that resolves to an array of pairs [file_name, statistics]
   */
  readDirectory(path: string): Promise<[string, FSNodeStat][]>;

  /**
   * Create a directory
   * @param path Path to the new directory
   * @returns Promise that resolves after the directory is created
   */
  createDirectory(path: string): Promise<void>;

  /**
   * Delete a file or directory
   * @param path Path to the item to delete
   * @param recursive If true, delete recursively (for directories)
   * @returns Promise that resolves after the deletion completes
   */
  delete(path: string, recursive: boolean): Promise<void>;

  /**
   * Rename a file or directory
   * @param oldPath Old path
   * @param newPath New path
   * @returns Promise that resolves after the rename operation completes
   */
  move(oldPath: string, newPath: string): Promise<void>;

  /**
   * Watch for changes in the file system (optional)
   * @param callback Callback function to handle events
   * @returns Function to cancel watching
   */
  watch?(callback: (event: VfsEvent) => void): (() => void) | undefined;
}
