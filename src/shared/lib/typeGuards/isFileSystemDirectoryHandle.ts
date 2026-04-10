export const isFileSystemDirectoryHandle = (v: unknown): v is FileSystemDirectoryHandle => {
  if (!('FileSystemDirectoryHandle' in globalThis)) {
    return false;
  }

  return v instanceof FileSystemDirectoryHandle;
};
