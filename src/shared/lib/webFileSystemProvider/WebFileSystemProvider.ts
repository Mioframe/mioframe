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
import {
  attachWebFileSystemWriteDiagnosticSummary,
  type WebFileSystemWriteDiagnosticSummary,
  type WebFileSystemWriteAttemptRole,
  type WebFileSystemWriteHandleSource,
  type WebFileSystemWriteRetryKind,
  type WebFileSystemWritePhase,
} from './webFileSystemWriteDiagnosticSummary';

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
  /** Called with safe retry milestones for bounded InvalidStateError recovery. */
  onWriteRetry?: (event: WebFileSystemWriteRetryEvent) => void;
}

/**
 * Safe retry milestone emitted by the provider for bounded InvalidStateError recovery.
 */
export type WebFileSystemWriteRetryEvent =
  | {
      result: 'started' | 'succeeded';
      retryKind: 'freshHandle' | 'rootHandleRefresh';
      writePhase: WebFileSystemWritePhase;
    }
  | {
      result: 'failed';
      error: WebFileSystemWriteDiagnosticSummary;
      retryKind: 'freshHandle' | 'rootHandleRefresh';
      writePhase: WebFileSystemWritePhase;
    };

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
  const { onAccessRequired, onWriteRetry, permissionPolicy } = options;
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
   * @param onPhaseChange - Safe phase observer for diagnostics.
   * @returns Promise that resolves when the write is complete.
   */
  const writeFileHandleContent = async (
    handle: FileSystemFileHandle,
    content: FileContent,
    onPhaseChange: (phase: WebFileSystemWritePhase) => void = () => {},
  ): Promise<{
    abortAttempted: 'false' | 'true';
    abortResult: 'failed' | 'notNeeded' | 'succeeded';
    failedPhase?: WebFileSystemWritePhase | undefined;
    streamCreated: 'false' | 'true';
  }> => {
    let streamCreated: 'false' | 'true' = 'false';
    let abortAttempted: 'false' | 'true' = 'false';
    let abortResult: 'failed' | 'notNeeded' | 'succeeded' = 'notNeeded';
    let failedPhase: WebFileSystemWritePhase | undefined;

    await withWriteAccessRecovery(async () => {
      onPhaseChange('createWritableStarted');
      failedPhase = 'createWritableStarted';
      const writable = await handle.createWritable();
      streamCreated = 'true';
      onPhaseChange('createWritableSucceeded');
      try {
        onPhaseChange('writeStarted');
        failedPhase = 'writeStarted';
        await writable.write(content);
        onPhaseChange('writeSucceeded');
        onPhaseChange('closeStarted');
        failedPhase = 'closeStarted';
        await writable.close();
        onPhaseChange('closeSucceeded');
        failedPhase = undefined;
      } catch (error) {
        abortAttempted = 'true';
        try {
          onPhaseChange('abortStarted');
          await writable.abort();
          abortResult = 'succeeded';
          onPhaseChange('abortSucceeded');
        } catch {
          abortResult = 'failed';
          onPhaseChange('abortFailed');
        }
        throw error;
      }
    });

    return { streamCreated, abortAttempted, abortResult, failedPhase };
  };

  const classifyWriteError = (
    error: unknown,
  ): Pick<
    WebFileSystemWriteDiagnosticSummary,
    'domainErrorCode' | 'domExceptionName' | 'errorClass' | 'errorClassification' | 'vfsErrorCode'
  > => {
    if (error instanceof DOMException) {
      return {
        errorClass: 'DOMException',
        domExceptionName: error.name,
        errorClassification:
          error.name === 'NotAllowedError' || error.name === 'AbortError'
            ? 'accessDenied'
            : error.name === 'InvalidStateError'
              ? 'browserFileStateChanged'
              : 'unknown',
      };
    }

    if (error instanceof VfsError) {
      return {
        errorClass: 'VfsError',
        vfsErrorCode: error.code,
        errorClassification:
          error.code === FileSystemError.NoPermissions
            ? 'accessDenied'
            : error.code === FileSystemError.FileNotFound
              ? 'notFound'
              : error.code === FileSystemError.Unknown
                ? 'storageFailure'
                : 'unknown',
      };
    }

    if (error instanceof DomainError) {
      return {
        errorClass: 'DomainError',
        ...(typeof error.code === 'string' ? { domainErrorCode: error.code } : {}),
        errorClassification: 'unknown',
      };
    }

    return error instanceof Error
      ? {
          errorClass: 'Error',
          errorClassification: 'unknown',
        }
      : {
          errorClass: 'unknown',
          errorClassification: 'unknown',
        };
  };

  const annotateWriteError = ({
    abortAttempted,
    abortResult,
    attemptRole,
    error,
    failedPhase,
    handleSource,
    originalFailurePhase,
    retryKind,
    retryAttempted,
    retryResult,
    streamCreated,
    currentPhase,
  }: {
    abortAttempted: 'false' | 'true';
    abortResult: 'failed' | 'notNeeded' | 'succeeded';
    attemptRole: WebFileSystemWriteAttemptRole;
    error: unknown;
    failedPhase: WebFileSystemWritePhase | undefined;
    handleSource: WebFileSystemWriteHandleSource;
    originalFailurePhase?: WebFileSystemWritePhase | undefined;
    retryKind: WebFileSystemWriteRetryKind;
    retryAttempted: 'false' | 'true';
    retryResult: 'failed' | 'notAttempted' | 'succeeded';
    streamCreated: 'false' | 'true';
    currentPhase: WebFileSystemWritePhase | undefined;
  }): void => {
    attachWebFileSystemWriteDiagnosticSummary(error, {
      ...classifyWriteError(error),
      abortAttempted,
      abortResult,
      attemptRole,
      currentPhase,
      failedPhase,
      handleSource,
      ...(originalFailurePhase !== undefined ? { originalFailurePhase } : {}),
      retryKind,
      retryAttempted,
      retryResult,
      streamCreated,
    });
  };

  const reportWriteRetry = (event: WebFileSystemWriteRetryEvent) => {
    try {
      onWriteRetry?.(event);
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
      handleSource: initialHandleSource,
      forceFreshHandle = false,
    }: {
      handleSource: WebFileSystemWriteHandleSource;
      forceFreshHandle?: boolean | undefined;
    }): Promise<
      | { result: WriteFileResult; status: 'succeeded' }
      | {
          abortAttempted: 'false' | 'true';
          abortResult: 'failed' | 'notNeeded' | 'succeeded';
          error: unknown;
          failedPhase?: WebFileSystemWritePhase | undefined;
          handleSource: WebFileSystemWriteHandleSource;
          streamCreated: 'false' | 'true';
          status: 'failed';
          writePhase: WebFileSystemWritePhase | undefined;
        }
    > => {
      let currentWritePhase: WebFileSystemWritePhase | undefined;
      let streamCreated: 'false' | 'true' = 'false';
      let abortAttempted: 'false' | 'true' = 'false';
      let abortResult: 'failed' | 'notNeeded' | 'succeeded' = 'notNeeded';
      let failedPhase: WebFileSystemWritePhase | undefined;
      let handleSource = initialHandleSource;
      let lastFailureCandidatePhase: WebFileSystemWritePhase | undefined;
      const setWritePhase = (phase: WebFileSystemWritePhase) => {
        currentWritePhase = phase;
        if (!phase.startsWith('abort')) {
          lastFailureCandidatePhase = phase;
        }
      };

      try {
        let resolvedHandle: FileSystemFileHandle;
        if (forceFreshHandle) {
          const normalized = PathUtils.normalize(path);
          setWritePhase('lookupParentDirectory');
          const parentDir = await withWriteAccessRecovery(() =>
            getHandle(PathUtils.dirname(normalized), false, 'directory'),
          );
          handleSource = 'freshParentLookup';
          setWritePhase(create ? 'createFileHandle' : 'lookupExistingHandle');
          resolvedHandle = await withWriteAccessRecovery(() =>
            parentDir.getFileHandle(PathUtils.basename(normalized), {
              create,
            }),
          );
          handleSource = create ? 'createdHandle' : 'existingLookup';
        } else {
          try {
            setWritePhase('lookupExistingHandle');
            resolvedHandle = await getHandle(path, false, 'file');
            handleSource = 'existingLookup';
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
              throw lookupError;
            }
            const normalized = PathUtils.normalize(path);
            setWritePhase('lookupParentDirectory');
            const parentDir = await getHandle(PathUtils.dirname(normalized), false, 'directory');
            setWritePhase('createFileHandle');
            resolvedHandle = await createFileHandleWithWriteRecovery(
              parentDir,
              PathUtils.basename(normalized),
            );
            handleSource = 'createdHandle';
          }
        }

        ({ abortAttempted, abortResult, failedPhase, streamCreated } = await writeFileHandleContent(
          resolvedHandle,
          content,
          setWritePhase,
        ));

        try {
          setWritePhase('statAfterWriteStarted');
          const fileStat = await fileHandleStat(resolvedHandle);
          setWritePhase('statAfterWriteSucceeded');
          return {
            result: { stat: fileStat },
            status: 'succeeded',
          };
        } catch (error) {
          if (error instanceof DOMException && error.name === 'InvalidStateError') {
            setWritePhase('statAfterWriteFailed');
            throw error;
          }
          return {
            result: { stat: { type: FSNodeType.File } },
            status: 'succeeded',
          };
        }
      } catch (error) {
        return {
          abortAttempted,
          abortResult,
          error,
          failedPhase,
          handleSource,
          streamCreated,
          status: 'failed',
          writePhase: failedPhase ?? lastFailureCandidatePhase ?? currentWritePhase,
        };
      }
    };

    const attemptResult = await runWriteAttempt({
      handleSource: 'storedRootHandle',
    });

    if (attemptResult.status === 'succeeded') {
      return attemptResult.result;
    }

    const { error, writePhase } = attemptResult;

    if (error instanceof DOMException && error.name === 'InvalidStateError' && writePhase) {
      const retryKind: WebFileSystemWriteRetryKind = 'freshHandle';
      reportWriteRetry({ result: 'started', retryKind, writePhase });

      const retryResult = await runWriteAttempt({
        forceFreshHandle: true,
        handleSource: 'freshParentLookup',
      });

      if (retryResult.status === 'succeeded') {
        reportWriteRetry({ result: 'succeeded', retryKind, writePhase });
        return retryResult.result;
      }

      annotateWriteError({
        error: retryResult.error,
        abortAttempted: retryResult.abortAttempted,
        abortResult: retryResult.abortResult,
        attemptRole: 'retry',
        currentPhase: retryResult.writePhase,
        failedPhase: retryResult.writePhase,
        handleSource: retryResult.handleSource,
        originalFailurePhase: writePhase,
        retryKind,
        retryAttempted: 'true',
        retryResult: 'failed',
        streamCreated: retryResult.streamCreated,
      });
      reportWriteRetry({
        result: 'failed',
        retryKind,
        writePhase,
        error: {
          ...classifyWriteError(retryResult.error),
          attemptRole: 'retry',
          currentPhase: retryResult.writePhase,
          failedPhase: retryResult.writePhase,
          handleSource: retryResult.handleSource,
          originalFailurePhase: writePhase,
          retryKind,
          abortAttempted: retryResult.abortAttempted,
          abortResult: retryResult.abortResult,
          retryAttempted: 'true',
          retryResult: 'failed',
          streamCreated: retryResult.streamCreated,
        },
      });
      throw retryResult.error;
    }

    annotateWriteError({
      abortAttempted: attemptResult.abortAttempted,
      abortResult: attemptResult.abortResult,
      attemptRole: 'initial',
      currentPhase: writePhase,
      error,
      failedPhase: writePhase,
      handleSource: attemptResult.handleSource,
      retryKind: 'none',
      retryAttempted: 'false',
      retryResult: 'notAttempted',
      streamCreated: attemptResult.streamCreated,
    });
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
