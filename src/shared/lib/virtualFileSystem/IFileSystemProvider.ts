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

/**
 * Provider-reported capabilities for a file system node.
 */
export interface FSNodeCapabilities {
  /**
   * Whether deletion is allowed right now.
   * `true` means the provider explicitly allows deletion without additional recovery.
   * `false` means the provider explicitly denies deletion.
   * `undefined` means deletion is not guaranteed; callers may attempt it and must handle runtime errors.
   */
  canDelete?: boolean | undefined;
  /**
   * Whether renaming or moving the entry is allowed right now.
   * `true` means the provider explicitly allows the operation without additional recovery.
   * `false` means the provider explicitly denies the operation.
   * `undefined` means the operation is not guaranteed; callers may attempt it and must handle runtime errors.
   */
  canChangePath?: boolean | undefined;
  /**
   * Whether mutating directory contents is allowed right now.
   * `true` means the provider explicitly allows mutations without additional recovery.
   * `false` means the provider explicitly denies mutations.
   * `undefined` means mutations are not guaranteed; callers may attempt them and must handle runtime errors.
   */
  canEditChildren?: boolean | undefined;
}

/**
 * File system node statistics interface
 */
export interface FSNodeStat {
  /** Resource type */
  type: FSNodeType;
  /** Optional provider-supplied description for directory UI */
  description?: string | undefined;
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
 * Result of a successful write operation.
 */
export interface WriteFileResult {
  /** Stat of the written file after the write completes */
  stat: FSNodeStat;
}

/**
 * Virtual file system provider interface
 * Defines the contract for file system operations
 */
export interface IFileSystemProvider {
  /**
   * Get file system node statistics by path
   * @param path - Path to the file system node.
   * @returns Promise that resolves to the node statistics
   */
  stat(path: string): Promise<FSNodeStat>;

  /**
   * Read file content
   * @param path - Path to the file.
   * @returns Promise that resolves to a File object with the file content
   */
  readFile(path: string): Promise<File>;

  /**
   * Write content to a file
   * @param path - Path to the file.
   * @param content - Content to write.
   * @param options - Write options.
   * @returns Promise that resolves to the written file stat.
   */
  writeFile(path: string, content: FileContent, options: WriteOptions): Promise<WriteFileResult>;

  /**
   * Read directory contents
   * @param path - Path to the directory.
   * @returns Promise that resolves to an array of pairs [file_name, statistics]
   */
  readDirectory(path: string): Promise<[string, FSNodeStat][]>;

  /**
   * Create a directory
   * @param path - Path to the new directory.
   * @returns Promise that resolves after the directory is created
   */
  createDirectory(path: string): Promise<void>;

  /**
   * Delete a file or directory
   * @param path - Path to the item to delete.
   * @param recursive - If true, delete recursively for directories.
   * @returns Promise that resolves after the deletion completes
   */
  delete(path: string, recursive: boolean): Promise<void>;

  /**
   * Rename a file or directory
   * @param oldPath - Old path.
   * @param newPath - New path.
   * @returns Promise that resolves after the rename operation completes
   */
  move(oldPath: string, newPath: string): Promise<void>;

  /**
   * Watch for changes in the file system (optional)
   * @param callback - Callback function to handle events.
   * @returns Function to cancel watching
   */
  watch?(callback: (event: VfsEvent) => void): (() => void) | undefined;
}
