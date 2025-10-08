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
import type { EntryPath } from '@shared/lib/fileSystem';
import {
  strictRecordGet,
  strictRecordRemove,
  strictRecordSet,
} from '@shared/lib/strictRecord';
import { queryIdList } from './data/queryData';
import { DomainError } from '@shared/lib/error';
import type { Query } from 'sift';
import { defineSubscribeByQueryService } from '@shared/lib/subscriptions';
import { useDatabaseViewsService } from './view/databaseViewsService';
import { deepPutJsonObject } from '@shared/lib/changeObject';

export const useDatabaseDataService = (
  getDatabaseBody: (
    path: EntryPath,
    documentId: AMDocumentId,
  ) => DatabaseState | DomainError | undefined,
  changeDatabaseState: (
    path: EntryPath,
    documentId: AMDocumentId,
    callback: (state: DatabaseState) => unknown,
  ) => Promise<void> | DomainError,
) => {
  const change = (
    path: EntryPath,
    documentId: AMDocumentId,
    callback: (state: DatabaseData) => unknown,
  ) =>
    changeDatabaseState(path, documentId, (state) => {
      callback(state.data);
    });

  const postValue = (
    path: EntryPath,
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
    path: EntryPath,
    documentId: AMDocumentId,
    itemId: DatabaseItemId,
  ) =>
    change(path, documentId, (data) => {
      strictRecordRemove(data, itemId);
    });

  const getData = (
    path: EntryPath,
    documentId: AMDocumentId,
  ): undefined | DomainError | DatabaseData => {
    const body = getDatabaseBody(path, documentId);
    if (body instanceof DomainError) {
      return body;
    }

    return body?.data;
  };

  const { getView } = useDatabaseViewsService(
    getDatabaseBody,
    changeDatabaseState,
  );

  const getItemIdList = (
    path: EntryPath,
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
  ): undefined | DomainError | DatabaseItemId[] => {
    const data = getData(path, documentId);

    if (data instanceof DomainError) {
      return data;
    }

    if (data) {
      const view = viewId ? getView(path, documentId, viewId) : undefined;

      if (view instanceof DomainError) {
        return view;
      }

      const { idQuery, itemQuery, slice } = options;

      return queryIdList(data, {
        filter: view?.filter,
        sorting: view?.sorting,
        itemQuery,
        idQuery,
        slice,
      });
    }
  };

  const getItem = (
    path: EntryPath,
    documentId: AMDocumentId,
    itemId: DatabaseItemId,
  ): undefined | DomainError | DatabaseItem => {
    const data = getData(path, documentId);
    if (data instanceof DomainError) {
      return data;
    }

    if (data) {
      return strictRecordGet(data, itemId);
    }
  };

  const getValue = (
    path: EntryPath,
    documentId: AMDocumentId,
    itemId: DatabaseItemId,
    propertyId: DatabasePropertyId,
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  ): undefined | DomainError | unknown => {
    const item = getItem(path, documentId, itemId);

    if (item instanceof DomainError) {
      return item;
    }

    if (item) {
      return strictRecordGet(item, propertyId);
    }

    return undefined;
  };

  const postItem = async (
    path: EntryPath,
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
    postValue,
    change,
    removeItem,
    postItem,
    subscribeItemIdList: defineSubscribeByQueryService(getItemIdList),
    subscribeItem: defineSubscribeByQueryService(getItem),
    subscribeValue: defineSubscribeByQueryService(getValue),
  };
};
