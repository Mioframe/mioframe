import { createGlobalState } from '@vueuse/core';
import { useCFRDocumentService } from '../document';
import type { EntryPath } from '@shared/lib/fileSystem';
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
  const { getCFRDocumentState, change: changeCFRDocument } =
    useCFRDocumentService();

  const getDatabaseBody = (
    path: EntryPath,
    documentId: AMDocumentId,
  ): DatabaseState | DomainError | undefined => {
    const cfrDocument = getCFRDocumentState(path, documentId);

    if (cfrDocument instanceof DomainError) {
      return cfrDocument;
    }

    if (zodCheck(zodDatabaseDocumentWithContent, cfrDocument)) {
      const body = cfrDocument.body;

      if (body) {
        return databaseBodyMigrations.getLatestData(body);
      }
    }
  };

  const change = (
    path: EntryPath,
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

  const put = (
    path: EntryPath,
    documentId: AMDocumentId,
    body: DatabaseState,
  ) => {
    const documentState = getCFRDocumentState(path, documentId);

    if (documentState instanceof Error) {
      throw documentState;
    }

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
    path: EntryPath,
    documentId: AMDocumentId,
    partialBody: PatchSource<DatabaseState>,
  ) =>
    change(path, documentId, (value) => {
      deepPatchJsonObject(value, partialBody);
    });

  return {
    getDatabaseBody,

    put,
    patch,

    change,

    properties: useDatabasePropertiesService(getDatabaseBody, change),
    views: useDatabaseViewsService(getDatabaseBody, change),
    data: useDatabaseDataService(getDatabaseBody, change),
  };
});
