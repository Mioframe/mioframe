import { computed, ref, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from 'vue';
import { isSameOrder, moveItem } from './reorderArray';
import type { ReorderCommitRequest, ReorderCommitResult, ReorderItemId } from './types';

/** Drag-agnostic summary of a completed drag gesture, normalized from the dnd-kit event shape. */
export interface ReorderDragEndInfo {
  /** Whether the drag ended by cancellation rather than a normal pointer release. */
  canceled: boolean;
  /** Whether the dragged source was a sortable item registered with this surface. */
  isSortableSource: boolean;
  /** The item's index in the drag-start snapshot. */
  fromIndex: number;
  /** The item's index in the drag-start snapshot at drop time. */
  toIndex: number;
}

interface DragSnapshot {
  startDisplayIds: ReorderItemId[];
  startCanonicalIds: ReorderItemId[];
  invalid: boolean;
}

interface PendingCommit {
  token: symbol;
  expectedOrderedIds: ReorderItemId[];
  optimisticOrderedIds: ReorderItemId[];
}

/**
 * Owns optimistic display order, canonical reconciliation, and single-flight commit tracking
 * for one `ReorderSurface`. Renders the canonical order while idle, freezes the displayed order
 * for the duration of an active drag, and reconciles at most one outstanding commit against the
 * canonical id stream.
 * @param itemIds - Canonical ordered ids; the only authoritative source of order.
 * @param commit - Guarded persistence callback invoked once per completed, changed, valid drag.
 * @returns The displayed order, pending-commit state, and drag-lifecycle handlers.
 */
export const useReorderCommit = (
  itemIds: MaybeRefOrGetter<readonly ReorderItemId[]>,
  commit: (request: ReorderCommitRequest) => Promise<ReorderCommitResult>,
) => {
  const canonicalIds = computed<readonly ReorderItemId[]>(() => toValue(itemIds));
  const dragSnapshot = ref<DragSnapshot | null>(null);
  const pendingCommit = ref<PendingCommit | null>(null);

  const displayItemIds: ComputedRef<readonly ReorderItemId[]> = computed(() => {
    if (dragSnapshot.value) {
      return dragSnapshot.value.startDisplayIds;
    }

    if (pendingCommit.value) {
      return pendingCommit.value.optimisticOrderedIds;
    }

    return canonicalIds.value;
  });

  const isCommitPending = computed(() => pendingCommit.value !== null);

  watch(canonicalIds, (nextCanonical) => {
    const drag = dragSnapshot.value;

    if (drag && !drag.invalid && !isSameOrder(nextCanonical, drag.startCanonicalIds)) {
      drag.invalid = true;
    }

    const pending = pendingCommit.value;

    if (!pending) {
      return;
    }

    if (isSameOrder(nextCanonical, pending.optimisticOrderedIds)) {
      pendingCommit.value = null;
      return;
    }

    if (isSameOrder(nextCanonical, pending.expectedOrderedIds)) {
      return;
    }

    pendingCommit.value = null;
  });

  const onDragStart = () => {
    dragSnapshot.value = {
      startDisplayIds: [...displayItemIds.value],
      startCanonicalIds: [...canonicalIds.value],
      invalid: false,
    };
  };

  const onDragEnd = (drag: ReorderDragEndInfo) => {
    const snapshot = dragSnapshot.value;
    dragSnapshot.value = null;

    if (!snapshot || drag.canceled || !drag.isSortableSource || snapshot.invalid) {
      return;
    }

    if (drag.fromIndex === drag.toIndex) {
      return;
    }

    const { startDisplayIds, startCanonicalIds } = snapshot;

    if (
      drag.fromIndex < 0 ||
      drag.fromIndex >= startDisplayIds.length ||
      drag.toIndex < 0 ||
      drag.toIndex >= startDisplayIds.length
    ) {
      return;
    }

    const nextOrderedIds = moveItem(startDisplayIds, drag.fromIndex, drag.toIndex);
    const token = Symbol('reorder-commit');

    pendingCommit.value = {
      token,
      expectedOrderedIds: startCanonicalIds,
      optimisticOrderedIds: nextOrderedIds,
    };

    commit({
      expectedOrderedIds: startCanonicalIds,
      orderedIds: nextOrderedIds,
    })
      .then((result) => {
        if (pendingCommit.value?.token !== token) {
          return;
        }

        if (result === 'stale') {
          pendingCommit.value = null;
        }
      })
      .catch(() => {
        if (pendingCommit.value?.token !== token) {
          return;
        }

        pendingCommit.value = null;
      });
  };

  return { displayItemIds, isCommitPending, onDragStart, onDragEnd };
};
