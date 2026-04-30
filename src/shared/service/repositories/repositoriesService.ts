import { zodDocumentId, type AMDocumentId } from '@shared/lib/automerge';
import { useFileSystemService } from '../fileSystem';
import { FSNodeType, PathUtils } from '@shared/lib/virtualFileSystem';
import { zodIs } from '@shared/lib/validateZodScheme';
import { Repo } from '@automerge/automerge-repo';
import { createVFSAdapter } from '@shared/lib/automergeAdapter/createVFSAdapter';
import { createGlobalState } from '@vueuse/core';
import { fileNameToPartialKey, zodAutomergeFileName } from '@shared/lib/automergeAdapter';
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
/** Idle timeout before an unused Automerge Repo instance is removed from service cache. */
export const REPO_IDLE_TIMEOUT_MS = 60_000;
const DOCUMENT_DELETE_CLEANUP_RETRY_DELAY_MS = 50;
const DOCUMENT_DELETE_CLEANUP_MAX_ATTEMPTS = 8;
const DOCUMENT_DELETE_CLEANUP_EMPTY_PASSES_REQUIRED = 2;

const setupRepositoriesService = () => {
  const { directoryContent$, vfs } = useFileSystemService();
  const repoObservableCache = new Map<string, Observable<Repo>>();

  const getDocumentStorageFiles = async (path: string, id: AMDocumentId) => {
    const entries = await vfs.readDirectory(path);

    return entries.filter(([name, stat]) => {
      if (stat.type !== FSNodeType.File) {
        return false;
      }

      return fileNameToPartialKey(name)?.at(0) === id;
    });
  };

  const getDocumentIdList$ = defineCacheObservable(
    ({
      path,
    }: {
      /**
       * Путь репозитория
       */
      path: string;
    }) =>
      directoryContent$({ path }).pipe(
        map((value) => {
          if (value instanceof Error) {
            return value;
          }
          return value.reduce((documentIdList: AMDocumentId[], [name, { type }]) => {
            if (type === FSNodeType.File && zodIs(name, zodAutomergeFileName)) {
              const [documentId] = fileNameToPartialKey(name) ?? [];

              if (zodIs(documentId, zodDocumentId) && !documentIdList.includes(documentId)) {
                documentIdList.push(documentId);
              }
            }

            return documentIdList;
          }, []);
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
          throw docs;
        }

        if (docs.length === 0) {
          return NEVER;
        }

        return repoByPath$(path);
      }),
    );
  };

  const wait = async (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

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

  const removeDocumentStorageFiles = async (path: string, id: AMDocumentId) => {
    const documentStorageFiles = await getDocumentStorageFiles(path, id);

    await Promise.all(
      documentStorageFiles.map(async ([name]) => {
        await vfs.delete(PathUtils.join(path, name));
      }),
    );
  };

  const cleanupDeletedDocumentStorageFiles = async (path: string, id: AMDocumentId) => {
    let emptyPassCount = 0;

    // Cleanup must stay sequential so each pass observes storage files recreated by Automerge.
    for (let attempt = 0; attempt < DOCUMENT_DELETE_CLEANUP_MAX_ATTEMPTS; attempt += 1) {
      // eslint-disable-next-line no-await-in-loop -- each pass must re-read current storage state
      const documentStorageFiles = await getDocumentStorageFiles(path, id);

      if (documentStorageFiles.length === 0) {
        emptyPassCount += 1;

        if (emptyPassCount >= DOCUMENT_DELETE_CLEANUP_EMPTY_PASSES_REQUIRED) {
          return;
        }
      } else {
        emptyPassCount = 0;
        // eslint-disable-next-line no-await-in-loop -- deletion must finish before next storage scan
        await removeDocumentStorageFiles(path, id);
      }

      if (attempt < DOCUMENT_DELETE_CLEANUP_MAX_ATTEMPTS - 1) {
        // eslint-disable-next-line no-await-in-loop -- wait needed so late Automerge files can appear before next pass
        await wait(DOCUMENT_DELETE_CLEANUP_RETRY_DELAY_MS);
      }
    }
  };

  const deleteDocument = async (path: string, id: AMDocumentId) => {
    const repo = await getRepo(path);

    repo?.delete(id);

    await cleanupDeletedDocumentStorageFiles(path, id);
  };

  const createDocument = async (path: string, initialValue: CFRDocumentContent) => {
    const repo = await getRepo(path, true);

    const documentId = repo.create(initialValue).documentId;

    return documentId;
  };

  const documentIdList = defineObservableQuery(getDocumentIdList$);

  return {
    documentIdList,
    getDocumentIdList$,
    getRepo$: repo$,
    /**
     * Создать документ в репозитории
     * @param path абсолютный путь к репозиторию
     * @returns идентификатор созданного документа
     */
    createDocument,
    /**
     * Удаление документа из репозитория
     * @param path абсолютный путь репозитория
     * @param id идентификатор документа
     */
    deleteDocument,
  };
};

export const useRepositoriesService = createGlobalState(setupRepositoriesService);
