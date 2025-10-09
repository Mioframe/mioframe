import type { EntryPath } from '@shared/lib/fileSystem';
import type { AMDocumentId } from '@shared/lib/automerge';
import { defineSubscribeByQueryService } from '@shared/lib/subscriptions';
import {
  strictRecordGet,
  strictRecordIterableEntries,
  strictRecordRemove,
} from '@shared/lib/strictRecord';
import { DomainError } from '@shared/lib/error';
import type {
  DatabaseState,
  DatabaseViewsMap,
} from '@shared/lib/databaseDocument';
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
import { useDatabaseViewFilterService } from './databaseViewFilterService';

export const useDatabaseViewsService = (
  getDatabaseBody: (
    path: EntryPath,
    documentId: AMDocumentId,
  ) => DatabaseState | DomainError | undefined,
  changeDatabase: (
    path: EntryPath,
    documentId: AMDocumentId,
    callback: (state: DatabaseState) => unknown,
  ) => unknown,
) => {
  const getDatabaseViews = (
    path: EntryPath,
    documentId: AMDocumentId,
  ): undefined | DomainError | DatabaseViewsMap => {
    const body = getDatabaseBody(path, documentId);

    if (body instanceof DomainError) {
      return body;
    }

    return body?.views;
  };

  const getDatabaseViewList = (
    path: EntryPath,
    documentId: AMDocumentId,
  ): undefined | DomainError | [DatabaseViewId, DatabaseView][] => {
    const viewsRecord = getDatabaseViews(path, documentId);

    if (viewsRecord instanceof DomainError) {
      return viewsRecord;
    }

    return Array.from(strictRecordIterableEntries(viewsRecord)()).sort(
      ([, { order: a = 0 }], [, { order: b = 0 }]) => a - b,
    );
  };

  const getView = (
    path: EntryPath,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
  ): undefined | DomainError | DatabaseView => {
    const views = getDatabaseViews(path, documentId);
    if (views) {
      if (views instanceof DomainError) {
        return views;
      }

      return strictRecordGet(views, viewId);
    }
  };

  const getFirstView = (
    path: EntryPath,
    documentId: AMDocumentId,
  ): undefined | DomainError | DatabaseView => {
    const list = getDatabaseViewList(path, documentId);

    if (list instanceof DomainError) {
      return list;
    }

    return list?.at(0)?.[1];
  };

  const remove = (
    path: EntryPath,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
  ) => {
    changeDatabase(path, documentId, (state) => {
      strictRecordRemove(state['views'], viewId);
    });
  };

  const changeOrder = (
    path: EntryPath,
    documentId: AMDocumentId,
    from: number,
    to: number,
  ) => {
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
  };

  const create = (
    path: EntryPath,
    documentId: AMDocumentId,
    view: DatabaseView,
  ) => {
    const viewId = generateViewId();
    changeDatabase(path, documentId, (state) => {
      strictRecordSet(state.views, viewId, view);
    });
    return viewId;
  };

  const change = (
    path: EntryPath,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    cb: (view: DatabaseView) => unknown,
  ) => {
    changeDatabase(path, documentId, (state) => {
      if (!state.views[viewId]) {
        state.views[viewId] = {
          layout: DB_VIEW_LAYOUT.TABLE,
          name: 'unname view',
        };
      }

      cb(state.views[viewId]);
    });
  };

  const patch = (
    path: EntryPath,
    documentId: AMDocumentId,
    viewId: DatabaseViewId,
    view: PatchSource<DatabaseView>,
  ) => {
    changeDatabase(path, documentId, (state) => {
      const viewState = strictRecordGet(state.views, viewId);

      if (viewState) {
        deepPatchJsonObject(viewState, view);
      }
    });
  };

  return {
    subscribeDatabaseViews: defineSubscribeByQueryService(getDatabaseViews),

    subscribeDatabaseViewList:
      defineSubscribeByQueryService(getDatabaseViewList),

    getView,
    subscribeDatabaseView: defineSubscribeByQueryService(getView),

    subscribeDatabaseFirstView: defineSubscribeByQueryService(getFirstView),

    remove,
    changeOrder,
    create,
    patch,

    sorting: useDatabaseViewSortService(getView, change),
    filter: useDatabaseViewFilterService(getView, change),
  };
};
