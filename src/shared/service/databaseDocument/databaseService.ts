import { createGlobalState } from '@vueuse/core';
import { useDocumentService } from '../document';
import type { AMDocumentId } from '@shared/lib/automerge';
import { zodCheck } from '@shared/lib/validateZodScheme';
import type { DatabaseState } from '@shared/lib/databaseDocument';
import {
  zodDatabaseDocumentWithContent,
  zodDatabaseTypeDocument,
} from '@shared/lib/databaseDocument';
import { databaseBodyMigrations } from '@shared/lib/databaseDocument/migrations/bodyMigrations';
import { stringPath } from '../directories';
import { DomainError } from '@shared/lib/error';
import type { PatchSource } from '@shared/lib/changeObject';
import {
  deepPatchJsonObject,
  deepPutJsonObject,
} from '@shared/lib/changeObject';
import { applyMigrateDatabaseDocument } from '@shared/lib/databaseDocument/migrations';
import { useDatabasePropertiesService } from './databasePropertiesService';
import { useDatabaseViewsService } from './view/databaseViewsService';
import { useDatabaseDataService } from './databaseDataService';

export const useDatabaseDocumentService = createGlobalState(() => {
  const {
    getCFRDocumentState,
    change: changeCFRDocument,
    onChangeDocument,
  } = useDocumentService();

  const getDatabaseBody = async (
    path: string,
    documentId: AMDocumentId,
  ): Promise<DatabaseState | undefined> => {
    const cfrDocument = await getCFRDocumentState(path, documentId);

    if (zodCheck(zodDatabaseDocumentWithContent, cfrDocument)) {
      const body = cfrDocument.body;

      if (body) {
        return databaseBodyMigrations.getLatestData(body);
      }
    }
  };

  const change = (
    path: string,
    documentId: AMDocumentId,
    callback: (state: DatabaseState) => unknown,
  ) =>
    changeCFRDocument(path, documentId, (cfrDocument) => {
      if (
        zodCheck(zodDatabaseTypeDocument, cfrDocument, { throwAnError: true })
      ) {
        const body = applyMigrateDatabaseDocument(cfrDocument);
        callback(body);
      }
    });

  const put = async (
    path: string,
    documentId: AMDocumentId,
    body: DatabaseState,
  ) => {
    const documentState = await getCFRDocumentState(path, documentId);

    if (!documentState) {
      throw new DomainError(
        `document ${stringPath(path)} ${documentId}` + ' not found',
      );
    }

    return change(path, documentId, (value) => {
      deepPutJsonObject(value, body);
    });
  };

  const patch = (
    path: string,
    documentId: AMDocumentId,
    partialBody: PatchSource<DatabaseState>,
  ) =>
    change(path, documentId, (value) => {
      deepPatchJsonObject(value, partialBody);
    });

  return {
    getDatabaseBody,
    onChangeDocument,

    put,
    patch,

    change,

    properties: useDatabasePropertiesService(getDatabaseBody, change),
    views: useDatabaseViewsService(getDatabaseBody, change),
    data: useDatabaseDataService(getDatabaseBody, change),
  };
});
