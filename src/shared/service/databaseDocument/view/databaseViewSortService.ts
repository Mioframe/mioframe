import type { AMDocumentId } from '@shared/lib/automerge';
import { deepPatchJsonObject } from '@shared/lib/changeObject';
import type {
  DatabasePropertyId,
  DatabaseSortDescription,
  DatabaseView,
} from '@shared/lib/databaseDocument';
import {
  SORT_DIRECTION,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { moveArrayValue } from '@shared/lib/moveArrayValue';
import {
  strictRecordIterableEntries,
  strictRecordIterableKeys,
  strictRecordIterableValues,
  strictRecordRemove,
  strictRecordSize,
} from '@shared/lib/strictRecord/wrapStrictRecord';
import type { PartialDeep } from 'type-fest';
import { distinctUntilChanged, map, type Observable } from 'rxjs';
import { isEqual } from 'es-toolkit';
import { defineObservableQuery } from '@shared/lib/useObservableQuery';
import { defineCacheObservable } from '@shared/lib/defineCacheObservable';

export const useDatabaseViewSortService = (
  databaseView$: (q: {
    documentId: AMDocumentId;
    path: string;
    viewId?: DatabaseViewId;
  }) => Observable<DatabaseView | undefined>,
  changeView: (
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    cb: (view: DatabaseView) => unknown,
  ) => Promise<unknown>,
) => {
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

  const databaseSorting$ = defineCacheObservable(
    ({
      documentId,
      path,
      viewId,
    }: {
      documentId: AMDocumentId;
      path: string;
      viewId?: DatabaseViewId;
    }) =>
      databaseView$({ documentId, path, viewId }).pipe(
        map((view) => view?.sorting),
        distinctUntilChanged(),
      ),
  );

  const sortingList$ = defineCacheObservable(
    ({
      documentId,
      path,
      viewId,
    }: {
      path: string;
      documentId: AMDocumentId;
      viewId: DatabaseViewId;
    }) =>
      databaseSorting$({ documentId, path, viewId }).pipe(
        map((sorting) => {
          if (sorting) {
            return Array.from(strictRecordIterableEntries(sorting)()).sort(
              ([, { priority: a }], [, { priority: b }]) => a - b,
            );
          }

          return undefined;
        }),
      ),
  );

  const databaseSort$ = defineCacheObservable(
    ({
      documentId,
      path,
      viewId,
      propertyId,
    }: {
      documentId: AMDocumentId;
      path: string;
      viewId: DatabaseViewId;
      propertyId: DatabasePropertyId;
    }) =>
      databaseSorting$({ documentId, path, viewId }).pipe(
        map((sorting) => sorting?.[propertyId]),
        distinctUntilChanged((a, b) => isEqual(a, b)),
      ),
  );

  const databaseSort = defineObservableQuery(databaseSort$);

  const sortingPropertiesIdList$ = defineCacheObservable(
    ({
      documentId,
      path,
      viewId,
    }: {
      path: string;
      documentId: AMDocumentId;
      viewId: DatabaseViewId;
    }) =>
      databaseSorting$({ documentId, path, viewId }).pipe(
        map((sorting) => {
          if (sorting) {
            return Array.from(strictRecordIterableKeys(sorting)());
          }
          return undefined;
        }),
        distinctUntilChanged((a, b) => isEqual(a, b)),
      ),
  );

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

      tempArray.sort(({ priority: a }, { priority: b }) => a - b);

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
    const oldDirection = (
      await databaseSort.fetch({ documentId, path, propertyId, viewId })
    )?.direction;

    await patch(path, documentId, viewId, propertyId, {
      direction:
        oldDirection === SORT_DIRECTION.ascending
          ? SORT_DIRECTION.descending
          : SORT_DIRECTION.ascending,
    });
  };

  return {
    databaseSorting$,
    sortingList$,
    sortingList: defineObservableQuery(sortingList$),
    sortingPropertiesIdList$,
    sortingPropertiesIdList: defineObservableQuery(sortingPropertiesIdList$),
    databaseSort$,
    databaseSort,
    post,
    patch,
    remove,
    changePriority,
    toggleDirection,
  };
};
