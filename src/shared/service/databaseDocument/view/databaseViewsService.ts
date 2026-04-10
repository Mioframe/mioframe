import type { AMDocumentId } from '@shared/lib/automerge';
import {
  strictRecordGet,
  strictRecordIterableEntries,
  strictRecordRemove,
} from '@shared/lib/strictRecord';
import type { DatabaseState } from '@shared/lib/databaseDocument';
import {
  DB_VIEW_LAYOUT,
  generateViewId,
  type DatabaseView,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { strictRecordSet } from '@shared/lib/strictRecord/wrapStrictRecord';
import type { PatchSource } from '@shared/lib/changeObject';
import { deepPatchJsonObject } from '@shared/lib/changeObject';
import { useDatabaseViewSortService } from './databaseViewSortService';
import { setupDatabaseViewFilterService } from './databaseViewFilterService';
import { distinctUntilChanged, map, type Observable } from 'rxjs';
import { defineObservableQuery } from '@shared/lib/useObservableQuery';
import { defineCacheObservable } from '@shared/lib/defineCacheObservable';
import { isEqual } from 'es-toolkit';

export const setupDatabaseViewsService = (
  databaseState$: (q: {
    documentId: AMDocumentId;
    path: string;
  }) => Observable<DatabaseState | undefined>,
  changeDatabase: (
    path: string,
    documentId: AMDocumentId,
    callback: (state: DatabaseState) => unknown,
  ) => Promise<unknown>,
) => {
  const databaseViews$ = defineCacheObservable(
    ({ documentId, path }: { documentId: AMDocumentId; path: string }) =>
      databaseState$({ documentId, path }).pipe(
        map((state) => state?.views),
        distinctUntilChanged(),
      ),
  );

  const viewList$ = defineCacheObservable(
    ({ documentId, path }: { documentId: AMDocumentId; path: string }) =>
      databaseViews$({ documentId, path }).pipe(
        map((viewsRecord) =>
          Array.from(strictRecordIterableEntries(viewsRecord)()).sort(
            ([, { order: a = 0 }], [, { order: b = 0 }]) => a - b,
          ),
        ),
      ),
  );

  const viewList = defineObservableQuery(viewList$);

  const databaseView$ = defineCacheObservable(
    ({
      documentId,
      path,
      viewId,
    }: {
      documentId: AMDocumentId;
      path: string;
      viewId?: DatabaseViewId | undefined;
    }) =>
      databaseViews$({ documentId, path }).pipe(
        map((views) => (viewId ? views?.[viewId] : undefined)),
        distinctUntilChanged((a, b) => isEqual(a, b)),
      ),
  );

  const remove = (path: string, documentId: AMDocumentId, viewId: DatabaseViewId) =>
    changeDatabase(path, documentId, (state) => {
      strictRecordRemove(state['views'], viewId);
    });

  const reorder = (path: string, documentId: AMDocumentId, orderedIds: DatabaseViewId[]) =>
    changeDatabase(path, documentId, (state) => {
      const views = state.views;
      const knownIds = Array.from(strictRecordIterableEntries(views)())
        .sort(
          (
            [, { order: a = Number.MAX_SAFE_INTEGER }],
            [, { order: b = Number.MAX_SAFE_INTEGER }],
          ) => a - b,
        )
        .map(([viewId]) => viewId);

      const seenIds = new Set(orderedIds);
      const nextOrderedIds = [
        ...orderedIds.filter((viewId) => Boolean(views[viewId])),
        ...knownIds.filter((viewId) => !seenIds.has(viewId)),
      ];

      nextOrderedIds.forEach((viewId, index) => {
        const view = views[viewId];

        if (view) {
          view.order = index;
        }
      });
    });

  const create = async (path: string, documentId: AMDocumentId, view: DatabaseView) => {
    const viewId = generateViewId();
    await changeDatabase(path, documentId, (state) => {
      strictRecordSet(state.views, viewId, view);
    });
    return viewId;
  };

  const change = (
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    cb: (view: DatabaseView) => unknown,
  ) =>
    changeDatabase(path, documentId, (state) => {
      if (!state.views[viewId]) {
        state.views[viewId] = {
          layout: DB_VIEW_LAYOUT.TABLE,
          name: 'unname view',
        };
      }

      cb(state.views[viewId]);
    });

  const patch = (
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    view: PatchSource<DatabaseView>,
  ) =>
    changeDatabase(path, documentId, (state) => {
      const viewState = strictRecordGet(state.views, viewId);

      if (viewState) {
        deepPatchJsonObject(viewState, view);
      }
    });

  return {
    viewList,

    databaseView$,
    databaseView: defineObservableQuery(databaseView$),

    remove,
    reorder,
    create,
    patch,

    sorting: useDatabaseViewSortService(databaseView$, change),
    filter: setupDatabaseViewFilterService(databaseView$, change),
  };
};
