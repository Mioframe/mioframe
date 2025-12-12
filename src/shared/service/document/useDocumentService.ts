import type { AMDocHandle, AMDocumentId } from '@shared/lib/automerge';
import { createGlobalState } from '@vueuse/core';
import { useRepositoriesService } from '../repositories';
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

export const useDocumentService = createGlobalState(() => {
  const { getRepo } = useRepositoriesService();

  const getDocHandle = async (
    directoryPath: string,
    documentId: AMDocumentId,
  ): Promise<AMDocHandle> => {
    const repo = getRepo(directoryPath);

    return await repo.find(documentId);
  };

  const getCFRDocumentState = async (
    path: string,
    documentId: AMDocumentId,
  ) => {
    const docHandle = await getDocHandle(path, documentId);

    const state = docHandle.doc();

    if (zodIs(state, zodCFRDocumentContent)) {
      return state;
    }

    return undefined;
  };

  const getDocumentDescription = async (
    path: string,
    id: AMDocumentId,
  ): Promise<
    | {
        name: string;
        type: string;
        version?: number | undefined;
      }
    | undefined
  > => {
    const doc = await getCFRDocumentState(path, id);

    if (doc) {
      return omit(doc, ['body']);
    }
    return undefined;
  };

  const put = async (
    directoryPath: string,
    documentId: AMDocumentId,
    content: CFRDocumentContent,
  ) => {
    const docHandle = await getDocHandle(directoryPath, documentId);

    docHandle.change((doc) => {
      const migratedDoc = applyCFRDocumentMigration(doc);

      deepPutJsonObject(migratedDoc, content);
    });
  };

  const patch = async (
    directoryPath: string,
    documentId: AMDocumentId,
    partialContent: PatchSource<CFRDocumentContent>,
  ) => {
    const docHandle = await getDocHandle(directoryPath, documentId);

    docHandle.change((doc) => {
      const migratedDoc = applyCFRDocumentMigration(doc);

      deepPatchJsonObject(migratedDoc, partialContent, { trimString: true });
    });
  };

  const change = async (
    directoryPath: string,
    documentId: AMDocumentId,
    callback: (doc: CFRDocumentContent) => unknown,
  ) => {
    const docHandle = await getDocHandle(directoryPath, documentId);

    return new Promise<void>((resolve, reject) => {
      docHandle.change((doc) => {
        try {
          const cfrDocumentContent = applyCFRDocumentMigration(doc);
          callback(cfrDocumentContent);
          resolve();
        } catch (error) {
          reject(error);
          throw error;
        }
      });
    });
  };

  return {
    getDocumentDescription,

    put,
    patch,

    change,

    getCFRDocumentState,
  };
});
