import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseView, DatabaseViewId } from '@shared/lib/databaseDocument';
import { computed, isReadonly, watch, type ComputedRef, type Ref } from 'vue';
import { useDatabaseViews } from './useDatabaseViews';

const resolveEffectiveViewId = (
  explicitViewId: DatabaseViewId | undefined,
  viewList: readonly (readonly [DatabaseViewId, DatabaseView])[] | undefined,
): DatabaseViewId | undefined => {
  if (!viewList) {
    return explicitViewId;
  }

  if (explicitViewId && viewList.some(([viewId]) => viewId === explicitViewId)) {
    return explicitViewId;
  }

  return viewList.at(0)?.[0];
};

/**
 * Reactive contract returned by {@link useDatabaseViewSelection}.
 */
export interface UseDatabaseViewSelectionResult {
  /**
   * Ordered database views for the current document.
   */
  viewList: Readonly<Ref<readonly (readonly [DatabaseViewId, DatabaseView])[] | undefined>>;

  /**
   * Human-readable read error for the current query, if one exists.
   */
  errorMessage: ComputedRef<string | undefined>;

  /**
   * Whether the initial view-list read is still loading.
   */
  isLoading: Readonly<Ref<boolean>>;

  /**
   * The caller-owned explicit selection state.
   *
   * This mirrors `explicitViewIdState` and may still point at a missing view when the source ref is
   * readonly, because readonly consumers cannot be normalized by mutation.
   */
  explicitViewId: Ref<DatabaseViewId | undefined>;

  /**
   * The resolved view identifier that UI should use right now.
   *
   * This returns the explicit view when it still exists, otherwise the first ordered view.
   */
  effectiveViewId: ComputedRef<DatabaseViewId | undefined>;

  /**
   * Persists a new explicit selection when the source ref is writable.
   */
  setExplicitViewId: (viewId: DatabaseViewId | undefined) => void;

  /**
   * Clears the explicit selection when the source ref is writable.
   */
  clearExplicitViewId: () => void;
}

/**
 * Exposes a canonical database-view selection contract for UI consumers.
 *
 * The returned `explicitViewId` reflects the caller-owned selection state. The returned
 * `effectiveViewId` falls back to the first ordered view when the explicit selection is missing
 * or stale, so view-aware UI can use a single resolved identifier consistently.
 *
 * When `explicitViewIdState` is writable, stale explicit selections are cleared automatically
 * after view-list updates. When it is readonly, the composable keeps the same read semantics but
 * does not attempt to persist fallback decisions back to the caller.
 */
export const useDatabaseViewSelection = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  explicitViewIdState: Ref<DatabaseViewId | undefined>,
): UseDatabaseViewSelectionResult => {
  const { views: viewList, errorMessage, isLoading } = useDatabaseViews(path, documentId);

  const canPersistExplicitViewId = !isReadonly(explicitViewIdState);

  const setExplicitViewId = (viewId: DatabaseViewId | undefined) => {
    if (canPersistExplicitViewId) {
      explicitViewIdState.value = viewId;
    }
  };

  const clearExplicitViewId = () => {
    setExplicitViewId(undefined);
  };

  const explicitViewId = computed<DatabaseViewId | undefined>({
    get: () => explicitViewIdState.value,
    set: (viewId) => {
      setExplicitViewId(viewId);
    },
  });

  const effectiveViewId = computed(() =>
    resolveEffectiveViewId(explicitViewId.value, viewList.value),
  );

  watch(
    [viewList, explicitViewId],
    ([nextViewList, nextExplicitViewId]) => {
      if (
        canPersistExplicitViewId &&
        nextViewList &&
        nextExplicitViewId &&
        !nextViewList.some(([viewId]) => viewId === nextExplicitViewId)
      ) {
        clearExplicitViewId();
      }
    },
    { immediate: true },
  );

  return {
    viewList,
    errorMessage,
    isLoading,
    explicitViewId,
    effectiveViewId,
    setExplicitViewId,
    clearExplicitViewId,
  };
};
