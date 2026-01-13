export enum FileSystemError {
  FileNotFound = 'ENOENT',
  FileExists = 'EEXIST',
  FileNotADirectory = 'ENOTDIR',
  FileIsADirectory = 'EISDIR',
  NoPermissions = 'EACCES',
  Unknown = 'EUNKNOWN',
  NotSupported = 'ENOTSUP',
}

export class VfsError extends Error {
  constructor(
    public code: FileSystemError,
    message?: string,
    public override cause?: unknown,
  ) {
    super(message || code);
    this.name = 'VfsError';
  }
}
