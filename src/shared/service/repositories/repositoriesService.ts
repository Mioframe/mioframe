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

const setupRepositoriesService = () => {
  const { readDirectory, vfs } = useFileSystemService();

  const repositoriesMap = new Map<string, Repo>();

  const readRepository = async (path: string): Promise<AMDocumentId[]> => {
    const entries = await readDirectory(path);

    const documentIdList: AMDocumentId[] = [];

    entries.forEach(([name, type]) => {
      if (type === FileType.File && zodIs(name, zodAutomergeFileName)) {
        const [documentId] = fileNameToPartialKey(name) ?? [];

        if (zodIs(documentId, zodDocumentId)) {
          documentIdList.push(documentId);
        }
      }
    });

    return documentIdList;
  };

  const getRepo = (path: string): Repo => {
    const repo = repositoriesMap.get(path);
    if (repo) {
      return repo;
    }

    const newRepo = new Repo({
      storage: createVFSAdapter(vfs, path),
    });

    repositoriesMap.set(path, newRepo);

    return newRepo;
  };

  const deleteDocument = (path: string, id: AMDocumentId) => {
    const repo = getRepo(path);
    repo.delete(id);
  };

  const createDocument = (
    path: string,
    initialValue: CFRDocumentContent,
  ): AMDocumentId => {
    const repo = getRepo(path);

    const documentId = repo.create(initialValue);

    return zodDocumentId.parse(documentId);
  };

  return {
    /**
     * Прочитать список документов в репозитории
     * @param path абсолютный путь к репозиторию
     * @returns коллекция документов
     */
    readRepository,
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
    /**
     * Получить/создать репозиторий по пути
     * @param path абсолютный путь репозитория
     * @returns Repo
     */
    getRepo,
  };
};

export const useRepositoriesService = createGlobalState(
  setupRepositoriesService,
);
