import {
  useDirectoryRepoScopesWeakMap,
  type DirectoryRepo,
} from '@shared/lib/cfrDocument/useDirectoryRepo';
import type { EntryPath } from '@shared/lib/fileSystem';
import { createGlobalState } from '@vueuse/core';
import { stringPath, useDirectoryStoreService } from '../directories';
import type { AMDocumentId } from '@shared/lib/automerge';
import { defineSubscribeByQueryService } from '@shared/lib/subscriptions';
import type { CFRDocumentContent } from '@shared/lib/cfrDocument';
import { DomainError } from '@shared/lib/error';

export const useRepositoriesStoreService = createGlobalState(() => {
  const { getScope: getDirectoryRepoScope } = useDirectoryRepoScopesWeakMap();

  const { getEntry } = useDirectoryStoreService();

  const getDirectoryRepo = (path: EntryPath): DirectoryRepo | DomainError => {
    const entry = getEntry(path);

    if (entry instanceof DomainError) {
      return entry;
    }

    if (!entry || entry.type === 'file') {
      return new DomainError(
        `Entry ${stringPath(path)} is not directory with document repo`,
      );
    }

    const { state: directoryRepo } = getDirectoryRepoScope(entry.raw);

    return directoryRepo;
  };

  const getDocumentIdList = (path: EntryPath): AMDocumentId[] | DomainError => {
    const repo = getDirectoryRepo(path);

    if (repo instanceof DomainError) {
      return repo;
    }

    return Array.from(repo.map.keys());
  };

  const subscribeDocumentIdList = defineSubscribeByQueryService(
    (path: EntryPath) => getDocumentIdList(path),
  );

  const removeDocument = (path: EntryPath, id: AMDocumentId) => {
    const repo = getDirectoryRepo(path);

    if (repo instanceof Error) {
      throw repo;
    }

    repo.remove(id);
  };

  const createDocument = (path: EntryPath, document: CFRDocumentContent) => {
    const repo = getDirectoryRepo(path);

    if (repo instanceof Error) {
      throw repo;
    }

    repo.create(document);
  };

  return {
    getDirectoryRepo,

    subscribeDocumentIdList,

    removeDocument,
    createDocument,
  };
});
