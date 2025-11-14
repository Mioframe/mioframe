import type { AMDocumentId } from '@shared/lib/automerge';
import { useDocHandleScopesWeakMap } from '@shared/lib/cfrDocument/useDocHandle';
import type { EntryPath } from '@shared/lib/fileSystem';
import { createGlobalState } from '@vueuse/core';
import { useRepositoriesStoreService } from '../repositories';
import type { CFRDocumentContent } from '@shared/lib/cfrDocument';
import { zodCFRDocumentContent } from '@shared/lib/cfrDocument';
import { zodIs } from '@shared/lib/validateZodScheme';
import { omit } from 'es-toolkit';
import { applyCFRDocumentMigration } from '@shared/lib/cfrDocument/migrations';
import type { PatchSource } from '@shared/lib/changeObject';
import {
  deepPatchJsonObject,
  deepPutJsonObject,
} from '@shared/lib/changeObject';
import { defineSubscribeByQueryService } from '@shared/lib/subscriptions/subscribeService';
import { stringPath } from '../directories';
import { DomainError } from '@shared/lib/error';

export const useCFRDocumentService = createGlobalState(() => {
  const { getScope: getDocumentScope } = useDocHandleScopesWeakMap();
  const { getDirectoryRepo } = useRepositoriesStoreService();

  const getDocHandle = (directoryPath: EntryPath, documentId: AMDocumentId) => {
    const repo = getDirectoryRepo(directoryPath);

    if (repo instanceof DomainError) {
      return repo;
    }

    return repo.map.get(documentId);
  };

  const getCFRDocumentState = (
    path: EntryPath,
    documentId: AMDocumentId,
  ): CFRDocumentContent | DomainError | undefined => {
    const docHandle = getDocHandle(path, documentId);
    if (docHandle instanceof DomainError) {
      return docHandle;
    }
    if (docHandle) {
      const { state } = getDocumentScope(docHandle);
      if (zodIs(state.docRef, zodCFRDocumentContent)) {
        return state.docRef;
      }
    }

    return undefined;
  };

  const getCFRDocumentDescription = (
    path: EntryPath,
    id: AMDocumentId,
  ): Omit<CFRDocumentContent, 'body'> | DomainError | undefined => {
    const doc = getCFRDocumentState(path, id);

    if (doc instanceof DomainError) {
      return doc;
    }

    if (doc) {
      return omit(doc, ['body']);
    }
    return undefined;
  };

  const subscribeDocumentDescription = defineSubscribeByQueryService(
    getCFRDocumentDescription,
  );

  const put = (
    directoryPath: EntryPath,
    documentId: AMDocumentId,
    content: CFRDocumentContent,
  ) => {
    const docHandle = getDocHandle(directoryPath, documentId);
    if (docHandle instanceof DomainError) {
      throw docHandle;
    }

    if (!docHandle) {
      throw new DomainError(
        `document ${stringPath(directoryPath)} ${documentId} not found`,
      );
    }

    docHandle.change((doc) => {
      const migratedDoc = applyCFRDocumentMigration(doc);

      deepPutJsonObject(migratedDoc, content);
    });
  };

  const patch = (
    directoryPath: EntryPath,
    documentId: AMDocumentId,
    partialContent: PatchSource<CFRDocumentContent>,
  ) => {
    const docHandle = getDocHandle(directoryPath, documentId);

    if (docHandle instanceof DomainError) {
      return docHandle;
    }

    if (!docHandle) {
      throw new DomainError(
        `document ${stringPath(directoryPath)} ${documentId} not found`,
      );
    }

    docHandle.change((doc) => {
      const migratedDoc = applyCFRDocumentMigration(doc);

      deepPatchJsonObject(migratedDoc, partialContent, { trimString: true });
    });
  };

  const change = (
    directoryPath: EntryPath,
    documentId: AMDocumentId,
    callback: (doc: CFRDocumentContent) => unknown,
  ) => {
    const docHandle = getDocHandle(directoryPath, documentId);

    if (docHandle instanceof DomainError) {
      throw docHandle;
    }

    if (!docHandle) {
      throw new DomainError(
        `document ${stringPath(directoryPath)} ${documentId} not found`,
      );
    }

    return new Promise<void>((resolve, reject) => {
      docHandle.change((doc) => {
        try {
          const cfrDocumentContent = applyCFRDocumentMigration(doc);
          callback(cfrDocumentContent);
          resolve();
        } catch (error: unknown) {
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          reject(error);
          throw error;
        }
      });
    });
  };

  return {
    subscribeDocumentDescription,

    put,
    patch,

    change,

    getCFRDocumentState,
  };
});
