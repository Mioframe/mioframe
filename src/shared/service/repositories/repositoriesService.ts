import { zodDocumentId, type AMDocumentId } from '@shared/lib/automerge';
import { useFileSystemService } from '../fileSystem';
import { FSNodeType } from '@shared/lib/virtualFileSystem';
import { zodIs } from '@shared/lib/validateZodScheme';
import { Repo } from '@automerge/automerge-repo';
import { createVFSAdapter } from '@shared/lib/automergeAdapter/createVFSAdapter';
import { createGlobalState } from '@vueuse/core';
import { fileNameToPartialKey, zodAutomergeFileName } from '@shared/lib/automergeAdapter';
import type { CFRDocumentContent } from '@shared/lib/cfrDocument';
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
import { defineCacheObservable } from '@shared/lib/defineCacheObservable';

/** Idle timeout before an unused Automerge Repo instance is disposed and removed from cache. */
export const REPO_IDLE_TIMEOUT_MS = 60_000;

const setupRepositoriesService = () => {
  const { directoryContent$, vfs } = useFileSystemService();
  const repoObservableCache = new Map<string, Observable<Repo>>();

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
        void repo?.shutdown();
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
      filter((docs) => !(docs instanceof Error) && docs.length > 0),
      take(1),
      switchMap(() => repoByPath$(path)),
    );
  };

  async function getRepo(path: string, initial: true): Promise<Repo>;
  async function getRepo(path: string, initial?: false): Promise<undefined | Repo>;
  async function getRepo(path: string, initial = false) {
    return firstValueFrom(repo$(path, initial));
  }

  const deleteDocument = async (path: string, id: AMDocumentId) => {
    const repo = await getRepo(path);
    repo?.delete(id);
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
