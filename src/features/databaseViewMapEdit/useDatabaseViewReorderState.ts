import { computed, ref, watch, type ComputedRef, type Ref } from 'vue';
import { arrayMove, arraysEqual, normalizeDisplayOrder } from './reorderState';

/** Drag-agnostic summary of a completed drag operation. */
export interface DragEndInfo {
  /** Whether the drag was canceled (e.g. Escape) rather than completed. */
  canceled: boolean;
  /** Whether the dragged entity was a sortable source (vs. some other drop target). */
  isSortableSource: boolean;
  /** Index the dragged row started at. */
  fromIndex: number;
  /** Index the dragged row ended at. */
  toIndex: number;
}

/**
 * Feature-local reorder state for a database-view list: renders the canonical
 * order while idle, freezes the displayed order for the duration of an active
 * drag, and reconciles an optimistic commit against the canonical stream.
 * @param canonicalIds - Authoritative ordered id list from the entity.
 * @param commit - Persistence callback invoked once for a changed completed drag.
 * @returns The displayed order plus `onDragStart`/`onDragEnd` drag-lifecycle handlers.
 */
export const useDatabaseViewReorderState = <T>(
  canonicalIds: Ref<readonly T[]> | ComputedRef<readonly T[]>,
  commit: (orderedIds: T[]) => Promise<unknown>,
) => {
  const pendingOrderedIds: Ref<T[] | null> = ref(null);
  const frozenOrderDuringDrag: Ref<T[] | null> = ref(null);

  const displayIds = computed<T[]>(
    () =>
      frozenOrderDuringDrag.value ??
      normalizeDisplayOrder(pendingOrderedIds.value, canonicalIds.value),
  );

  watch(canonicalIds, (next) => {
    if (
      pendingOrderedIds.value &&
      !frozenOrderDuringDrag.value &&
      arraysEqual(next, pendingOrderedIds.value)
    ) {
      pendingOrderedIds.value = null;
    }
  });

  const onDragStart = () => {
    frozenOrderDuringDrag.value = displayIds.value;
  };

  const onDragEnd = (drag: DragEndInfo) => {
    const snapshot = frozenOrderDuringDrag.value ?? displayIds.value;
    frozenOrderDuringDrag.value = null;

    if (drag.canceled || !drag.isSortableSource || drag.fromIndex === drag.toIndex) {
      return;
    }

    const nextOrderedIds = arrayMove(snapshot, drag.fromIndex, drag.toIndex);

    pendingOrderedIds.value = nextOrderedIds;
    commit(nextOrderedIds).catch(() => {
      pendingOrderedIds.value = null;
    });
  };

  return { displayIds, onDragStart, onDragEnd };
};
