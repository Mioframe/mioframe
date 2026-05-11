import type { AMDocumentId } from '@shared/lib/automerge';
import type { PatchSource } from '@shared/lib/changeObject';
import type { DatabaseView, DatabaseViewId } from '@shared/lib/databaseDocument';
import { DomainError } from '@shared/lib/error';
import { useObservableQuery } from '@shared/lib/useObservableQuery';
import { useMainServiceClient } from '@shared/service';
import { isUndefined } from 'es-toolkit';
import { computed, toValue, type ComputedRef, type Ref } from 'vue';

/**
 * Reactive contract returned by {@link useDatabaseView}.
 */
export interface UseDatabaseViewResult {
  /**
   * Current reactive snapshot of the requested database view.
   */
  view: Readonly<Ref<DatabaseView | DomainError | undefined>>;

  /**
   * Human-readable read error for the current query, if one exists.
   */
  errorMessage: ComputedRef<string | undefined>;

  /**
   * Whether the initial view read is still loading.
   */
  isLoading: Readonly<Ref<boolean>>;

  /**
   * Applies a partial update to the current concrete view.
   */
  patch: (view: PatchSource<DatabaseView>) => Promise<unknown>;
}

/**
 * Returns a single concrete database view together with its patch mutation.
 *
 * This composable requires a concrete `viewId` and intentionally does not resolve any default or
 * effective view semantics for callers.
 * @param path
 * @param documentId
 * @param viewId
 */
export const useDatabaseView = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  viewId: Ref<DatabaseViewId>,
): UseDatabaseViewResult => {
  const {
    databaseDocument: {
      views: { patch, databaseView },
    },
  } = useMainServiceClient();

  const { data, error, isLoading } = useObservableQuery(
    databaseView,
    computed(() => ({
      documentId: documentId.value,
      path: path.value,
      viewId: viewId.value,
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

    return 'Error reading view';
  });

  return {
    view: data,
    errorMessage,
    isLoading,

    patch: (view: PatchSource<DatabaseView>) =>
      patch(path.value, documentId.value, viewId.value, view),
  };
};
