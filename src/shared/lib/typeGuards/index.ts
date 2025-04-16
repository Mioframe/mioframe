export { isEnumValue } from './isEnum';

export const isFileSystemDirectoryHandle = (
  v: unknown,
): v is FileSystemDirectoryHandle => v instanceof FileSystemDirectoryHandle;
