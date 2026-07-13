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
import { getNextViewOrder } from '@shared/lib/databaseDocument/getNextViewOrder';
import { distinctUntilChanged, map, type Observable } from 'rxjs';
import { defineObservableQuery } from '@shared/lib/useObservableQuery';
import { defineCacheObservable } from '@shared/lib/defineCacheObservable';
import { isEqual } from 'es-toolkit';
import type { DatabaseStateQueryResult } from '../databaseService';

/** Query key for document-scoped database-view collections. */
export interface DatabaseViewsQuery {
  /** The document id. */
  documentId: AMDocumentId;
  /** The repository path containing the document. */
  path: string;
}

/** Query key for one document-scoped database view. */
export interface DatabaseViewQuery extends DatabaseViewsQuery {
  /** The optional view id to fetch. */
  viewId?: DatabaseViewId | undefined;
}

/**
 * Builds database-view queries and mutations for one document path/document-id pair, including
 * FIFO reorder persistence per document.
 * @param databaseState$ - Emits the canonical database state for a document.
 * @param changeDatabase - Applies one persisted document mutation.
 * @returns The view query/mutation service surface.
 */
export const setupDatabaseViewsService = (
  databaseState$: (q: DatabaseViewsQuery) => Observable<DatabaseStateQueryResult>,
  changeDatabase: (
    path: string,
    documentId: AMDocumentId,
    callback: (state: DatabaseState) => unknown,
  ) => Promise<unknown>,
) => {
  const reorderTails = new Map<string, Promise<unknown>>();

  /**
   * Keys the per-document reorder FIFO without introducing a wider queue abstraction.
   * @param path - The document path.
   * @param documentId - The document id.
   * @returns The stable per-document FIFO key.
   */
  const getReorderQueueKey = (path: string, documentId: AMDocumentId): string =>
    JSON.stringify([path, documentId]);

  const databaseViews$ = defineCacheObservable(({ documentId, path }: DatabaseViewsQuery) =>
    databaseState$({ documentId, path }).pipe(
      map((state) => {
        if (state instanceof Error) {
          return state;
        }

        return state?.views;
      }),
      distinctUntilChanged(),
    ),
  );

  const viewList$ = defineCacheObservable(({ documentId, path }: DatabaseViewsQuery) =>
    databaseViews$({ documentId, path }).pipe(
      map((viewsRecord) => {
        if (viewsRecord instanceof Error) {
          return viewsRecord;
        }

        return Array.from(strictRecordIterableEntries(viewsRecord)()).sort(
          ([, { order: a = 0 }], [, { order: b = 0 }]) => a - b,
        );
      }),
    ),
  );

  const viewList = defineObservableQuery(viewList$);

  const databaseView$ = defineCacheObservable(({ documentId, path, viewId }: DatabaseViewQuery) =>
    databaseViews$({ documentId, path }).pipe(
      map((views) => {
        if (views instanceof Error) {
          return views;
        }

        return viewId ? views?.[viewId] : undefined;
      }),
      distinctUntilChanged((a, b) => isEqual(a, b)),
    ),
  );

  const remove = (path: string, documentId: AMDocumentId, viewId: DatabaseViewId) =>
    changeDatabase(path, documentId, (state) => {
      strictRecordRemove(state['views'], viewId);
    });

  /**
   * Applies one reorder mutation while preserving existing membership normalization semantics.
   * @param path - The document path.
   * @param documentId - The document id.
   * @param orderedIds - The requested ordered view ids snapshot for this mutation.
   * @returns The concrete persisted mutation promise.
   */
  const applyReorder = (
    path: string,
    documentId: AMDocumentId,
    orderedIds: readonly DatabaseViewId[],
  ) =>
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

  const reorder = (path: string, documentId: AMDocumentId, orderedIds: DatabaseViewId[]) => {
    const queueKey = getReorderQueueKey(path, documentId);
    const requestedIds = [...orderedIds];
    const previous = reorderTails.get(queueKey) ?? Promise.resolve();

    const runMutation = () => applyReorder(path, documentId, requestedIds);
    const current = previous.then(runMutation, runMutation);

    reorderTails.set(queueKey, current);

    void current.then(
      () => {
        if (reorderTails.get(queueKey) === current) {
          reorderTails.delete(queueKey);
        }
      },
      () => {
        if (reorderTails.get(queueKey) === current) {
          reorderTails.delete(queueKey);
        }
      },
    );

    return current;
  };

  const create = async (path: string, documentId: AMDocumentId, view: DatabaseView) => {
    const viewId = generateViewId();
    await changeDatabase(path, documentId, (state) => {
      strictRecordSet(state.views, viewId, {
        ...view,
        order: getNextViewOrder(state.views),
      });
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
