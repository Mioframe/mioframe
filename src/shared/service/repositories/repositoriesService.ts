import type { AMDocumentId } from '@shared/lib/automerge';
import { useFileSystemService } from '../fileSystem';
import { Repo } from '@automerge/automerge-repo';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { createVFSAdapter } from '@shared/lib/automergeAdapter/createVFSAdapter';
import { createRetryingStorageAdapter } from '@shared/lib/automergeAdapter';
import type { WriteAccessRecoveryResult } from '../fileSystem/fileSystemAccessRequestRegistry';
import { createGlobalState } from '@vueuse/core';
import type { CFRDocumentContent } from '@shared/lib/cfrDocument';
import { zodCFRDocumentContent } from '@shared/lib/cfrDocument';
import { DomainError } from '@shared/lib/error';
import { RepositoryImportErrorCode } from './repositoryImportErrorCode';
import {
  reportWriteAccessReplayStillBlocked,
  reportWriteAccessReplayStorageFailure,
  reportRepositorySaveQueued,
  reportRepositorySaveFailed,
} from './repositoriesDiagnostics';
import { getFileSystemAccessRecovery } from '@shared/lib/fileSystem';
import {
  concat,
  defer,
  filter,
  finalize,
  firstValueFrom,
  map,
  NEVER,
  type Observable,
  of,
  ReplaySubject,
  share,
  switchMap,
  take,
  timer,
} from 'rxjs';
import { defineObservableQuery } from '@shared/lib/useObservableQuery';
import {
  cleanupDeletedDocumentStorageFiles,
  getDocumentStorageFiles,
} from './repositoryStorageFiles';
import { createRepositoryStateCoordinator } from './repositoryState';
import type { RepositoryState } from './repositoryContracts';
import { exportDirectoryZip, exportDocumentZip } from './repositoryZipExport';
import { importDirectoryZip } from './repositoryZipImport';
import {
  RepositoryZipErrorCode,
  type OnZipExportChunk,
  type OnZipExportProgress,
  type OnZipImportProgress,
} from './repositoryZipContracts';
/** Idle timeout before an unused Automerge Repo instance is removed from service cache. */
export const REPO_IDLE_TIMEOUT_MS = 60_000;

const isBrowserFileStateChangedError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'InvalidStateError';

