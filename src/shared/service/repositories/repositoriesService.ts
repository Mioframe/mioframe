import type { AMDocumentId } from '@shared/lib/automerge';
import { useFileSystemService } from '../fileSystem';
import { Repo } from '@automerge/automerge-repo';
import { createVFSAdapter } from '@shared/lib/automergeAdapter/createVFSAdapter';
import { createGlobalState } from '@vueuse/core';
import type { CFRDocumentContent } from '@shared/lib/cfrDocument';
import {
  concat,
  defer,
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
import { defineCacheObservable } from '@shared/lib/defineCacheObservable';
import {
  cleanupDeletedDocumentStorageFiles,
  getRepositoryFacts,
  getRegularDirectoryEntries,
  getDocumentStorageFiles,
} from './repositoryStorageFiles';
/** Idle timeout before an unused Automerge Repo instance is removed from service cache. */
export const REPO_IDLE_TIMEOUT_MS = 60_000;

const setupRepositoriesService = () => {
  const { directoryContent$, vfs } = useFileSystemService();
  const repoObservableCache = new Map<string, Observable<Repo>>();

  const getRepositoryFacts$ = defineCacheObservable(
    ({
      path,
    }: {
      /**
       * Repository path.
       */
      path: string;
    }) =>
      directoryContent$({ path }).pipe(
        map((value) => {
          if (value instanceof Error) {
            return value;
          }

          return getRepositoryFacts(value);
        }),
      ),
  );

  const getRepositoryVisibleEntries$ = defineCacheObservable(
    ({
      hideAutomergeFiles = true,
      path,
    }: {
      /** Whether Automerge storage files should stay hidden in repository-aware file listings. */
      hideAutomergeFiles?: boolean | undefined;
      /** Absolute repository path whose visible entries should be observed. */
      path: string;
    }) =>
      directoryContent$({ path }).pipe(
        map((value) => {
          if (value instanceof Error) {
            return value;
          }

          return getRegularDirectoryEntries(value, hideAutomergeFiles);
        }),
      ),
  );

  const getDocumentIdList$ = defineCacheObservable(
    ({
      path,
    }: {
      /**
       * Repository path.
       */
      path: string;
    }) =>
      getRepositoryFacts$({ path }).pipe(
        map((value) => {
          if (value instanceof Error) {
            return value;
          }

          return value.documentIds;
        }),
      ),
  );

  const createRepoObservable = (path: string) => {
    let repo: Repo | undefined;

    return defer(() => {
      repo ??= new Repo({
        storage: createVFSAdapter(vfs, path),
      });

      return concat(of(repo), NEVER);
    }).pipe(
      finalize(() => {
        repo = undefined;
        repoObservableCache.delete(path);
      }),
      share({
        connector: () => new ReplaySubject<Repo>(1),
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
      return repoByPath$(path);
    }

    return getDocumentIdList$({ path }).pipe(
      switchMap((docs) => {
        if (docs instanceof Error) {
          return NEVER;
        }

        if (docs.length === 0) {
          return NEVER;
        }

        return repoByPath$(path);
      }),
    );
  };

  async function getRepo(path: string, initial: true): Promise<Repo>;
  async function getRepo(path: string, initial?: false): Promise<undefined | Repo>;
  async function getRepo(path: string, initial = false) {
    if (initial) {
      return firstValueFrom(repo$(path, true));
    }

    const documentIdList = await firstValueFrom(getDocumentIdList$({ path }));

    if (documentIdList instanceof Error) {
      throw documentIdList;
    }

    if (documentIdList.length === 0) {
      return undefined;
    }

    return firstValueFrom(repoByPath$(path).pipe(take(1)));
  }

  const deleteDocument = async (path: string, id: AMDocumentId) => {
    const documentStorageFiles = await getDocumentStorageFiles(vfs, path, id);

    if (documentStorageFiles.length === 0) {
      return;
    }

    const repo = await getRepo(path);

    repo?.delete(id);

    await cleanupDeletedDocumentStorageFiles(vfs, path, id);
  };

  const createDocument = async (path: string, initialValue: CFRDocumentContent) => {
    const repo = await getRepo(path, true);

    const documentId = repo.create(initialValue).documentId;

    return documentId;
  };

  /**
   * Initializes repository storage for an empty mounted directory through the shared repo cache.
   * @param path - Absolute path to the repository root.
   */
  const initializeRepository = async (path: string): Promise<void> => {
    await getRepo(path, true);
  };

  const documentIdList = defineObservableQuery(getDocumentIdList$);
  const repositoryFacts = defineObservableQuery(getRepositoryFacts$);
  const repositoryVisibleEntries = defineObservableQuery(getRepositoryVisibleEntries$);

  return {
    documentIdList,
    repositoryFacts,
    repositoryVisibleEntries,
    getDocumentIdList$,
    getRepositoryFacts$,
    getRepositoryVisibleEntries$,
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
  };
};

export const useRepositoriesService = createGlobalState(setupRepositoriesService);
