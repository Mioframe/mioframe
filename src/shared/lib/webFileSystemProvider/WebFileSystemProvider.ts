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

/**
 * Creates a VFS provider backed by the browser File System Access API.
 * @param rootHandle - Root directory handle for the mounted provider.
 * @param options - Service-owned hooks for access recovery.
 * @returns VFS provider backed by browser file system handles.
 */
export const WebFileSystemProvider = (
  rootHandle: FileSystemDirectoryHandle,
  options: WebFileSystemProviderOptions,
): IFileSystemProvider & { notifyAccessChanged(): Promise<void> } => {
  const { onAccessRequired, permissionPolicy } = options;
  const events = new EventEmitter();

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

  /**
   * Runs a write-side browser operation and, on failure, re-checks the root handle readwrite
   * permission. If readwrite is no longer granted, triggers the onAccessRequired flow and throws
   * WebFileSystemAccessRequiredError. If readwrite is still granted, rethrows the original error.
   * No-op for originPrivateStorage providers.
   * @param fn - Write-side browser operation to run with recovery on permission loss.
   * @returns The resolved value of the operation.
   */
  const withWriteAccessRecovery = async <T>(fn: () => Promise<T>): Promise<T> => {
    if (permissionPolicy === 'originPrivateStorage') {
      return fn();
    }

    try {
      return await fn();
    } catch (error) {
      const permissionState = await queryModePermission(rootHandle, 'readwrite');

      if (permissionState !== 'granted') {
        const accessRequiredDetails = onAccessRequired?.({
          handle: rootHandle,
          mode: 'readwrite',
        });

        if (accessRequiredDetails) {
          throw new WebFileSystemAccessRequiredError(accessRequiredDetails);
        }

        throw new VfsError(FileSystemError.NoPermissions, 'Permission required');
      }

      throw error;
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

    const resolvedHandle = await (async () => {
      try {
        const handle = await getHandle(path, false, 'file');
        if (!overwrite) {
          throw new VfsError(FileSystemError.FileExists, `File exists: ${path}`);
        }
        return handle;
      } catch (error) {
        if (error instanceof VfsError && error.code === FileSystemError.FileNotFound) {
          if (!create) {
            throw error;
          }
          return getHandle(path, true, 'file');
        }
        throw error;
      }
    })();

    await withWriteAccessRecovery(async () => {
      const writable = await resolvedHandle.createWritable();
      await writable.write(content);
      await writable.close();
    });

    return {
      stat: await fileHandleStat(resolvedHandle),
    };
  };

  const writeFile = async (
    path: string,
    content: FileContent,
    writeOptions: WriteOptions,
  ): Promise<WriteFileResult> => writeFileImpl(path, content, writeOptions);

  const readDirectory = async (path: string): Promise<[string, FSNodeStat][]> => {
    await ensureAccess('read');
    const directoryHandle = await getHandle(path, false, 'directory');
    const entries: [string, FSNodeStat][] = [];

    for await (const [name, childHandle] of directoryHandle.entries()) {
      entries.push([
        name,
        { type: childHandle.kind === 'file' ? FSNodeType.File : FSNodeType.Directory },
      ]);
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
      await withWriteAccessRecovery(() => parentHandle.removeEntry(name, { recursive }));
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
    const { handle: destinationHandle, stat: destinationStat } = await lookupPath(newDirName);

    if (destinationHandle.kind !== 'directory') {
      throw new VfsError(
        FileSystemError.FileNotADirectory,
        `Type mismatch for: ${PathUtils.basename(newDirName)}`,
      );
    }

    if (destinationStat.capabilities?.canEditChildren === false) {
      throw new VfsError(
        FileSystemError.NoPermissions,
        `Path change is not allowed inside directory: ${newDirName}`,
      );
    }

    const destinationDirHandle = destinationHandle;

    if (sourceHandle.move) {
      await withWriteAccessRecovery(
        () => sourceHandle.move?.(destinationDirHandle, newName) ?? Promise.resolve(),
      );
      return;
    }

    if (sourceHandle.kind === 'file') {
      const file = await sourceHandle.getFile();
      const newFileHandle = await destinationDirHandle.getFileHandle(newName, {
        create: true,
      });
      await withWriteAccessRecovery(async () => {
        const writable = await newFileHandle.createWritable();
        await writable.write(file);
        await writable.close();
      });

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
          await withWriteAccessRecovery(async () => {
            const writable = await newFileHandle.createWritable();
            await writable.write(file);
            await writable.close();
          });
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
    events.emit({
      source: VfsEventSource.PROVIDER,
      type: VfsEventType.UPDATE,
      path: '/',
    });

    return Promise.resolve();
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