const setupRepositoriesService = () => {
  const { directoryState$, registerWriteAccessRecoveryHandler, vfs } = useFileSystemService();
  const repoObservableCache = new Map<string, Observable<RepositoryCacheEntry>>();
  const { repositoryState$ } = createRepositoryStateCoordinator(vfs, directoryState$);

  /**
   * Internal document-id projection of `RepositoryState`, used for Repo gating and by
   * `DocumentService`. Skips `loading` (no document-list value yet); `ready`/`refreshing` project
   * `snapshot.documentIds`; `error` projects the raw error. A transient error never terminates this
   * stream — later `RepositoryState` emissions keep flowing normally.
   * @param path - Repository path.
   * @returns Document ids, or the repository's current error.
   */
  const documentIds$ = (path: string): Observable<AMDocumentId[] | Error> =>
    repositoryState$({ path }).pipe(
      filter(
        (state): state is Exclude<RepositoryState, { status: 'loading' }> =>
          state.status !== 'loading',
      ),
      map((state) => (state.status === 'error' ? state.error : state.snapshot.documentIds)),
    );

  const shouldQueueFailedSave = (error: unknown) =>
    !!getFileSystemAccessRecovery(error, {
      operation: 'write',
    });

  type RepositoryStorageRecovery = Pick<
    ReturnType<typeof createRetryingStorageAdapter>,
    'flushPendingSaves' | 'hasPendingSaves'
  >;

  type RepositoryCacheEntry = {
    repo: Repo;
    storageRecovery: RepositoryStorageRecovery;
  };

  const createRepoObservable = (path: string) => {
    let repoEntry: RepositoryCacheEntry | undefined;

    return defer(() => {
      if (!repoEntry) {
        const storageRecovery = createRetryingStorageAdapter(createVFSAdapter(vfs, path), {
          shouldQueueFailedSave,
          onSaveFailure: ({ queued, pendingCount, caughtError }) => {
            if (queued) {
              reportRepositorySaveQueued({ pendingCount });
            } else {
              reportRepositorySaveFailed({
                pendingCount,
                failureClassification: isBrowserFileStateChangedError(caughtError)
                  ? 'browserFileStateChanged'
                  : 'storageFailure',
              });
            }
          },
        });
        repoEntry = {
          repo: new Repo({
            storage: storageRecovery,
          }),
          storageRecovery,
        };
      }

      return concat(of(repoEntry), NEVER);
    }).pipe(
      finalize(() => {
        repoEntry = undefined;
        repoObservableCache.delete(path);
      }),
      share({
        connector: () => new ReplaySubject<RepositoryCacheEntry>(1),
        resetOnError: true,
        resetOnComplete: false,
        resetOnRefCountZero: () => timer(REPO_IDLE_TIMEOUT_MS),
      }),
    );
  };

  const repoByPath$ = (path: string) => {
    let repo$ = repoObservableCache.get(path);

    if (!repo$) {
      repo$ = createRepoObservable(path);
      repoObservableCache.set(path, repo$);
    }

    return repo$;
  };

  const repo$ = (path: string, initial = false) => {
    if (initial) {
      return repoByPath$(path).pipe(map(({ repo }) => repo));
    }

    return documentIds$(path).pipe(
      switchMap((docs) => {
        if (docs instanceof Error) {
          return NEVER;
        }

        if (docs.length === 0) {
          return NEVER;
        }

        return repoByPath$(path).pipe(map(({ repo }) => repo));
      }),
    );
  };

  async function getRepo(path: string, initial: true): Promise<Repo>;
  async function getRepo(path: string, initial?: false): Promise<undefined | Repo>;
  async function getRepo(path: string, initial = false) {
    if (initial) {
      return firstValueFrom(repo$(path, true));
    }

    const documentIdList = await firstValueFrom(documentIds$(path));

    if (documentIdList instanceof Error) {
      throw documentIdList;
    }

    if (documentIdList.length === 0) {
      return undefined;
    }

    return firstValueFrom(
      repoByPath$(path).pipe(
        take(1),
        map(({ repo }) => repo),
      ),
    );
  }

  /**
   * Settles one already-cached repository: drains any previously queued/failed Automerge saves,
   * then flushes current in-memory document state to storage. Never instantiates a repository —
   * a path with nothing cached is a safe no-op, since there is no in-memory state to settle.
   * @param path - Absolute repository path to settle, when cached.
   * @returns Whether the repository was settled, still blocked, or failed.
   */
  const settleCachedRepository = async (path: string): Promise<WriteAccessRecoveryResult> => {
    const cached = repoObservableCache.get(path);
    if (!cached) return { status: 'flushed' };

    const { repo, storageRecovery } = await firstValueFrom(cached.pipe(take(1)));

    if (storageRecovery.hasPendingSaves()) {
      const result = await storageRecovery.flushPendingSaves();
      const flushedCount = result.flushedCount;

      if (result.status !== 'flushed') {
        const failureClassification =
          result.failureClassification === 'storageFailure' &&
          result.caughtError !== undefined &&
          isBrowserFileStateChangedError(result.caughtError)
            ? 'browserFileStateChanged'
            : result.failureClassification;

        if (result.status === 'stillBlocked') {
          reportWriteAccessReplayStillBlocked({ flushedCount, pendingCount: result.pendingCount });
        } else {
          reportWriteAccessReplayStorageFailure({
            flushedCount,
            pendingCount: result.pendingCount,
            ...(failureClassification !== undefined ? { failureClassification } : {}),
          });
        }
        return {
          status: result.status,
          replay: {
            flushedCount,
            pendingCount: result.pendingCount,
            ...(failureClassification !== undefined ? { failureClassification } : {}),
          },
        };
      }
    }

    try {
      await repo.flush();
    } catch (caughtError) {
      // A same-entry reconnect has already persisted/remounted the replacement handle before
      // this settlement runs, so a storage failure here must not reject the already-committed
      // reconnect — it is reported as a non-flushed recovery result instead.
      const failureClassification = isBrowserFileStateChangedError(caughtError)
        ? 'browserFileStateChanged'
        : 'storageFailure';

      reportWriteAccessReplayStorageFailure({
        flushedCount: 0,
        pendingCount: 0,
        failureClassification,
      });

      return {
        status: 'failed',
        replay: { flushedCount: 0, pendingCount: 0, failureClassification },
      };
    }

    return { status: 'flushed' };
  };

  /**
   * Settles every already-cached repository at or under `mountPath`: drains queued/failed
   * Automerge saves and flushes current in-memory document state for each one, in cache order.
   * Never instantiates a repository merely to settle it — directories with nothing cached yet are
   * a safe no-op. Used to bring storage to a settled state before ZIP export and import preflight,
   * and after write-access is regranted.
   * @param mountPath - Absolute path whose cached repository subtree should be settled.
   * @returns Whether every repository in the subtree was settled, or the first blocked/failed result.
   */
  const settleCachedRepositoriesUnderPath = async (
    mountPath: string,
  ): Promise<WriteAccessRecoveryResult> => {
    for (const [repoPath] of repoObservableCache.entries()) {
      if (!PathUtils.isSameOrDescendantOf(repoPath, mountPath)) {
        continue;
      }

      // eslint-disable-next-line no-await-in-loop -- cached repo settling must resolve before deciding whether later repos should run
      const result = await settleCachedRepository(repoPath);

      if (result.status !== 'flushed') {
        return result;
      }
    }

    return { status: 'flushed' };
  };

  registerWriteAccessRecoveryHandler(({ mountPath }) =>
    settleCachedRepositoriesUnderPath(mountPath),
  );

  const deleteDocument = async (path: string, id: AMDocumentId) => {
    const documentStorageFiles = await getDocumentStorageFiles(vfs, path, id);

    if (documentStorageFiles.length === 0) {
      return;
    }

    const repo = await getRepo(path);

    // repo.delete is fire-and-forget — Automerge calls adapter.removeRange internally.
    // Failures surface in cleanupDeletedDocumentStorageFiles below.
    repo?.delete(id);

    await cleanupDeletedDocumentStorageFiles(vfs, path, id);
  };

  const createDocument = async (path: string, initialValue: CFRDocumentContent) => {
    const repo = await getRepo(path, true);

    const documentId = repo.create(initialValue).documentId;

    return documentId;
  };

  const importDocumentFromText = async (
    targetDirectoryPath: string,
    text: string,
  ): Promise<AMDocumentId> => {
    let data: unknown;

    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new DomainError('The selected file is not valid JSON', {
        cause: error,
        code: RepositoryImportErrorCode.invalidJson,
      });
    }

    let parsed: CFRDocumentContent;

    try {
      parsed = zodCFRDocumentContent.parse(data);
    } catch (error) {
      throw new DomainError('The selected JSON file is not a Mioframe document', {
        cause: error,
        code: RepositoryImportErrorCode.invalidDocumentFormat,
      });
    }

    return createDocument(targetDirectoryPath, parsed);
  };

  /**
   * Reads a JSON file from the VFS, validates it as a Mioframe CFR document, and creates a new
   * document in the target repository directory.
   * @param targetDirectoryPath - Absolute path to the repository directory to create the document in.
   * @param sourceFilePath - Absolute VFS path to the source JSON file.
   * @returns The created document identifier.
   */
  const importDocumentFromJsonPath = async (
    targetDirectoryPath: string,
    sourceFilePath: string,
  ): Promise<AMDocumentId> => {
    let text: string;

    try {
      const file = await vfs.readFile(sourceFilePath);
      text = await file.text();
    } catch (error) {
      throw new DomainError('Could not import the document', {
        cause: error,
        code: RepositoryImportErrorCode.fileReadFailed,
      });
    }

    return importDocumentFromText(targetDirectoryPath, text);
  };

  /**
   * Reads text from a user-selected `File`, validates it as a Mioframe CFR document, and creates a
   * new document in the target repository directory.
   * @param targetDirectoryPath - Absolute path to the repository directory to create the document in.
   * @param file - The user-selected JSON file received via the file picker.
   * @returns The created document identifier.
   */
  const importDocumentFromJsonFile = async (
    targetDirectoryPath: string,
    file: File,
  ): Promise<AMDocumentId> => {
    let text: string;

    try {
      text = await file.text();
    } catch (error) {
      throw new DomainError('Could not import the document', {
        cause: error,
        code: RepositoryImportErrorCode.fileReadFailed,
      });
    }

    return importDocumentFromText(targetDirectoryPath, text);
  };

  /**
   * Initializes repository storage for an empty mounted directory through the shared repo cache.
   * @param path - Absolute path to the repository root.
   */
  const initializeRepository = async (path: string): Promise<void> => {
    await getRepo(path, true);
  };

  const throwIfNotSettled = (settled: WriteAccessRecoveryResult) => {
    if (settled.status !== 'flushed') {
      throw new DomainError(
        'Some earlier changes have not finished saving yet, so the export was stopped before reading any files.',
        { code: RepositoryZipErrorCode.exportStorageNotReady, cause: settled },
      );
    }
  };

  /**
   * Streams a directory's raw storage contents, including internal Mioframe storage files, as a
   * ZIP archive. This is a storage-level export, not a document JSON snapshot. Delivers packed
   * bytes through `onChunk` instead of returning the full archive, so it never holds the whole
   * archive in memory. Settles every already-cached repository under `path` before reading, so
   * the export reflects the latest in-memory document state.
   * @param path - Absolute path to the directory to export.
   * @param onChunk - Invoked with each packed archive chunk as it becomes available.
   * @param onProgress - Optional progress callback for the preparing/reading/packing phases.
   * @returns Promise that resolves once the archive has been fully streamed to `onChunk`.
   * @throws DomainError with code `RepositoryZipErrorCode.exportStorageNotReady` when any cached
   * repository under `path` cannot be settled. No archive bytes are emitted in that case.
   */
  const exportDirectoryZipArchive = async (
    path: string,
    onChunk: OnZipExportChunk,
    onProgress?: OnZipExportProgress,
  ) => {
    throwIfNotSettled(await settleCachedRepositoriesUnderPath(path));
    return exportDirectoryZip(vfs, path, onChunk, onProgress);
  };

  /**
   * Streams one document's storage files, written directly at archive root, as a ZIP archive.
   * This reads raw storage files, not the decoded document state — it is not a JSON snapshot.
   * Delivers packed bytes through `onChunk` instead of returning the full archive, so it never
   * holds the whole archive in memory. Settles the exact cached repository at `path` before
   * reading, so the export reflects the latest in-memory document state.
   * @param path - Absolute path to the directory containing the document.
   * @param id - Target document id.
   * @param onChunk - Invoked with each packed archive chunk as it becomes available.
   * @param onProgress - Optional progress callback for the preparing/reading/packing phases.
   * @returns Promise that resolves once the archive has been fully streamed to `onChunk`.
   * @throws DomainError with code `RepositoryZipErrorCode.exportStorageNotReady` when the cached
   * repository at `path` cannot be settled. No archive bytes are emitted in that case.
   */
  const exportDocumentZipArchive = async (
    path: string,
    id: AMDocumentId,
    onChunk: OnZipExportChunk,
    onProgress?: OnZipExportProgress,
  ) => {
    throwIfNotSettled(await settleCachedRepository(path));
    return exportDocumentZip(vfs, path, id, onChunk, onProgress);
  };

  /**
   * Validates and imports a ZIP archive into a directory using a bounded-memory, two-pass
   * strategy. Stops before any write if a target file or directory conflicts with the archive;
   * never overwrites, merges, or renames existing files. Before preflight, settles every
   * already-cached repository under the target directory so conflict checks see the latest state
   * and no previously queued/failed save can land after this import writes.
   * @param targetDirectoryPath - Absolute path to the directory to import into.
   * @param archiveFile - The user-selected ZIP archive file. Read twice: once to plan and
   * preflight conflicts, once to write, so the archive is never held in memory as a whole.
   * @param onProgress - Optional progress callback for the validate/conflict/unpack phases.
   * @returns Promise that resolves once every entry has been written.
   * @throws DomainError with code `RepositoryZipErrorCode.importStorageNotReady` when queued or
   * failed saves under the target cannot be settled. No write is attempted in that case.
   */
  const importDirectoryZipArchive = async (
    targetDirectoryPath: string,
    archiveFile: File,
    onProgress?: OnZipImportProgress,
  ) => {
    const settled = await settleCachedRepositoriesUnderPath(targetDirectoryPath);

    if (settled.status !== 'flushed') {
      throw new DomainError(
        'Some earlier changes to this folder have not finished saving yet, so the import was stopped before making any changes.',
        { code: RepositoryZipErrorCode.importStorageNotReady, cause: settled },
      );
    }

    return importDirectoryZip(vfs, targetDirectoryPath, archiveFile, onProgress);
  };

  const repositoryState = defineObservableQuery(repositoryState$);

  return {
    /**
     * Observable-query wrapper for the atomic repository derivation coordinator: one lifecycle
     * covering initialization, document ids, and classified entries per repository directory.
     */
    repositoryState,
    /** Low-level observable for the atomic repository derivation coordinator. */
    repositoryState$,
    /**
     * Internal document-id projection of `repositoryState$`, shared by `DocumentService` and Repo
     * gating. `documentIds$` and `repositoryState$` are both same-worker service internals; UI-facing
     * consumers must use only the public `repositoryState` query.
     */
    documentIds$,
    getRepo$: repo$,
    /**
     * Creates a document in the repository.
     * @param path - Absolute path to the repository.
     * @returns Created document identifier.
     */
    createDocument,
    /**
     * Initializes repository storage without creating a document.
     * @param path - Absolute path to the repository.
     */
    initializeRepository,
    /**
     * Removes a document from the repository.
     * @param path - Absolute repository path.
     * @param id - Document identifier.
     */
    deleteDocument,
    /**
     * Reads a JSON file from the VFS, validates it as a Mioframe CFR document, and creates a new
     * document in the target repository directory.
     * @param targetDirectoryPath - Absolute path to the repository directory.
     * @param sourceFilePath - Absolute VFS path to the source JSON file.
     * @returns The created document identifier.
     */
    importDocumentFromJsonPath,
    /**
     * Reads text from a user-selected `File`, validates it as a Mioframe CFR document, and creates
     * a new document in the target repository directory.
     * @param targetDirectoryPath - Absolute path to the repository directory.
     * @param file - The user-selected JSON file received via the file picker.
     * @returns The created document identifier.
     */
    importDocumentFromJsonFile,
    /**
     * Streams a directory's raw storage contents, including internal Mioframe storage files, as
     * a ZIP archive. This is a storage-level export, not a document JSON snapshot. Delivers
     * packed bytes through `onChunk` instead of returning the full archive.
     * @param path - Absolute path to the directory to export.
     * @param onChunk - Invoked with each packed archive chunk as it becomes available.
     * @param onProgress - Optional progress callback for the preparing/reading/packing phases.
     * @returns Promise that resolves once the archive has been fully streamed to `onChunk`.
     */
    exportDirectoryZip: exportDirectoryZipArchive,
    /**
     * Streams one document's storage files, written directly at archive root, as a ZIP archive.
     * This reads raw storage files, not the decoded document state — it is not a JSON snapshot.
     * Delivers packed bytes through `onChunk` instead of returning the full archive.
     * @param path - Absolute path to the directory containing the document.
     * @param id - Target document id.
     * @param onChunk - Invoked with each packed archive chunk as it becomes available.
     * @param onProgress - Optional progress callback for the preparing/reading/packing phases.
     * @returns Promise that resolves once the archive has been fully streamed to `onChunk`.
     */
    exportDocumentZip: exportDocumentZipArchive,
    /**
     * Validates and imports a ZIP archive into a directory using a bounded-memory, two-pass
     * strategy. Stops before any write if a target file or directory conflicts with the archive;
     * never overwrites, merges, or renames existing files.
     * @param targetDirectoryPath - Absolute path to the directory to import into.
     * @param archiveFile - The user-selected ZIP archive file.
     * @param onProgress - Optional progress callback for the validate/conflict/unpack phases.
     * @returns Promise that resolves once every entry has been written.
     */
    importDirectoryZip: importDirectoryZipArchive,
  };
};

export const useRepositoriesService = createGlobalState(setupRepositoriesService);
