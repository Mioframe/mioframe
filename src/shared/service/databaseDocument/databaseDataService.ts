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

import { combineLatest, distinctUntilChanged, map, type Observable } from 'rxjs';
import { defineObservableQuery } from '@shared/lib/useObservableQuery';
import { defineCacheObservable } from '@shared/lib/defineCacheObservable';
import { isEqual } from 'es-toolkit';
import type { DatabaseStateQueryResult } from './databaseService';

export const setupDatabaseDataService = (
  databaseState$: (q: {
    documentId: AMDocumentId;
    path: string;
  }) => Observable<DatabaseStateQueryResult>,

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
      const storedValue = getDatabaseStoredValue(value, state.properties[propertyId], {
        trimString: true,
      });

      if (storedValue === undefined) {
        strictRecordRemove(item, propertyId);
      } else {
        strictRecordSet(item, propertyId, storedValue);
      }
    });

  const removeItem = (path: string, documentId: AMDocumentId, itemId: DatabaseItemId) =>
    change(path, documentId, (data) => {
      strictRecordRemove(data, itemId);
    });

  const databaseData$ = defineCacheObservable(
    ({ documentId, path }: { path: string; documentId: AMDocumentId }) =>
      databaseState$({ documentId, path }).pipe(
        map((state) => {
          if (state instanceof Error) {
            return state;
          }

          return state?.data;
        }),
        distinctUntilChanged(),
      ),
  );

  const databaseProperties$ = defineCacheObservable(
    ({ documentId, path }: { path: string; documentId: AMDocumentId }) =>
      databaseState$({ documentId, path }).pipe(
        map((state): DatabaseUnknownPropertiesMap | Error | undefined => {
          if (state instanceof Error) {
            return state;
          }

          return state?.properties;
        }),
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
      viewId?: DatabaseViewId | undefined;
      options: {
        itemQuery?: Query<DatabaseItem> | undefined;
        idQuery?: Query<DatabaseItemId> | undefined;
        slice?:
          | {
              first?: number | undefined;
              last?: number | undefined;
            }
          | undefined;
      };
    }) =>
      combineLatest([
        databaseData$({ documentId, path }),
        databaseProperties$({ documentId, path }),
        filter$({ documentId, path, viewId }),
        databaseSorting$({ documentId, path, viewId }),
      ]).pipe(
        map(([data, properties, filter, sorting]) => {
          if (data instanceof Error) {
            return data;
          }

          if (properties instanceof Error) {
            return properties;
          }

          if (filter instanceof Error) {
            return filter;
          }

          if (sorting instanceof Error) {
            return sorting;
          }

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
      itemId?: DatabaseItemId | undefined;
    }) =>
      databaseData$({ documentId, path }).pipe(
        map((data) => {
          if (data instanceof Error) {
            return data;
          }

          return itemId ? data?.[itemId] : undefined;
        }),
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
      itemId?: DatabaseItemId | undefined;
    }) =>
      combineLatest([
        databaseItem$({ documentId, itemId, path }),
        databaseProperties$({ documentId, path }),
      ]).pipe(
        map(([item, properties]) => {
          if (item instanceof Error) {
            return item;
          }

          if (properties instanceof Error) {
            return properties;
          }

          return getDatabaseEffectiveItem(item, properties);
        }),
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
        map((item) => {
          if (item instanceof Error) {
            return item;
          }

          return item?.[propertyId];
        }),
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
        map(([item, properties]) => {
          if (item instanceof Error) {
            return item;
          }

          if (properties instanceof Error) {
            return properties;
          }

          return getDatabaseEffectiveValue(item, propertyId, properties?.[propertyId]);
        }),
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
