import type { AMDocumentId } from '@shared/lib/automerge';
import { useDocHandleScopesWeakMap } from '@shared/lib/cfrDocument/useDocHandle';
import type { EntryPath, EntryPathString } from '@shared/lib/fileSystem';
import { createGlobalState } from '@vueuse/core';
import { useRepositoriesStoreService } from '../repositories';
import type { CFRDocumentContent } from '@shared/lib/cfrDocument';
import { zodCFRDocumentContent } from '@shared/lib/cfrDocument';
import { zodIs } from '@shared/lib/validateZodScheme';
import { omit } from 'es-toolkit';
import { applyCFRDocumentMigration } from '@shared/lib/cfrDocument/migrations';
import {
  deepPatchJsonObject,
  deepPutJsonObject,
} from '@shared/lib/changeObject';
import type { PartialDeep } from 'type-fest';
import { defineSubscribeByQueryService } from '@shared/lib/remoteStore/subscribeService';

export const useCFRDocumentService = createGlobalState(() => {
  const { getScope: getDocumentScope } = useDocHandleScopesWeakMap();
  const { getDirectoryRepo } = useRepositoriesStoreService();

  const getDocHandle = (
    directoryPath: EntryPath | EntryPathString,
    documentId: AMDocumentId,
  ) => {
    const repo = getDirectoryRepo(directoryPath);

    if (repo) {
      return repo.map.get(documentId);
    }

    return undefined;
  };

  const getDocumentContent = (
    path: EntryPath | EntryPathString,
    documentId: AMDocumentId,
  ) => {
    const docHandle = getDocHandle(path, documentId);
    if (docHandle) {
      const { state } = getDocumentScope(docHandle);
      return state.docRef;
    }

    return undefined;
  };

  const getDocumentDescription = (
    path: EntryPath | EntryPathString,
    id: AMDocumentId,
  ): Omit<CFRDocumentContent, 'body'> | undefined => {
    const doc = getDocumentContent(path, id);
    if (zodIs(doc, zodCFRDocumentContent)) {
      return omit(doc, ['body']);
    }
    return undefined;
  };

  const subscribeDocumentDescription = defineSubscribeByQueryService(
    getDocumentDescription,
  );

  const put = (
    directoryPath: EntryPath,
    documentId: AMDocumentId,
    content: CFRDocumentContent,
  ) => {
    const docHandle = getDocHandle(directoryPath, documentId);

    docHandle?.change((doc) => {
      const migratedDoc = applyCFRDocumentMigration(doc);

      deepPutJsonObject(migratedDoc, content);
    });
  };

  const patch = (
    directoryPath: EntryPath,
    documentId: AMDocumentId,
    partialContent: PartialDeep<CFRDocumentContent>,
  ) => {
    const docHandle = getDocHandle(directoryPath, documentId);

    docHandle?.change((doc) => {
      const migratedDoc = applyCFRDocumentMigration(doc);

      deepPatchJsonObject(migratedDoc, partialContent, { trimString: true });
    });
  };

  return {
    subscribeDocumentDescription,

    put,
    patch,
  };
});
