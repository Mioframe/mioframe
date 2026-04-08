import type { AMDocumentId } from '@shared/lib/automerge';
import {
  getDatabaseEffectiveItem,
  generateItemId,
  getDatabaseEffectiveValue,
  getDatabaseStoredItem,
  getDatabaseStoredValue,
  type DatabaseData,
  type DatabaseItem,
  type DatabaseItemId,
  type DatabasePropertyId,
  type DatabaseUnknownPropertiesMap,
  type DatabaseState,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { deepPutJsonObject } from '@shared/lib/changeObject';
import { strictRecordRemove, strictRecordSet } from '@shared/lib/strictRecord';
import { queryIdList } from './data/queryData';
import type { Query } from 'sift';
import { setupDatabaseViewsService } from './view/databaseViewsService';

import {
  combineLatest,
  distinctUntilChanged,
  map,
  type Observable,
} from 'rxjs';
import { defineObservableQuery } from '@shared/lib/useObservableQuery';
import { defineCacheObservable } from '@shared/lib/defineCacheObservable';
import { isEqual } from 'es-toolkit';

export const setupDatabaseDataService = (
  databaseState$: (q: {
    documentId: AMDocumentId;
    path: string;
  }) => Observable<DatabaseState | undefined>,

  changeDatabaseState: (
    path: string,
    documentId: AMDocumentId,
    callback: (state: DatabaseState) => unknown,
  ) => Promise<void>,
) => {
  const change = (
    path: string,
    documentId: AMDocumentId,
    callback: (state: DatabaseData) => unknown,
  ) =>
    changeDatabaseState(path, documentId, (state) => {
      callback(state.data);
    });

  const postValue = (
    path: string,
    documentId: AMDocumentId,
    itemId: DatabaseItemId,
    propertyId: DatabasePropertyId,
    value: unknown,
  ) =>
    changeDatabaseState(path, documentId, (state) => {
      const data = state.data;

      if (!data[itemId]) {
        data[itemId] = {};
      }

      const item = data[itemId];
      const storedValue = getDatabaseStoredValue(
        value,
        state.properties[propertyId],
        { trimString: true },
      );

      if (storedValue === undefined) {
        strictRecordRemove(item, propertyId);
      } else {
        strictRecordSet(item, propertyId, storedValue);
      }
    });

  const removeItem = (
    path: string,
    documentId: AMDocumentId,
    itemId: DatabaseItemId,
  ) =>
    change(path, documentId, (data) => {
      strictRecordRemove(data, itemId);
    });

  const databaseData$ = defineCacheObservable(
    ({ documentId, path }: { path: string; documentId: AMDocumentId }) =>
      databaseState$({ documentId, path }).pipe(
        map((state) => state?.data),
        distinctUntilChanged(),
      ),
  );

  const databaseProperties$ = defineCacheObservable(
    ({ documentId, path }: { path: string; documentId: AMDocumentId }) =>
      databaseState$({ documentId, path }).pipe(
        map(
          (state): DatabaseUnknownPropertiesMap | undefined =>
            state?.properties,
        ),
        distinctUntilChanged(),
      ),
  );

  const {
    filter: { filter$ },
    sorting: { databaseSorting$ },
  } = setupDatabaseViewsService(databaseState$, changeDatabaseState);

  const filteredIdList$ = defineCacheObservable(
    ({
      documentId,
      options: { idQuery, itemQuery, slice },
      path,
      viewId,
    }: {
      path: string;
      documentId: AMDocumentId;
      viewId?: DatabaseViewId;
      options: {
        itemQuery?: Query<DatabaseItem>;
        idQuery?: Query<DatabaseItemId>;
        slice?: {
          first?: number;
          last?: number;
        };
      };
    }) =>
      combineLatest([
        databaseData$({ documentId, path }),
        databaseProperties$({ documentId, path }),
        filter$({ documentId, path, viewId }),
        databaseSorting$({ documentId, path, viewId }),
      ]).pipe(
        map(([data, properties, filter, sorting]) => {
          if (data) {
            const idList = queryIdList(data, {
              filter,
              sorting,
              itemQuery,
              idQuery,
              slice,
              properties,
            });

            return idList;
          }

          return undefined;
        }),
        distinctUntilChanged(),
      ),
  );

  const databaseItem$ = defineCacheObservable(
    ({
      documentId,
      path,
      itemId,
    }: {
      path: string;
      documentId: AMDocumentId;
      itemId?: DatabaseItemId;
    }) =>
      databaseData$({ documentId, path }).pipe(
        map((data) => (itemId ? data?.[itemId] : undefined)),
        distinctUntilChanged((a, b) => isEqual(a, b)),
      ),
  );

  const databaseEffectiveItem$ = defineCacheObservable(
    ({
      documentId,
      path,
      itemId,
    }: {
      path: string;
      documentId: AMDocumentId;
      itemId?: DatabaseItemId;
    }) =>
      combineLatest([
        databaseItem$({ documentId, itemId, path }),
        databaseProperties$({ documentId, path }),
      ]).pipe(
        map(([item, properties]) => getDatabaseEffectiveItem(item, properties)),
        distinctUntilChanged((a, b) => isEqual(a, b)),
      ),
  );

  const databaseStoredValue$ = defineCacheObservable(
    ({
      documentId,
      path,
      itemId,
      propertyId,
    }: {
      path: string;
      documentId: AMDocumentId;
      itemId: DatabaseItemId;
      propertyId: DatabasePropertyId;
    }) =>
      databaseItem$({ documentId, itemId, path }).pipe(
        map((item) => item?.[propertyId]),
        distinctUntilChanged(),
      ),
  );

  const databaseEffectiveValue$ = defineCacheObservable(
    ({
      documentId,
      path,
      itemId,
      propertyId,
    }: {
      path: string;
      documentId: AMDocumentId;
      itemId: DatabaseItemId;
      propertyId: DatabasePropertyId;
    }) =>
      combineLatest([
        databaseItem$({ documentId, itemId, path }),
        databaseProperties$({ documentId, path }),
      ]).pipe(
        map(([item, properties]) =>
          getDatabaseEffectiveValue(item, propertyId, properties?.[propertyId]),
        ),
        distinctUntilChanged((a, b) => isEqual(a, b)),
      ),
  );

  const postItem = async (
    path: string,
    documentId: AMDocumentId,
    item: DatabaseItem,
    itemId: DatabaseItemId = generateItemId(),
  ) => {
    await changeDatabaseState(path, documentId, (state) => {
      const data = state.data;
      const storedItem = getDatabaseStoredItem(item, state.properties, {
        trimString: true,
      });
      const currentItem = data[itemId];

      if (!currentItem) {
        data[itemId] = storedItem;
        return;
      }

      deepPutJsonObject(currentItem, storedItem);
    });

    return itemId;
  };

  return {
    filteredIdList: defineObservableQuery(filteredIdList$),

    databaseItem: defineObservableQuery(databaseItem$),
    databaseEffectiveItem: defineObservableQuery(databaseEffectiveItem$),

    databaseStoredValue: defineObservableQuery(databaseStoredValue$),
    databaseEffectiveValue: defineObservableQuery(databaseEffectiveValue$),

    postValue,
    change,
    removeItem,
    postItem,
  };
};
