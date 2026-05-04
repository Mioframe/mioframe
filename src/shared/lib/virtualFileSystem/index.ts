export { VirtualFileSystem } from './VirtualFileSystem';
export {
  type IFileSystemProvider,
  type FSNodeCapabilities,
  type FSNodeStat,
  type FileContent,
  FSNodeType,
  type WriteOptions,
} from './IFileSystemProvider';
export { EventEmitter, VfsEventSource, VfsEventType, type VfsEvent } from './EventEmitter';
export { PathUtils } from './PathUtils';
export { FileSystemError, VfsError } from './VfsError';
export {
  createVfsActivityTracker,
  type VfsActivityTracker,
  type VfsActivityError,
  type VfsActivityState,
  type VfsActivityStatus,
  type VfsMutationOperationType,
} from './VfsActivityTracker';
