import { useMainServiceClient } from '@shared/service';
import { computed, toValue, type ComputedRef, type Ref } from 'vue';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseView, DatabaseViewId } from '@shared/lib/databaseDocument';
import type { PatchSource } from '@shared/lib/changeObject';
import { useObservableQuery } from '@shared/lib/useObservableQuery';
import { isUndefined } from 'es-toolkit';

/**
 * Reactive contract returned by {@link useDatabaseViews}.
 */
export interface UseDatabaseViewsResult {
  /**
   * Ordered database views for the current document.
   */
  views: Readonly<Ref<readonly (readonly [DatabaseViewId, DatabaseView])[] | undefined>>;

  /**
   * Human-readable read error for the current query, if one exists.
   */
  errorMessage: ComputedRef<string | undefined>;

  /**
   * Whether the initial view-list read is still loading.
   */
  isLoading: Readonly<Ref<boolean>>;

  /**
   * Creates a new view for the current document.
   */
  create: (view: DatabaseView) => Promise<DatabaseViewId>;

  /**
   * Removes a concrete view from the current document.
   */
  remove: (viewId: DatabaseViewId) => Promise<unknown>;

  /**
   * Reorders the current document's views by explicit identifier order.
   */
  reorder: (orderedIds: DatabaseViewId[]) => Promise<unknown>;

  /**
   * Applies a partial update to a concrete view in the current document.
   */
  patch: (viewId: DatabaseViewId, view: PatchSource<DatabaseView>) => Promise<unknown>;
}

/**
 * Returns the ordered database-view list for a document together with view-level mutations.
 *
 * This composable is the raw entity read/write contract for database views. It does not apply any
 * default-view fallback or selection policy; consumers that need a current view should resolve that
 * separately through a higher-level selection contract.
 * @param path
 * @param documentId
 */
export const useDatabaseViews = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
): UseDatabaseViewsResult => {
  const {
    databaseDocument: {
      views: { reorder, create, patch, remove, viewList },
    },
  } = useMainServiceClient();

  const { data, error, isLoading } = useObservableQuery(
    viewList,
    computed(() => ({
      documentId: documentId.value,
      path: path.value,
    })),
  );

  const errorMessage = computed(() => {
    const e = toValue(error);

    if (isUndefined(e)) {
      return undefined;
    }

    if (e instanceof Error) {
      return e.message;
    }

    return 'Error reading views';
  });

  return {
    views: data,
    errorMessage,
    isLoading,

    create: (view: DatabaseView) => create(path.value, documentId.value, view),
    remove: (viewId: DatabaseViewId) => remove(path.value, documentId.value, viewId),
    reorder: (orderedIds: DatabaseViewId[]) => reorder(path.value, documentId.value, orderedIds),
    patch: (viewId: DatabaseViewId, view: PatchSource<DatabaseView>) =>
      patch(path.value, documentId.value, viewId, view),
  };
};
