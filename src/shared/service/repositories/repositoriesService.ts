import { zodDocumentId, type AMDocumentId } from '@shared/lib/automerge';
import { useFileSystemService } from '../fileSystem';
import { FileType } from '@shared/lib/virtualFileSystem';
import { zodIs } from '@shared/lib/validateZodScheme';
import { Repo } from '@automerge/automerge-repo';
import { createVFSAdapter } from '@shared/lib/automergeAdapter/createVFSAdapter';
import { createGlobalState } from '@vueuse/core';
import {
  fileNameToPartialKey,
  zodAutomergeFileName,
} from '@shared/lib/automergeAdapter';
import type { CFRDocumentContent } from '@shared/lib/cfrDocument';
import type { Observable } from 'rxjs';
import { filter, of, shareReplay } from 'rxjs';
import { finalize, firstValueFrom, map, switchMap, take } from 'rxjs';
import { defineQuery } from '@shared/lib/observableQuery';

const setupRepositoriesService = () => {
  const { directoryContent$: watchDirectory$, vfs } = useFileSystemService();

  const getDocumentIdList$ = ({
    path,
  }: {
    /**
     * Путь репозитория
     */
    path: string;
  }) => {
    const directory$ = watchDirectory$({ path });

    return directory$.pipe(
      map((entries) =>
        entries.reduce((documentIdList: AMDocumentId[], [name, type]) => {
          if (type === FileType.File && zodIs(name, zodAutomergeFileName)) {
            const [documentId] = fileNameToPartialKey(name) ?? [];

            if (
              zodIs(documentId, zodDocumentId) &&
              !documentIdList.includes(documentId)
            ) {
              documentIdList.push(documentId);
            }
          }

          return documentIdList;
        }, []),
      ),
    );
  };

  const repo$Cache = new Map<string, Observable<Repo>>();

  function getRepo$(path: string, initial = false) {
    let repo$ = repo$Cache.get(path);
    if (repo$) {
      return repo$;
    }

    repo$ = getDocumentIdList$({ path }).pipe(
      filter((docs) => initial || docs.length > 0),
      take(1),
      switchMap(() =>
        of(
          new Repo({
            storage: createVFSAdapter(vfs, path),
          }),
        ),
      ),
      finalize(() => repo$Cache.delete(path)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    repo$Cache.set(path, repo$);

    return repo$;
  }

  async function getRepo(path: string, initial: true): Promise<Repo>;
  async function getRepo(
    path: string,
    initial?: false,
  ): Promise<undefined | Repo>;
  async function getRepo(path: string, initial = false) {
    return firstValueFrom(getRepo$(path, initial));
  }

  const deleteDocument = async (path: string, id: AMDocumentId) => {
    const repo = await getRepo(path);
    repo?.delete(id);
  };

  const createDocument = async (
    path: string,
    initialValue: CFRDocumentContent,
  ) => {
    const repo = await getRepo(path, true);

    const documentId = repo.create(initialValue).documentId;

    return documentId;
  };

  const documentIdList = defineQuery(getDocumentIdList$);

  return {
    documentIdList,
    getDocumentIdList$,
    getRepo$,
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

export const useRepositoriesService = createGlobalState(
  setupRepositoriesService,
);
