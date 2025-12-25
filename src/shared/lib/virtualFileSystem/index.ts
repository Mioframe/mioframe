export { VirtualFileSystem } from './VirtualFileSystem';
export {
  type IFileSystemProvider,
  type FileStat,
  type FileContent,
  FileType,
  type WriteOptions,
} from './IFileSystemProvider';
export {
  EventEmitter,
  type VfsChangeType,
  type VfsEvent,
} from './EventEmitter';
export { PathUtils } from './PathUtils';
export { FileSystemError, VfsError } from './VfsError';
