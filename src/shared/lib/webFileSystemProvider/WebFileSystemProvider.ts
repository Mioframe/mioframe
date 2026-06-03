import type {
  FileContent,
  FSNodeCapabilities,
  FSNodeStat,
  IFileSystemProvider,
  VfsEvent,
  WriteFileResult,
} from '../virtualFileSystem';
import {
  EventEmitter,
  FileSystemError,
  FSNodeType,
  PathUtils,
  VfsError,
  VfsEventSource,
  VfsEventType,
} from '../virtualFileSystem';
import type { WriteOptions } from '../virtualFileSystem/IFileSystemProvider';
import type {
  WebFileSystemAccessMode,
  WebFileSystemAccessRequiredDetails,
} from './WebFileSystemAccessRequiredError';
import { WebFileSystemAccessRequiredError } from './WebFileSystemAccessRequiredError';

/**
 * Access request context passed back to the owning service when provider permission is missing.
 */
export interface WebFileSystemProviderAccessRequiredContext {
  /** Root directory handle that needs recovery. */
  handle: FileSystemDirectoryHandle;
  /** Permission mode required for the blocked operation. */
  mode: WebFileSystemAccessMode;
}

/**
 * Optional hooks for service-owned access recovery.
 */
export interface WebFileSystemProviderOptions {
  /** Access policy for the mounted root. */
  permissionPolicy: 'originPrivateStorage' | 'userSelectedDirectory';
  /** Called when the provider needs browser permission before continuing. */
  onAccessRequired?: (
    context: WebFileSystemProviderAccessRequiredContext,
  ) => WebFileSystemAccessRequiredDetails;
}

/** Result of replaying buffered writes after access changes. */
export interface PendingWriteReplayResult {
  /** Aggregate replay outcome for the current flush attempt. */
  status: 'complete' | 'partialFailure' | 'permissionRequired';
  /** Number of buffered writes replayed successfully. */
  replayedCount: number;
  /** Number of stale buffered writes dropped after a non-permission failure. */
  failedCount: number;
}

/**
 * Creates a VFS provider backed by the browser File System Access API.
 * @param rootHandle - Root directory handle for the mounted provider.
 * @param options - Service-owned hooks for access recovery.
 * @returns VFS provider backed by browser file system handles.
 */
