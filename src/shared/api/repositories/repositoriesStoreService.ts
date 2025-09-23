import {
  useDirectoryRepoScopesWeakMap,
  type DirectoryRepo,
} from '@shared/lib/cfrDocument/useDirectoryRepo';
import type { EntryPath, EntryPathString } from '@shared/lib/fileSystem';
import { createGlobalState } from '@vueuse/core';
import { useDirectoryStoreService } from '../directories';
import { ENTRY_NOT_FOUND } from '../directories';
import type { AMDocumentId } from '@shared/lib/automerge';
import { defineSubscribeByQueryService } from '@shared/lib/remoteStore';
import type { CFRDocumentContent } from '@shared/lib/cfrDocument';

export const useRepositoriesStoreService = createGlobalState(() => {
  const { getScope: getDirectoryRepoScope } = useDirectoryRepoScopesWeakMap();

  const { getEntry } = useDirectoryStoreService();

  const getDirectoryRepo = (
    path: EntryPath | EntryPathString,
  ): DirectoryRepo | undefined => {
    const entry = getEntry(path);

    if (entry && entry !== ENTRY_NOT_FOUND && 'raw' in entry) {
      const { state: directoryRepo } = getDirectoryRepoScope(entry.raw);

      return directoryRepo;
    }

    return undefined;
  };

  const getDocumentIdList = (
    path: EntryPath | EntryPathString,
  ): AMDocumentId[] | undefined => {
    const repo = getDirectoryRepo(path);
    if (repo) {
      return Array.from(repo.map.keys());
    }

    return undefined;
  };

  const subscribeDocumentIdList = defineSubscribeByQueryService(
    (pathString: EntryPath | EntryPathString) => getDocumentIdList(pathString),
  );

  const removeDocument = (
    path: EntryPath | EntryPathString,
    id: AMDocumentId,
  ) => {
    const repo = getDirectoryRepo(path);

    repo?.remove(id);
  };

  const createDocument = (
    path: EntryPath | EntryPathString,
    document: CFRDocumentContent,
  ) => {
    const repo = getDirectoryRepo(path);

    repo?.create(document);
  };

  return {
    getDirectoryRepo,

    subscribeDocumentIdList,

    removeDocument,
    createDocument,
  };
});
