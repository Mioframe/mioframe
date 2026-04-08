import type { AMDocumentId } from '@shared/lib/automerge';
import {
  generatePropertyId,
  type DatabasePropertyId,
  type DatabaseState,
  type DatabaseUnknownPropertiesMap,
  type DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import {
  strictRecordIterableKeys,
  strictRecordRemove,
  strictRecordSet,
} from '@shared/lib/strictRecord';
import type { PatchSource } from '@shared/lib/changeObject';
import { deepPatchJsonObject } from '@shared/lib/changeObject';
import { stringPath } from '../directories';
import { distinctUntilChanged, map, type Observable } from 'rxjs';
import { defineObservableQuery } from '@shared/lib/useObservableQuery';
import { isEqual } from 'es-toolkit';
import { defineCacheObservable } from '@shared/lib/defineCacheObservable';

export const useDatabasePropertiesService = (
  databaseState$: (q: {
    documentId: AMDocumentId;
    path: string;
  }) => Observable<DatabaseState | undefined>,
  changeDatabase: (
    path: string,
    documentId: AMDocumentId,
    callback: (state: DatabaseState) => unknown,
  ) => Promise<void>,
) => {
  const databaseProperties$ = defineCacheObservable(
    ({ documentId, path }: { documentId: AMDocumentId; path: string }) =>
      databaseState$({ documentId, path }).pipe(
        map(
          (state): DatabaseUnknownPropertiesMap | undefined =>
            state?.properties,
        ),
        distinctUntilChanged(),
      ),
  );

  const databaseProperties = defineObservableQuery(databaseProperties$);

  const databaseProperty$ = defineCacheObservable(
    ({
      documentId,
      id,
      path,
    }: {
      path: string;
      documentId: AMDocumentId;
      id?: DatabasePropertyId;
    }) =>
      databaseProperties$({ documentId, path }).pipe(
        map((properties) => {
          if (properties && id) {
            return properties[id];
          }

          return undefined;
        }),
        distinctUntilChanged((a, b) => isEqual(a, b)),
      ),
  );

  const databaseProperty = defineObservableQuery(databaseProperty$);

  const post = async (
    path: string,
    documentId: AMDocumentId,
    property: DatabaseUnknownProperty,
    id: DatabasePropertyId = generatePropertyId(),
  ) => {
    await changeDatabase(path, documentId, (state) => {
      strictRecordSet(state.properties, id, property);
    });

    return id;
  };

  const patch = <T extends DatabaseUnknownProperty>(
    path: string,
    documentId: AMDocumentId,
    id: DatabasePropertyId,
    property: PatchSource<T>,
  ) =>
    changeDatabase(path, documentId, (state) => {
      const oldProperty = state.properties[id];
      if (!oldProperty) {
        throw new Error(
          `there is no property ${id} in document ${stringPath(path)} ${documentId}`,
        );
      }
      void deepPatchJsonObject(oldProperty, property);
    });

  const databasePropertiesIdList$ = defineCacheObservable(
    ({ documentId, path }: { path: string; documentId: AMDocumentId }) =>
      databaseProperties$({
        documentId,
        path,
      }).pipe(
        map((properties) => {
          if (properties) {
            return Array.from(strictRecordIterableKeys(properties)());
          }

          return undefined;
        }),
        distinctUntilChanged((a, b) => isEqual(a, b)),
      ),
  );

  const databasePropertiesIdList = defineObservableQuery(
    databasePropertiesIdList$,
  );

  const remove = (
    path: string,
    documentId: AMDocumentId,
    id: DatabasePropertyId,
  ) =>
    changeDatabase(path, documentId, (state) => {
      strictRecordRemove(state.properties, id);
    });

  return {
    databaseProperties$,
    databaseProperties,

    databasePropertiesIdList$,
    databasePropertiesIdList,

    databaseProperty$,
    databaseProperty,

    post,
    patch,
    remove,
  };
};
