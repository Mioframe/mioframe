import type { AMDocumentId } from '@shared/lib/automerge';
import {
  generateItemId,
  type DatabaseData,
  type DatabaseItem,
  type DatabaseItemId,
  type DatabasePropertyId,
  type DatabaseState,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { strictRecordRemove, strictRecordSet } from '@shared/lib/strictRecord';
import { queryIdList } from './data/queryData';
import type { Query } from 'sift';
import { setupDatabaseViewsService } from './view/databaseViewsService';
import { deepPutJsonObject } from '@shared/lib/changeObject';

import {
  combineLatest,
  distinctUntilChanged,
  map,
  type Observable,
} from 'rxjs';
import { defineQuery } from '@shared/lib/observableQuery';

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
    change(path, documentId, (data) => {
      if (!data[itemId]) {
        data[itemId] = {};
      }
      const item = data[itemId];

      strictRecordSet(item, propertyId, value);
    });

  const removeItem = (
    path: string,
    documentId: AMDocumentId,
    itemId: DatabaseItemId,
  ) =>
    change(path, documentId, (data) => {
      strictRecordRemove(data, itemId);
    });

  const databaseData$ = ({
    documentId,
    path,
  }: {
    path: string;
    documentId: AMDocumentId;
  }) =>
    databaseState$({ documentId, path }).pipe(
      map((state) => state?.data),
      distinctUntilChanged(),
    );

  const {
    filter: { filter$ },
    sorting: { databaseSorting$ },
  } = setupDatabaseViewsService(databaseState$, changeDatabaseState);

  const filteredIdList$Cache = new Map<
    string,
    Observable<undefined | DatabaseItemId[]>
  >();

  const filteredIdList$ = (q: {
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
  }) => {
    const cacheKey = JSON.stringify(q);

    let $ = filteredIdList$Cache.get(cacheKey);

    if (!$) {
      const {
        documentId,
        options: { idQuery, itemQuery, slice },
        path,
        viewId,
      } = q;

      $ = combineLatest([
        databaseData$({ documentId, path }),
        filter$({ documentId, path, viewId }),
        databaseSorting$({ documentId, path, viewId }),
      ]).pipe(
        map(([data, filter, sorting]) => {
          if (data) {
            const idList = queryIdList(data, {
              filter,
              sorting,
              itemQuery,
              idQuery,
              slice,
            });

            return idList;
          }

          return undefined;
        }),
        distinctUntilChanged(),
      );

      filteredIdList$Cache.set(cacheKey, $);
    }

    return $;
  };

  const databaseItem$ = ({
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
      distinctUntilChanged(),
    );

  const databaseValue$ = ({
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
    );

  const postItem = async (
    path: string,
    documentId: AMDocumentId,
    item: DatabaseItem,
    itemId: DatabaseItemId = generateItemId(),
  ) => {
    await change(path, documentId, (data) => {
      if (!data[itemId]) {
        data[itemId] = {};
      }
      const oldItem = data[itemId];
      deepPutJsonObject(oldItem, item, { trimString: true });
    });

    return itemId;
  };

  return {
    filteredIdList: defineQuery(filteredIdList$),

    databaseItem: defineQuery(databaseItem$),

    databaseValue: defineQuery(databaseValue$),

    postValue,
    change,
    removeItem,
    postItem,
  };
};
