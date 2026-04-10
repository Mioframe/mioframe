import { zodDocumentId, type AMDocumentId } from '@shared/lib/automerge';
import { useFileSystemService } from '../fileSystem';
import { FSNodeType } from '@shared/lib/virtualFileSystem';
import { zodIs } from '@shared/lib/validateZodScheme';
import { Repo } from '@automerge/automerge-repo';
import { createVFSAdapter } from '@shared/lib/automergeAdapter/createVFSAdapter';
import { createGlobalState } from '@vueuse/core';
import { fileNameToPartialKey, zodAutomergeFileName } from '@shared/lib/automergeAdapter';
import type { CFRDocumentContent } from '@shared/lib/cfrDocument';
import { filter, of } from 'rxjs';
import { firstValueFrom, map, switchMap, take } from 'rxjs';
import { defineObservableQuery } from '@shared/lib/useObservableQuery';
import { defineCacheObservable } from '@shared/lib/defineCacheObservable';

const setupRepositoriesService = () => {
  const { directoryContent$, vfs } = useFileSystemService();

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

  const repo$ = defineCacheObservable((path: string, initial: boolean = false) => {
    return getDocumentIdList$({ path }).pipe(
      filter((docs) => {
        return !(docs instanceof Error) && (initial || docs.length > 0);
      }),
      take(1),
      switchMap(() =>
        of(
          new Repo({
            storage: createVFSAdapter(vfs, path),
          }),
        ),
      ),
    );
  });

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
