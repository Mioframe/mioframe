export const isFileSystemDirectoryHandle = (
  v: unknown,
): v is FileSystemDirectoryHandle => v instanceof FileSystemDirectoryHandle;
