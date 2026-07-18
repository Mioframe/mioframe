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
import type { ReorderCommitRequest, ReorderCommitResult } from '@shared/lib/reorder';
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

/**
 * The single canonical ordering rule for stored views: legacy views without an explicit `order`
 * sort as if their order were `0`, the same value newly created views start counting up from (see
 * `getNextViewOrder`). Used by both `viewList$` and `getCanonicalOrderedIds` so the displayed
 * order and the guarded reorder comparison can never disagree for missing or duplicate `order`
 * values; ties keep the record's own iteration order via `Array.prototype.sort`'s stability.
 * @param entryA - A `[viewId, view]` entry being compared.
 * @param entryB - The other `[viewId, view]` entry being compared.
 * @returns A negative, zero, or positive number per the standard comparator contract.
 */
const compareViewOrder = (
  [, { order: orderA = 0 }]: readonly [DatabaseViewId, DatabaseView],
  [, { order: orderB = 0 }]: readonly [DatabaseViewId, DatabaseView],
): number => orderA - orderB;

/**
 * Wires the database view read model and mutations on top of the shared database state query
 * and change helpers.
 * @param databaseState$ - Cached observable query for one document's raw database state.
 * @param changeDatabase - Applies a change callback atomically to one document's database state.
 * @returns The view read model and view-level mutations.
 */
export const setupDatabaseViewsService = (
  databaseState$: (q: {
    /** The database document id. */
    documentId: AMDocumentId;
    /** Directory path containing the document. */
    path: string;
  }) => Observable<DatabaseStateQueryResult>,
  changeDatabase: (
    path: string,
    documentId: AMDocumentId,
    callback: (state: DatabaseState) => unknown,
  ) => Promise<unknown>,
) => {
  const databaseViews$ = defineCacheObservable(
    ({
      documentId,
      path,
    }: {
      /** The database document id. */
      documentId: AMDocumentId;
      /** Directory path containing the document. */
      path: string;
    }) =>
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

  const viewList$ = defineCacheObservable(
    ({
      documentId,
      path,
    }: {
      /** The database document id. */
      documentId: AMDocumentId;
      /** Directory path containing the document. */
      path: string;
    }) =>
      databaseViews$({ documentId, path }).pipe(
        map((viewsRecord) => {
          if (viewsRecord instanceof Error) {
            return viewsRecord;
          }

          return Array.from(strictRecordIterableEntries(viewsRecord)()).sort(compareViewOrder);
        }),
      ),
  );

  const viewList = defineObservableQuery(viewList$);

  const databaseView$ = defineCacheObservable(
    ({
      documentId,
      path,
      viewId,
    }: {
      /** The database document id. */
      documentId: AMDocumentId;
      /** Directory path containing the document. */
      path: string;
      /** The specific view id to read, or `undefined` when no view is selected. */
      viewId?: DatabaseViewId | undefined;
    }) =>
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
   * Derives the canonical view order currently stored in the document. Uses the same
   * {@link compareViewOrder} comparator as `viewList$` so the displayed order and the guarded
   * reorder comparison can never disagree for legacy views missing an explicit `order`.
   * @param views - The document's raw views record.
   * @returns The view ids ordered by their stored `order`.
   */
  const getCanonicalOrderedIds = (views: DatabaseState['views']): DatabaseViewId[] =>
    Array.from(strictRecordIterableEntries(views)())
      .sort(compareViewOrder)
      .map(([viewId]) => viewId);

  const isSameOrderedIds = (a: readonly DatabaseViewId[], b: readonly DatabaseViewId[]) =>
    a.length === b.length && a.every((id, index) => id === b[index]);

  const isPermutation = (
    candidate: readonly DatabaseViewId[],
    reference: readonly DatabaseViewId[],
  ): boolean => {
    if (candidate.length !== reference.length) {
      return false;
    }

    const candidateIds = new Set(candidate);
    if (candidateIds.size !== candidate.length) {
      return false;
    }

    const referenceIds = new Set(reference);
    return candidate.every((id) => referenceIds.has(id));
  };

  /**
   * Reorders views by explicit identifier order, guarded by the canonical order the caller
   * last observed. Applies and returns `'applied'` only when `expectedOrderedIds` still matches
   * the document's current order; otherwise leaves the document untouched and returns `'stale'`.
   * @param path - Directory path containing the document.
   * @param documentId - The database document id.
   * @param request - The guarded reorder request.
   * @returns `'applied'` when persisted, `'stale'` when the expected order no longer matched.
   */
  const reorder = (
    path: string,
    documentId: AMDocumentId,
    request: ReorderCommitRequest<DatabaseViewId>,
  ): Promise<ReorderCommitResult> => {
    let result: ReorderCommitResult = 'stale';

    return changeDatabase(path, documentId, (state) => {
      const views = state.views;
      const currentOrderedIds = getCanonicalOrderedIds(views);

      if (!isSameOrderedIds(currentOrderedIds, request.expectedOrderedIds)) {
        return;
      }

      if (!isPermutation(request.orderedIds, currentOrderedIds)) {
        throw new Error('reorder request orderedIds must be a permutation of expectedOrderedIds');
      }

      request.orderedIds.forEach((viewId, index) => {
        const view = views[viewId];

        if (view) {
          view.order = index;
        }
      });

      result = 'applied';
    }).then(() => result);
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
