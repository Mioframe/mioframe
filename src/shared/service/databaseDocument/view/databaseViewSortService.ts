import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabasePropertyId,
  DatabaseSortDescription,
  DatabaseSortMap,
  DatabaseView,
} from '@shared/lib/databaseDocument';
import {
  SORT_DIRECTION,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { DomainError } from '@shared/lib/error';
import type { EntryPath } from '@shared/lib/fileSystem';
import { moveArrayValue } from '@shared/lib/moveArrayValue';
import { strictRecordGet } from '@shared/lib/strictRecord';
import {
  strictRecordIterableEntries,
  strictRecordIterableKeys,
  strictRecordIterableValues,
  strictRecordRemove,
  strictRecordSize,
} from '@shared/lib/strictRecord/wrapStrictRecord';
import { defineSubscribeByQueryService } from '@shared/lib/subscriptions';
import type { PartialDeep } from 'type-fest';

export const useDatabaseViewSortService = (
  getView: (
    path: EntryPath,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
  ) => undefined | DatabaseView | DomainError,
  changeView: (
    path: EntryPath,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    cb: (view: DatabaseView) => unknown,
  ) => unknown,
) => {
  const getSortingEntries = (
    path: EntryPath,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
  ) =>
    Array.from(
      strictRecordIterableEntries(get(path, documentId, viewId))(),
    ).sort(([, { priority: a }], [, { priority: b }]) => a - b);

  const post = (
    path: EntryPath,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    propertyId: DatabasePropertyId,
    sortDescription: PartialDeep<DatabaseSortDescription> = {},
  ) => {
    patch(path, documentId, viewId, propertyId, sortDescription);
  };

  const remove = (
    path: EntryPath,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    propertyId: DatabasePropertyId,
  ) => {
    changeView(path, documentId, viewId, (view) => {
      if (view.sorting) {
        strictRecordRemove(view.sorting, propertyId);
      }
    });
  };

  const patch = (
    path: EntryPath,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    propertyId: DatabasePropertyId,
    sortDescription: PartialDeep<DatabaseSortDescription>,
  ) => {
    changeView(path, documentId, viewId, (view) => {
      const {
        direction = SORT_DIRECTION.ascending,
        priority = view.sorting ? strictRecordSize(view.sorting) : 0,
      } = sortDescription;

      if (!view.sorting) {
        view.sorting = {};
      }

      view.sorting[propertyId] = { direction, priority };
    });
  };

  function get(
    path: EntryPath,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
  ): DatabaseSortMap;
  function get(
    path: EntryPath,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    propertyId: DatabasePropertyId,
  ): DatabaseSortDescription;
  function get(
    path: EntryPath,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    propertyId?: DatabasePropertyId,
  ) {
    const view = getView(path, documentId, viewId);

    if (!view || view instanceof DomainError) {
      return view;
    }

    const sorting = view.sorting;

    if (propertyId && sorting) {
      return strictRecordGet(sorting, propertyId);
    }

    return sorting;
  }

  const getSortingPropertiesIdList = (
    path: EntryPath,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
  ) => {
    const sorting = get(path, documentId, viewId);

    return Array.from(strictRecordIterableKeys(sorting)());
  };

  const changePriority = (
    path: EntryPath,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    from: number,
    to: number,
  ) => {
    changeView(path, documentId, viewId, (view) => {
      const sorting = view.sorting;

      const tempArray = Array.from(strictRecordIterableValues(sorting)());

      tempArray.sort(
        (
          { priority: a = tempArray.length },
          { priority: b = tempArray.length },
        ) => a - b,
      );

      moveArrayValue(tempArray, from, to);

      tempArray.forEach((view, index) => {
        view.priority = index;
      });
    });
  };

  return {
    getSortingEntries,
    subscribeSortingEntries: defineSubscribeByQueryService(getSortingEntries),
    subscribeSortingPropertiesIdList: defineSubscribeByQueryService(
      getSortingPropertiesIdList,
    ),
    get,
    post,
    patch,
    remove,
    changePriority,
  };
};
