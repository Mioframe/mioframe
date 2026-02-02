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
import {
  strictRecordIterableValues,
  strictRecordSet,
} from '@shared/lib/strictRecord/wrapStrictRecord';
import { moveArrayValue } from '@shared/lib/moveArrayValue';
import type { PatchSource } from '@shared/lib/changeObject';
import { deepPatchJsonObject } from '@shared/lib/changeObject';
import { useDatabaseViewSortService } from './databaseViewSortService';
import { setupDatabaseViewFilterService } from './databaseViewFilterService';
import { distinctUntilChanged, map, type Observable } from 'rxjs';
import { defineQuery } from '@shared/lib/observableQuery';

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
  const databaseViews$ = ({
    documentId,
    path,
  }: {
    documentId: AMDocumentId;
    path: string;
  }) =>
    databaseState$({ documentId, path }).pipe(
      map((state) => state?.views),
      distinctUntilChanged(),
    );

  const viewList$ = ({
    documentId,
    path,
  }: {
    documentId: AMDocumentId;
    path: string;
  }) =>
    databaseViews$({ documentId, path }).pipe(
      map((viewsRecord) =>
        Array.from(strictRecordIterableEntries(viewsRecord)()).sort(
          ([, { order: a = 0 }], [, { order: b = 0 }]) => a - b,
        ),
      ),
    );

  const viewList = defineQuery(viewList$);

  const view$Cache = new Map<string, Observable<undefined | DatabaseView>>();

  const databaseView$ = ({
    documentId,
    path,
    viewId,
  }: {
    documentId: AMDocumentId;
    path: string;
    viewId?: DatabaseViewId;
  }) => {
    const cacheKey = [documentId, path, viewId].join(':');

    let $ = view$Cache.get(cacheKey);

    if (!$) {
      $ = databaseViews$({ documentId, path }).pipe(
        map((views) => (viewId ? views?.[viewId] : undefined)),
        distinctUntilChanged(),
      );

      view$Cache.set(cacheKey, $);
    }

    return $;
  };

  const remove = (
    path: string,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
  ) =>
    changeDatabase(path, documentId, (state) => {
      strictRecordRemove(state['views'], viewId);
    });

  const changeOrder = (
    path: string,
    documentId: AMDocumentId,
    from: number,
    to: number,
  ) =>
    changeDatabase(path, documentId, (state) => {
      const views = state.views;

      const tempArray = Array.from(strictRecordIterableValues(views)());

      tempArray.sort(
        ({ order: a = tempArray.length }, { order: b = tempArray.length }) =>
          a - b,
      );

      moveArrayValue(tempArray, from, to);

      tempArray.forEach((view, index) => {
        view.order = index;
      });
    });

  const create = async (
    path: string,
    documentId: AMDocumentId,
    view: DatabaseView,
  ) => {
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
    databaseView: defineQuery(databaseView$),

    remove,
    changeOrder,
    create,
    patch,

    sorting: useDatabaseViewSortService(databaseView$, change),
    filter: setupDatabaseViewFilterService(databaseView$, change),
  };
};
