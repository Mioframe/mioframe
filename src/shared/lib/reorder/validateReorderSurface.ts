import { isSameOrder, moveItem } from './reorderArray';
import type { ReorderCommitRequest, ReorderItemId } from './types';

/**
 * Stable, deterministic error message thrown by {@link assertUniqueItemIds}. Documented in
 * `README.md` so consumers can recognize this specific controlled-contract violation.
 */
export const REORDER_SURFACE_DUPLICATE_ITEM_IDS_MESSAGE =
  'ReorderSurface: itemIds must contain unique values.';

/**
 * Whether `itemIds` contains no duplicate values.
 * @param itemIds - The surface's current item id list.
 * @returns `true` when every id in `itemIds` is unique.
 */
export const hasUniqueItemIds = (itemIds: readonly ReorderItemId[]): boolean =>
  new Set(itemIds).size === itemIds.length;

/**
 * Throws {@link REORDER_SURFACE_DUPLICATE_ITEM_IDS_MESSAGE} when `itemIds` contains a duplicate.
 * `ReorderSurface` calls this at setup and at the start of every drag, so a controlled-list
 * contract violation fails deterministically at its source instead of producing ambiguous drag
 * targeting.
 * @param itemIds - The surface's current item id list.
 */
export const assertUniqueItemIds = (itemIds: readonly ReorderItemId[]): void => {
  if (!hasUniqueItemIds(itemIds)) {
    throw new Error(REORDER_SURFACE_DUPLICATE_ITEM_IDS_MESSAGE);
  }
};

/** The narrow slice of a completed dnd-kit sortable operation's source that drag-end validation needs. */
export interface ReorderDragEndSource {
  /** The dragged item's stable id, as dnd-kit resolved it for this operation. */
  readonly id: string | number;
  /** The dragged item's index within the surface's `itemIds` when the drag started. */
  readonly initialIndex: number;
  /** The dragged item's index within the surface's `itemIds` at drag end. */
  readonly index: number;
}

/** Inputs to {@link resolveReorderDragEnd}: the drag-end snapshot, current props, and outcome. */
export interface ReorderDragEndInput<TId extends ReorderItemId> {
  /** Whether dnd-kit reports this operation as cancelled. */
  readonly canceled: boolean;
  /** The `itemIds` snapshot captured at drag start, or `null` when no drag was active. */
  readonly snapshot: readonly TId[] | null;
  /** The surface's current, live `itemIds` at drag end. */
  readonly currentItemIds: readonly TId[];
  /** The completed operation's sortable source, or `null` when the operation was not sortable. */
  readonly source: ReorderDragEndSource | null;
}

/**
 * Resolves a completed drag into a guarded reorder request, or `null` when the operation must be
 * ignored: cancelled, not sortable, stale (`currentItemIds` no longer matches `snapshot`),
 * identity-inconsistent (`source.id` no longer matches `snapshot` at `source.initialIndex`), out
 * of range, a no-op move, or either `snapshot` or `currentItemIds` contains a duplicate id. This is
 * controlled-contract validation only — it never throws, mutates, or rolls back the caller's list;
 * a completion that arrives after the controlled list became invalid is simply ignored.
 * @param input - The drag-end snapshot, current props, and dnd-kit operation outcome.
 * @returns A guarded reorder request, or `null` when the operation must be ignored.
 */
export const resolveReorderDragEnd = <TId extends ReorderItemId>({
  canceled,
  snapshot,
  currentItemIds,
  source,
}: ReorderDragEndInput<TId>): ReorderCommitRequest<TId> | null => {
  if (canceled || !snapshot || !source) {
    return null;
  }

  if (!hasUniqueItemIds(snapshot) || !hasUniqueItemIds(currentItemIds)) {
    return null;
  }

  if (!isSameOrder(currentItemIds, snapshot)) {
    return null;
  }

  const { initialIndex, index } = source;

  if (
    initialIndex < 0 ||
    initialIndex >= snapshot.length ||
    index < 0 ||
    index >= snapshot.length
  ) {
    return null;
  }

  if (String(source.id) !== snapshot[initialIndex]) {
    return null;
  }

  if (initialIndex === index) {
    return null;
  }

  return {
    expectedOrderedIds: snapshot,
    orderedIds: moveItem(snapshot, initialIndex, index),
  };
};
