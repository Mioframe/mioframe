export { VirtualFileSystem } from './VirtualFileSystem';
export {
  type IFileSystemProvider,
  type FSNodeStat,
  type FileContent,
  FSNodeType,
  type WriteOptions,
} from './IFileSystemProvider';
export {
  EventEmitter,
  type VfsChangeType,
  type VfsEvent,
} from './EventEmitter';
export { PathUtils } from './PathUtils';
export { FileSystemError, VfsError } from './VfsError';
