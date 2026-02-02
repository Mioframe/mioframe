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
import type { PatchSource } from '@shared/lib/changeObject';
import {
  deepPatchJsonObject,
  deepPutJsonObject,
} from '@shared/lib/changeObject';
import { applyMigrateDatabaseDocument } from '@shared/lib/databaseDocument/migrations';
import { useDatabasePropertiesService } from './databasePropertiesService';
import { setupDatabaseViewsService } from './view/databaseViewsService';
import { setupDatabaseDataService } from './databaseDataService';
import type { Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs';
import { defineQuery } from '@shared/lib/observableQuery';

export const useDatabaseDocumentService = createGlobalState(() => {
  const { change: changeCFRDocument, cfrDocumentState$ } = useDocumentService();

  const databaseState$ = ({
    documentId,
    path,
  }: {
    documentId: AMDocumentId;
    path: string;
  }): Observable<DatabaseState | undefined> =>
    cfrDocumentState$({ documentId, path }).pipe(
      map((cfrDocument) => {
        if (zodCheck(zodDatabaseDocumentWithContent, cfrDocument)) {
          return cfrDocument.body;
        }
        return undefined;
      }),
      distinctUntilChanged(),
      map((body) => {
        if (body) {
          return databaseBodyMigrations.getLatestData(body);
        }
        return undefined;
      }),
      distinctUntilChanged(),
    );

  const databaseState = defineQuery(databaseState$);

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
  ) =>
    change(path, documentId, (value) => {
      deepPutJsonObject(value, body);
    });

  const patch = (
    path: string,
    documentId: AMDocumentId,
    partialBody: PatchSource<DatabaseState>,
  ) =>
    change(path, documentId, (value) => {
      deepPatchJsonObject(value, partialBody);
    });

  return {
    databaseState,
    databaseState$,

    put,
    patch,

    change,

    properties: useDatabasePropertiesService(databaseState$, change),
    views: setupDatabaseViewsService(databaseState$, change),
    data: setupDatabaseDataService(databaseState$, change),
  };
});
