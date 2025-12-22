import type { AMDocumentId } from '@shared/lib/automerge';
import { deepPatchJsonObject } from '@shared/lib/changeObject';
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
import { moveArrayValue } from '@shared/lib/moveArrayValue';
import { strictRecordGet } from '@shared/lib/strictRecord';
import {
  strictRecordIterableEntries,
  strictRecordIterableKeys,
  strictRecordIterableValues,
  strictRecordRemove,
  strictRecordSize,
} from '@shared/lib/strictRecord/wrapStrictRecord';
import type { PartialDeep } from 'type-fest';

export const useDatabaseViewSortService = (
  getView: (
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
  ) => Promise<undefined | DatabaseView>,
  changeView: (
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    cb: (view: DatabaseView) => unknown,
  ) => Promise<unknown>,
) => {
  const getSortingEntries = async (
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
  ) =>
    Array.from(
      strictRecordIterableEntries(await get(path, documentId, viewId))(),
    ).sort(([, { priority: a }], [, { priority: b }]) => a - b);

  const post = (
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    propertyId: DatabasePropertyId,
    sortDescription: PartialDeep<DatabaseSortDescription> = {},
  ) => patch(path, documentId, viewId, propertyId, sortDescription);

  const remove = (
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    propertyId: DatabasePropertyId,
  ) =>
    changeView(path, documentId, viewId, (view) => {
      if (view.sorting) {
        strictRecordRemove(view.sorting, propertyId);
      }
    });

  const patch = (
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    propertyId: DatabasePropertyId,
    sortDescription: PartialDeep<DatabaseSortDescription>,
  ) =>
    changeView(path, documentId, viewId, (view) => {
      const {
        direction = SORT_DIRECTION.ascending,
        priority = view.sorting ? strictRecordSize(view.sorting) : 0,
      } = sortDescription;

      if (!view.sorting) {
        view.sorting = {};
      }

      deepPatchJsonObject(view.sorting, {
        [propertyId]: { direction, priority },
      });
    });

  async function get(
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
  ): Promise<DatabaseSortMap | undefined>;
  async function get(
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    propertyId: DatabasePropertyId,
  ): Promise<DatabaseSortDescription | undefined>;
  async function get(
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    propertyId?: DatabasePropertyId,
  ) {
    const view = await getView(path, documentId, viewId);

    const sorting = view?.sorting;

    if (propertyId && sorting) {
      return strictRecordGet(sorting, propertyId);
    }

    return sorting;
  }

  const getSortingPropertiesIdList = async (
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
  ) => {
    const sorting = await get(path, documentId, viewId);
    if (sorting) {
      return Array.from(strictRecordIterableKeys(sorting)());
    }
    return undefined;
  };

  const changePriority = (
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    from: number,
    to: number,
  ) =>
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

  const toggleDirection = async (
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    propertyId: DatabasePropertyId,
  ) => {
    const oldDirection = (await get(path, documentId, viewId, propertyId))
      ?.direction;

    await patch(path, documentId, viewId, propertyId, {
      direction:
        oldDirection === SORT_DIRECTION.ascending
          ? SORT_DIRECTION.descending
          : SORT_DIRECTION.ascending,
    });
  };

  return {
    getSortingEntries,
    getSortingPropertiesIdList,
    get,
    post,
    patch,
    remove,
    changePriority,
    toggleDirection,
  };
};
