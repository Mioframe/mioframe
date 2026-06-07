import type {
  FileContent,
  FSNodeCapabilities,
  FSNodeStat,
  IFileSystemProvider,
  VfsEvent,
  WriteFileResult,
} from '../virtualFileSystem';
import { DomainError } from '@shared/lib/error';
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
  /** Called with safe write-side milestones for diagnostics. */
  onDiagnosticStep?: (event: WebFileSystemDiagnosticStep) => void;
}

/**
 * Safe diagnostic milestone emitted by the provider.
 */
export interface WebFileSystemDiagnosticStep {
  /** Safe browser exception name when the failing value is a DOMException. */
  domExceptionName?: string | undefined;
  /** Coarse project-controlled error class label. */
  errorClass?: string | undefined;
  /** Technical milestone outcome. */
  result: 'attempted' | 'failed' | 'missing' | 'started' | 'succeeded';
  /** Technical milestone name emitted by the provider. */
  step: string;
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
  const { onAccessRequired, onDiagnosticStep, permissionPolicy } = options;
  const events = new EventEmitter();
  let currentRootHandle = rootHandle;

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

    const permissionState = await queryModePermission(currentRootHandle, mode);

    if (permissionState !== 'granted') {
      const accessRequiredDetails = onAccessRequired?.({
        handle: currentRootHandle,
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
      const permissionState = await queryModePermission(currentRootHandle, 'readwrite');

      if (permissionState !== 'granted') {
        const accessRequiredDetails = onAccessRequired?.({
          handle: currentRootHandle,
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

  /**
   * Creates a new file handle inside `parent` with write access recovery.
   * @param parent - Parent directory handle.
   * @param name - Name of the new file.
   * @returns Resolved file handle for the newly created file.
   */
  const createFileHandleWithWriteRecovery = (
    parent: FileSystemDirectoryHandle,
    name: string,
  ): Promise<FileSystemFileHandle> =>
    withWriteAccessRecovery(() => parent.getFileHandle(name, { create: true }));

  /**
   * Creates a new directory handle inside `parent` with write access recovery.
   * @param parent - Parent directory handle.
   * @param name - Name of the new directory.
   * @returns Resolved directory handle for the newly created directory.
   */
  const createDirectoryHandleWithWriteRecovery = (
    parent: FileSystemDirectoryHandle,
    name: string,
  ): Promise<FileSystemDirectoryHandle> =>
    withWriteAccessRecovery(() => parent.getDirectoryHandle(name, { create: true }));

  /**
   * Writes `content` to `handle` via createWritable, applying write access recovery once.
   * @param handle - File handle to write to.
   * @param content - Content to write.
   * @returns Promise that resolves when the write is complete.
   */
  const writeFileHandleContent = async (
    handle: FileSystemFileHandle,
    content: FileContent,
  ): Promise<void> => {
    await withWriteAccessRecovery(async () => {
      reportDiagnosticStep({ step: 'writableOpen', result: 'started' });
      const writable = await handle.createWritable();
      reportDiagnosticStep({ step: 'writableOpen', result: 'succeeded' });
      try {
        await writable.write(content);
        await writable.close();
      } catch (error) {
        try {
          await writable.abort();
        } catch {
          // abort is cleanup only; diagnostics must not depend on its result
        }
        reportDiagnosticStep({
          step: 'writableOpen',
          result: 'failed',
          ...describeError(error),
        });
        throw error;
      }
    });
  };

  const describeError = (
    error: unknown,
  ): Pick<WebFileSystemDiagnosticStep, 'domExceptionName' | 'errorClass'> => {
    if (error instanceof DOMException) {
      return {
        domExceptionName: error.name,
        errorClass: 'DOMException',
      };
    }

    if (error instanceof VfsError) {
      return {
        errorClass: 'VfsError',
      };
    }

    if (error instanceof DomainError) {
      return {
        errorClass: 'DomainError',
      };
    }

    return error instanceof Error ? { errorClass: 'Error' } : { errorClass: 'unknown' };
  };

  const reportDiagnosticStep = (event: WebFileSystemDiagnosticStep) => {
    try {
      onDiagnosticStep?.(event);
    } catch {
      // diagnostics hooks must not affect provider behavior
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
      return currentRootHandle;
    }

    let currentDir = currentRootHandle;

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
      const canWriteRoot = getWriteCapability(await queryWritePermission(currentRootHandle));

      return {
        handle: currentRootHandle,
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

    const runWriteAttempt = async ({
      forceFreshHandle = false,
    }: {
      forceFreshHandle?: boolean | undefined;
    }): Promise<
      | { result: WriteFileResult; status: 'succeeded' }
      | { error: unknown; retryWithFreshHandle: boolean; status: 'failed' }
    > => {
      try {
        let resolvedHandle: FileSystemFileHandle;
        if (forceFreshHandle) {
          const normalized = PathUtils.normalize(path);
          reportDiagnosticStep({ step: 'parentDirectoryLookup', result: 'started' });
          const parentDir = await withWriteAccessRecovery(() =>
            getHandle(PathUtils.dirname(normalized), false, 'directory'),
          );
          reportDiagnosticStep({ step: 'parentDirectoryLookup', result: 'succeeded' });
          reportDiagnosticStep({
            step: create ? 'fileHandleCreate' : 'fileLookup',
            result: create ? 'started' : 'started',
          });
          resolvedHandle = await withWriteAccessRecovery(() =>
            parentDir.getFileHandle(PathUtils.basename(normalized), {
              create,
            }),
          );
          reportDiagnosticStep({
            step: create ? 'fileHandleCreate' : 'fileLookup',
            result: 'succeeded',
          });
        } else {
          try {
            reportDiagnosticStep({ step: 'fileLookup', result: 'started' });
            resolvedHandle = await getHandle(path, false, 'file');
            reportDiagnosticStep({ step: 'fileLookup', result: 'succeeded' });
            if (!overwrite) {
              throw new VfsError(FileSystemError.FileExists, `File exists: ${path}`);
            }
          } catch (lookupError) {
            if (
              !(
                lookupError instanceof VfsError && lookupError.code === FileSystemError.FileNotFound
              )
            ) {
              throw lookupError;
            }
            if (!create) {
              reportDiagnosticStep({ step: 'fileLookup', result: 'missing' });
              throw lookupError;
            }
            const normalized = PathUtils.normalize(path);
            reportDiagnosticStep({ step: 'parentDirectoryLookup', result: 'started' });
            const parentDir = await getHandle(PathUtils.dirname(normalized), false, 'directory');
            reportDiagnosticStep({ step: 'parentDirectoryLookup', result: 'succeeded' });
            reportDiagnosticStep({
              step: 'fileHandleCreate',
              result: 'started',
            });
            resolvedHandle = await createFileHandleWithWriteRecovery(
              parentDir,
              PathUtils.basename(normalized),
            );
            reportDiagnosticStep({
              step: 'fileHandleCreate',
              result: 'succeeded',
            });
          }
        }

        await writeFileHandleContent(resolvedHandle, content);

        try {
          const fileStat = await fileHandleStat(resolvedHandle);
          return {
            result: { stat: fileStat },
            status: 'succeeded',
          };
        } catch (error) {
          if (error instanceof DOMException && error.name === 'InvalidStateError') {
            return {
              error,
              retryWithFreshHandle: true,
              status: 'failed',
            };
          }
          return {
            result: { stat: { type: FSNodeType.File } },
            status: 'succeeded',
          };
        }
      } catch (error) {
        return {
          error,
          retryWithFreshHandle: error instanceof DOMException && error.name === 'InvalidStateError',
          status: 'failed',
        };
      }
    };

    const attemptResult = await runWriteAttempt({});

    if (attemptResult.status === 'succeeded') {
      return attemptResult.result;
    }

    const { error } = attemptResult;

    if (attemptResult.retryWithFreshHandle) {
      reportDiagnosticStep({ step: 'freshHandleRetry', result: 'started' });

      const retryResult = await runWriteAttempt({ forceFreshHandle: true });

      if (retryResult.status === 'succeeded') {
        reportDiagnosticStep({
          step: 'freshHandleRetry',
          result: 'succeeded',
        });
        return retryResult.result;
      }

      reportDiagnosticStep({
        step: 'freshHandleRetry',
        result: 'failed',
        ...describeError(retryResult.error),
      });
      throw retryResult.error;
    }
    throw error;
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
      if (!(error instanceof VfsError && error.code === FileSystemError.FileNotFound)) {
        throw error;
      }
      const normalized = PathUtils.normalize(path);
      const parentDir = await getHandle(PathUtils.dirname(normalized), false, 'directory');
      await createDirectoryHandleWithWriteRecovery(parentDir, PathUtils.basename(normalized));
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
      const newFileHandle = await createFileHandleWithWriteRecovery(destinationDirHandle, newName);
      await writeFileHandleContent(newFileHandle, file);
      await remove(normalizedOld, false);
      return;
    }

    const newDirHandle = await createDirectoryHandleWithWriteRecovery(
      destinationDirHandle,
      newName,
    );

    const copyDirectoryContents = async (
      sourceDir: FileSystemDirectoryHandle,
      destDir: FileSystemDirectoryHandle,
    ): Promise<void> => {
      for await (const entry of sourceDir.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          const newFileHandle = await createFileHandleWithWriteRecovery(destDir, entry.name);
          await writeFileHandleContent(newFileHandle, file);
          continue;
        }

        const newSubDir = await createDirectoryHandleWithWriteRecovery(destDir, entry.name);
        await copyDirectoryContents(entry, newSubDir);
      }
    };

    await copyDirectoryContents(sourceHandle, newDirHandle);
    await remove(normalizedOld, true);
  };

  const notifyAccessChanged = (nextRootHandle?: FileSystemDirectoryHandle) => {
    if (nextRootHandle !== undefined) {
      currentRootHandle = nextRootHandle;
    }
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
