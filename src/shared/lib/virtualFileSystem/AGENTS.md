# src/shared/lib/virtualFileSystem - OPFS Abstraction

**Scope:** OPFS (Origin Private File System) abstraction layer with event system. Core filesystem API for local-first storage. 14 files.

## CLASSES

### VirtualFileSystem
Main class for OPFS operations.

**Methods**:
- `openDirectory()`, `createDirectory()`
- `readFile()`, `writeFile()`, `deleteFile()`
- `directoryContent()`, `tree()`
- Event system for file changes

### PathUtils
Path manipulation utilities.

### EventEmitter
Event system for filesystem changes.

### LockManager
File locking to prevent concurrent modifications.

## ERROR TYPES

- `FileSystemError` - Generic FS errors
- `VfsError` - Virtual FS specific errors

## EXPORTS

```typescript
export { VirtualFileSystem } from './VirtualFileSystem';
export { PathUtils } from './PathUtils';
export { EventEmitter, VfsError, FileSystemError };
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| File Operations | `VirtualFileSystem.ts` | Read/write/delete |
| Path Handling | `PathUtils.ts` | Path normalization |
| Events | `EventEmitter.ts` | Change notifications |
| Locking | `LockManager.ts` | Concurrent access |

## ANTI-PATTERNS
- **NEVER** bypass VirtualFileSystem for direct OPFS access
- **NEVER** omit error handling in FS operations
- **NEVER** skip event listeners cleanup

## DEPRECATED
- Direct OPFS calls - use VirtualFileSystem
