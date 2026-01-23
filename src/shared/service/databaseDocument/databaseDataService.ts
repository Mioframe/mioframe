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
import {
  strictRecordGet,
  strictRecordRemove,
  strictRecordSet,
} from '@shared/lib/strictRecord';
import { queryIdList } from './data/queryData';
import { DomainError } from '@shared/lib/error';
import type { Query } from 'sift';
import { setupDatabaseViewsService } from './view/databaseViewsService';
import { deepPutJsonObject } from '@shared/lib/changeObject';

export const setupDatabaseDataService = (
  getDatabaseBody: (
    path: string,
    documentId: AMDocumentId,
  ) => Promise<DatabaseState | undefined>,
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

  const getData = async (
    path: string,
    documentId: AMDocumentId,
  ): Promise<undefined | DatabaseData> => {
    const body = await getDatabaseBody(path, documentId);

    return body?.data;
  };

  const { getView } = setupDatabaseViewsService(
    getDatabaseBody,
    changeDatabaseState,
  );

  const getItemIdList = async (
    path: string,
    documentId: AMDocumentId,
    viewId?: DatabaseViewId,
    options: {
      itemQuery?: Query<DatabaseItem>;
      idQuery?: Query<DatabaseItemId>;
      slice?: {
        first?: number;
        last?: number;
      };
    } = {},
  ): Promise<undefined | DatabaseItemId[]> => {
    const data = await getData(path, documentId);

    if (data) {
      const view = viewId ? await getView(path, documentId, viewId) : undefined;

      const { idQuery, itemQuery, slice } = options;

      return queryIdList(data, {
        filter: view?.filter,
        sorting: view?.sorting,
        itemQuery,
        idQuery,
        slice,
      });
    }

    return undefined;
  };

  const getItem = async (
    path: string,
    documentId: AMDocumentId,
    itemId: DatabaseItemId,
  ): Promise<undefined | DatabaseItem> => {
    const data = await getData(path, documentId);

    if (data) {
      return strictRecordGet(data, itemId);
    }

    return undefined;
  };

  const getValue = async (
    path: string,
    documentId: AMDocumentId,
    itemId: DatabaseItemId,
    propertyId: DatabasePropertyId,
  ): Promise<unknown> => {
    const item = await getItem(path, documentId, itemId);

    if (item instanceof DomainError) {
      return item;
    }

    if (item) {
      return strictRecordGet(item, propertyId);
    }

    return undefined;
  };

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
    getItemIdList,
    getItem,
    getValue,

    postValue,
    change,
    removeItem,
    postItem,
  };
};
