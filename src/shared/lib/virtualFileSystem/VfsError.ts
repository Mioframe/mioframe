/**
 * Enum representing file system error codes.
 * These correspond to standard POSIX error codes.
 */
export enum FileSystemError {
  /**
   * File or directory not found (ENOENT)
   */
  FileNotFound = 'ENOENT',
  /**
   * File already exists (EEXIST)
   */
  FileExists = 'EEXIST',
  /**
   * Not a directory (ENOTDIR)
   */
  FileNotADirectory = 'ENOTDIR',
  /**
   * Is a directory (EISDIR)
   */
  FileIsADirectory = 'EISDIR',
  /**
   * Permission denied (EACCES)
   */
  NoPermissions = 'EACCES',
  /**
   * Unknown error (EUNKNOWN)
   */
  Unknown = 'EUNKNOWN',
  /**
   * Operation not supported (ENOTSUP)
   */
  NotSupported = 'ENOTSUP',
  /**
   * Writable stream could not be opened for a file write (EWRITESTREAMOPEN)
   */
  WriteStreamOpenFailed = 'EWRITESTREAMOPEN',
  /**
   * Directory not empty (EDIRECTORYNOTEMPTY)
   */
  DirectoryNotEmpty = 'EDIRECTORYNOTEMPTY',
}

/**
 * Virtual File System Error class.
 * Extends the built-in Error class with additional file system error information.
 */
export class VfsError extends Error {
  /**
   * Creates a new VfsError instance.
   * @param code - The file system error code
   * @param message - Optional custom error message
   * @param cause - Optional cause of the error
   */
  constructor(
    public code: FileSystemError,
    message?: string,
    public override cause?: unknown,
  ) {
    super(message || code);
    this.name = 'VfsError';
  }
}