export const WebFileSystemProvider = (
  rootHandle: FileSystemDirectoryHandle,
  options: WebFileSystemProviderOptions,
): IFileSystemProvider & { notifyAccessChanged(): Promise<PendingWriteReplayResult> } => {
  const { onAccessRequired, permissionPolicy } = options;
  const events = new EventEmitter();
  const pendingWriteBuffer = new Map<
    string,
    {
      byteLength: number;
      content: FileContent;
      options: WriteOptions;
      path: string;
    }
  >();
  const maxPendingWriteEntries = 64;
  const maxPendingWriteBytes = 32 * 1024 * 1024;
  let pendingWriteBytes = 0;
  let flushPendingWritesPromise: Promise<PendingWriteReplayResult> | undefined;
  let flushPendingWritesQueued = false;

  const getWriteCapability = (
    permissionState: PermissionState | undefined,
  ): boolean | undefined => {
    if (permissionPolicy === 'originPrivateStorage') {
      return true;
    }

    if (permissionState === 'granted') {
      return true;
    }

    if (permissionState === 'denied') {
      return false;
    }

    return undefined;
  };

  const queryModePermission = async (
    handle: FileSystemFileHandle | FileSystemDirectoryHandle,
    mode: WebFileSystemAccessMode,
  ) => {
    return (await handle.queryPermission?.({ mode })) ?? (await handle.queryPermission?.());
  };

  const queryWritePermission = async (handle: FileSystemFileHandle | FileSystemDirectoryHandle) => {
    return queryModePermission(handle, 'readwrite');
  };

  const getFileContentByteLength = (content: FileContent): number => {
    if (typeof content === 'string') {
      return new TextEncoder().encode(content).byteLength;
    }

    if (content instanceof Blob) {
      return content.size;
    }

    if (ArrayBuffer.isView(content)) {
      return content.byteLength;
    }

    return content.byteLength;
  };

  const deleteBufferedWrite = (path: string) => {
    const existingEntry = pendingWriteBuffer.get(path);

    if (!existingEntry) {
      return;
    }

    pendingWriteBuffer.delete(path);
    pendingWriteBytes -= existingEntry.byteLength;
  };

  const bufferWrite = (path: string, content: FileContent, writeOptions: WriteOptions) => {
    const normalizedPath = PathUtils.normalize(path);
    const byteLength = getFileContentByteLength(content);
    const existingEntry = pendingWriteBuffer.get(normalizedPath);
    const nextPendingWriteBytes = pendingWriteBytes - (existingEntry?.byteLength ?? 0) + byteLength;

    if (byteLength > maxPendingWriteBytes) {
      return;
    }

    if (existingEntry) {
      if (nextPendingWriteBytes > maxPendingWriteBytes) {
        return;
      }
    } else {
      if (pendingWriteBuffer.size >= maxPendingWriteEntries) {
        return;
      }

      if (nextPendingWriteBytes > maxPendingWriteBytes) {
        return;
      }
    }

    pendingWriteBuffer.set(normalizedPath, {
      byteLength,
      content,
      options: writeOptions,
      path: normalizedPath,
    });
    pendingWriteBytes = nextPendingWriteBytes;
  };

  const isBufferedWriteAccessRequiredError = (
    error: unknown,
  ): error is WebFileSystemAccessRequiredError =>
    error instanceof WebFileSystemAccessRequiredError && error.mode === 'readwrite';

  const ensureAccess = async (mode: WebFileSystemAccessMode): Promise<void> => {
    if (permissionPolicy === 'originPrivateStorage') {
      return;
    }

    const permissionState = await queryModePermission(rootHandle, mode);

    if (permissionState !== 'granted') {
      const accessRequiredDetails = onAccessRequired?.({
        handle: rootHandle,
        mode,
      });

      if (accessRequiredDetails) {
        throw new WebFileSystemAccessRequiredError(accessRequiredDetails);
      }

      throw new VfsError(FileSystemError.NoPermissions, 'Permission required');
    }
  };

  const isLookupMiss = (
    error: unknown,
    expectedCode: FileSystemError.FileIsADirectory | FileSystemError.FileNotADirectory,
  ): error is VfsError =>
    error instanceof VfsError &&
    (error.code === FileSystemError.FileNotFound || error.code === expectedCode);

  async function getHandle(
    path: string,
    create: boolean,
    type: 'directory',
  ): Promise<FileSystemDirectoryHandle>;
  async function getHandle(
    path: string,
    create?: boolean,
    type?: 'file',
  ): Promise<FileSystemFileHandle>;
  async function getHandle(
    path: string,
    create: boolean = false,
    type: 'file' | 'directory' = 'file',
  ): Promise<FileSystemFileHandle | FileSystemDirectoryHandle> {
    const parts = PathUtils.normalize(path)
      .split('/')
      .filter((part) => part.length > 0);

    const name = parts.pop();

    if (!name) {
      return rootHandle;
    }

    let currentDir = rootHandle;

    for (const part of parts) {
      try {
        // eslint-disable-next-line no-await-in-loop -- each directory handle lookup depends on the previously resolved parent directory
        currentDir = await currentDir.getDirectoryHandle(part, {
          create: false,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError') {
          throw new VfsError(
            FileSystemError.FileNotFound,
            `Directory not found: ${part} in ${path}`,
          );
        }
        throw error;
      }
    }

    try {
      if (type === 'file') {
        return await currentDir.getFileHandle(name, { create });
      }

      return await currentDir.getDirectoryHandle(name, { create });
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === 'NotFoundError') {
          throw new VfsError(FileSystemError.FileNotFound, `Entry not found: ${name}`, error);
        }
        if (error.name === 'TypeMismatchError') {
          throw new VfsError(
            type === 'file' ? FileSystemError.FileIsADirectory : FileSystemError.FileNotADirectory,
            `Type mismatch for: ${name}`,
            error,
          );
        }
      }
      throw error;
    }
  }

  const fileHandleStat = async (
    handle: FileSystemFileHandle | FileSystemDirectoryHandle,
  ): Promise<FSNodeStat> => {
    const canWrite = getWriteCapability(await queryWritePermission(handle));

    if (handle.kind === 'file') {
      const file = await handle.getFile();

      return {
        type: FSNodeType.File,
        size: file.size,
        creationTime: file.lastModified,
        modificationTime: file.lastModified,
        capabilities: {
          canDelete: canWrite,
          canChangePath: canWrite,
        } satisfies FSNodeCapabilities,
      };
    }

    return {
      type: FSNodeType.Directory,
      capabilities: {
        canDelete: canWrite,
        canChangePath: canWrite,
        canEditChildren: canWrite,
      } satisfies FSNodeCapabilities,
    };
  };

  const lookupPath = async (
    path: string,
  ): Promise<{ handle: FileSystemFileHandle | FileSystemDirectoryHandle; stat: FSNodeStat }> => {
    const normalized = PathUtils.normalize(path);
    if (normalized === '/') {
      const canWriteRoot = getWriteCapability(await queryWritePermission(rootHandle));

      return {
        handle: rootHandle,
        stat: {
          type: FSNodeType.Directory,
          capabilities: {
            canDelete: false,
            canChangePath: false,
            canEditChildren: canWriteRoot,
          },
        },
      };
    }

    try {
      const handle = await getHandle(path, false, 'file');
      return {
        handle,
        stat: await fileHandleStat(handle),
      };
    } catch (error) {
      if (!isLookupMiss(error, FileSystemError.FileIsADirectory)) {
        throw error;
      }

      try {
        const handle = await getHandle(path, false, 'directory');
        return {
          handle,
          stat: await fileHandleStat(handle),
        };
      } catch (directoryError) {
        if (isLookupMiss(directoryError, FileSystemError.FileNotADirectory)) {
          throw new VfsError(FileSystemError.FileNotFound, `Path not found: ${path}`);
        }
        throw directoryError;
      }
    }
  };

  const stat = async (path: string): Promise<FSNodeStat> => {
    await ensureAccess('read');
    const { stat: nodeStat } = await lookupPath(path);
    return nodeStat;
  };

  const readFile = async (path: string): Promise<File> => {
    await ensureAccess('read');
    const handle = await getHandle(path, false, 'file');
    return handle.getFile();
  };

  const writeFileImpl = async (
    path: string,
    content: FileContent,
    { create, overwrite }: WriteOptions,
  ): Promise<WriteFileResult> => {
    await ensureAccess('readwrite');
    let handle: FileSystemFileHandle | undefined;

    try {
      handle = await getHandle(path, false, 'file');
      if (!overwrite) {
        throw new VfsError(FileSystemError.FileExists, `File exists: ${path}`);
      }
    } catch (error) {
      if (error instanceof VfsError && error.code === FileSystemError.FileNotFound) {
        if (!create) {
          throw error;
        }
        handle = await getHandle(path, true, 'file');
      } else {
        throw error;
      }
    }

    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();

    return {
      stat: await fileHandleStat(handle),
    };
  };

  const flushPendingWrites = async (): Promise<PendingWriteReplayResult> => {
    if (permissionPolicy !== 'userSelectedDirectory' || pendingWriteBuffer.size === 0) {
      return {
        status: 'complete',
        replayedCount: 0,
        failedCount: 0,
      };
    }

    const permissionState = await queryWritePermission(rootHandle);

    if (permissionState !== 'granted') {
      return {
        status: 'permissionRequired',
        replayedCount: 0,
        failedCount: 0,
      };
    }

    let replayedCount = 0;
    let failedCount = 0;

    for (const [path, entry] of pendingWriteBuffer.entries()) {
      try {
        // eslint-disable-next-line no-await-in-loop -- buffered writes must replay sequentially to preserve distinct-path insertion order
        await writeFileImpl(path, entry.content, entry.options);
        deleteBufferedWrite(path);
        replayedCount += 1;
      } catch (error) {
        if (isBufferedWriteAccessRequiredError(error)) {
          return {
            status: 'permissionRequired',
            replayedCount,
            failedCount,
          };
        }

        deleteBufferedWrite(path);
        failedCount += 1;
      }
    }

    return {
      status: failedCount > 0 ? 'partialFailure' : 'complete',
      replayedCount,
      failedCount,
    };
  };

  const startPendingWriteFlush = () => {
    const flushPromise = flushPendingWrites().then((result) => {
      if (!flushPendingWritesQueued || pendingWriteBuffer.size === 0) {
        return result;
      }

      flushPendingWritesQueued = false;
      startPendingWriteFlush();
      return result;
    });
    const trackedPromise = flushPromise.finally(() => {
      if (flushPendingWritesPromise === trackedPromise) {
        flushPendingWritesPromise = undefined;
      }
    });
    flushPendingWritesPromise = trackedPromise;
    void flushPendingWritesPromise.catch(() => undefined);
  };

  const writeFile = async (
    path: string,
    content: FileContent,
    writeOptions: WriteOptions,
  ): Promise<WriteFileResult> => {
    try {
      return await writeFileImpl(path, content, writeOptions);
    } catch (error) {
      if (
        permissionPolicy === 'userSelectedDirectory' &&
        isBufferedWriteAccessRequiredError(error)
      ) {
        bufferWrite(path, content, writeOptions);
      }

      throw error;
    }
  };

  const readDirectory = async (path: string): Promise<[string, FSNodeStat][]> => {
    await ensureAccess('read');
    const directoryHandle = await getHandle(path, false, 'directory');
    const entries: [string, FSNodeStat][] = [];

    for await (const [name, childHandle] of directoryHandle.entries()) {
      entries.push([name, await fileHandleStat(childHandle)]);
    }

    return entries;
  };

  const createDirectory = async (path: string): Promise<void> => {
    await ensureAccess('readwrite');
    try {
      await getHandle(path, false, 'directory');
      throw new VfsError(FileSystemError.FileExists, `Directory already exists: ${path}`);
    } catch (error) {
      if (error instanceof VfsError && error.code === FileSystemError.FileNotFound) {
        await getHandle(path, true, 'directory');
        return;
      }
      throw error;
    }
  };

  const remove = async (path: string, recursive: boolean): Promise<void> => {
    await ensureAccess('readwrite');
    const normalized = PathUtils.normalize(path);
    const { stat: nodeStat } = await lookupPath(normalized);

    if (nodeStat.capabilities?.canDelete === false) {
      throw new VfsError(
        FileSystemError.NoPermissions,
        `Deletion is not allowed for path: ${path}`,
      );
    }

    const parts = normalized.split('/').filter((part) => part.length > 0);
    const name = parts.pop();

    if (!name) {
      throw new Error('Cannot delete root');
    }

    const parentPath = `/${parts.join('/')}`;
    const parentHandle = await getHandle(parentPath, false, 'directory');

    try {
      await parentHandle.removeEntry(name, { recursive });
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === 'NotFoundError') {
          throw new VfsError(FileSystemError.FileNotFound, `Entry not found: ${path}`);
        }
        if (error.name === 'InvalidModificationError') {
          throw new VfsError(
            FileSystemError.DirectoryNotEmpty,
            'Directory not empty (use recursive=true)',
          );
        }
      }
      throw error;
    }
  };

  const move = async (oldPath: string, newPath: string): Promise<void> => {
    await ensureAccess('readwrite');
    const normalizedOld = PathUtils.normalize(oldPath);
    const normalizedNew = PathUtils.normalize(newPath);

    if (normalizedOld === normalizedNew) {
      return;
    }

    let sourceHandle: FileSystemFileHandle | FileSystemDirectoryHandle;
    let sourceStat: FSNodeStat;
    try {
      ({ handle: sourceHandle, stat: sourceStat } = await lookupPath(normalizedOld));
    } catch (error) {
      if (error instanceof VfsError && error.code === FileSystemError.FileNotFound) {
        throw new VfsError(FileSystemError.FileNotFound, `Source not found: ${oldPath}`);
      }
      throw error;
    }

    if (sourceStat.capabilities?.canChangePath === false) {
      throw new VfsError(
        FileSystemError.NoPermissions,
        `Path change is not allowed for path: ${oldPath}`,
      );
    }

    const newName = PathUtils.basename(normalizedNew);
    const newDirName = PathUtils.dirname(normalizedNew);
    const destinationDirHandle = await getHandle(newDirName, false, 'directory');
    const { stat: destinationStat } = await lookupPath(newDirName);

    if (destinationStat.capabilities?.canEditChildren === false) {
      throw new VfsError(
        FileSystemError.NoPermissions,
        `Path change is not allowed inside directory: ${newDirName}`,
      );
    }

    if (sourceHandle.move) {
      await sourceHandle.move(destinationDirHandle, newName);
      return;
    }

    if (sourceHandle.kind === 'file') {
      const file = await sourceHandle.getFile();
      const newFileHandle = await destinationDirHandle.getFileHandle(newName, {
        create: true,
      });
      const writable = await newFileHandle.createWritable();
      await writable.write(file);
      await writable.close();

      await remove(normalizedOld, false);
      return;
    }

    const newDirHandle = await destinationDirHandle.getDirectoryHandle(newName, {
      create: true,
    });

    const copyDirectoryContents = async (
      sourceDir: FileSystemDirectoryHandle,
      destDir: FileSystemDirectoryHandle,
    ): Promise<void> => {
      for await (const entry of sourceDir.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          const newFileHandle = await destDir.getFileHandle(entry.name, {
            create: true,
          });
          const writable = await newFileHandle.createWritable();
          await writable.write(file);
          await writable.close();
          continue;
        }

        const newSubDir = await destDir.getDirectoryHandle(entry.name, {
          create: true,
        });
        await copyDirectoryContents(entry, newSubDir);
      }
    };

    await copyDirectoryContents(sourceHandle, newDirHandle);
    await remove(normalizedOld, true);
  };

  const notifyAccessChanged = () => {
    if (permissionPolicy === 'userSelectedDirectory' && pendingWriteBuffer.size > 0) {
      if (flushPendingWritesPromise) {
        flushPendingWritesQueued = true;
      } else {
        startPendingWriteFlush();
      }
    }

    events.emit({
      source: VfsEventSource.PROVIDER,
      type: VfsEventType.UPDATE,
      path: '/',
    });

    return (
      flushPendingWritesPromise ??
      Promise.resolve({
        status: 'complete' as const,
        replayedCount: 0,
        failedCount: 0,
      })
    );
  };

  const watch = (callback: (event: VfsEvent) => void) => events.subscribe(callback);

  return {
    stat,
    readFile,
    writeFile,
    readDirectory,
    createDirectory,
    delete: remove,
    move,
    notifyAccessChanged,
    watch,
  };
};
