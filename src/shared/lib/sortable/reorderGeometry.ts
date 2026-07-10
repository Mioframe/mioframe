/**
 * Pure geometry for the reactive reorder session: item rect bookkeeping, drag anchor,
 * hysteresis-based target-index calculation, and list reordering.
 *
 * Every function here works on plain rect data and never touches the DOM, so the swap
 * logic can be unit-tested without a browser. The supported production scenario is a
 * single bounded vertical list; there is no axis concept.
 */

/** Plain top/height rect snapshot of one reorder item, in viewport coordinates. */
export interface ReorderItemRect {
  /** Stable item id read from the reorder item element. */
  id: string;
  /** Top edge in viewport coordinates. */
  top: number;
  /** Measured height. */
  height: number;
}

/**
 * Reads a rect's vertical center.
 * @param rect - Item rect to read.
 * @returns The rect's center coordinate along the vertical axis.
 */
export const getReorderRectCenter = (rect: Pick<ReorderItemRect, 'top' | 'height'>): number =>
  rect.top + rect.height / 2;

/**
 * Computes the pointer-relative anchor inside the dragged row at activation.
 * @param pointerY - Pointer vertical position in viewport coordinates.
 * @param draggedRect - Dragged item's rect at activation.
 * @returns The offset from the row's top edge to the pointer, in CSS pixels.
 */
export const getDragAnchorOffset = (pointerY: number, draggedRect: ReorderItemRect): number =>
  pointerY - draggedRect.top;

/** Inputs for {@link getDraggedIntentCenter}. */
export interface GetDraggedIntentCenterOptions {
  /** Latest pointer vertical position in viewport coordinates. */
  pointerY: number;
  /** Anchor offset captured at activation via {@link getDragAnchorOffset}. */
  anchorOffset: number;
  /** Current measured height of the dragged row. */
  draggedHeight: number;
  /** Visible interaction bounds the intent must be clamped to. */
  visibleBounds: { top: number; bottom: number };
}

/**
 * Computes the dragged row's intended center from the pointer position and drag anchor,
 * clamped to the visible interaction bounds so intent never reaches offscreen rows.
 * @param options - Pointer position, anchor, dragged row height, and visible bounds.
 * @returns The clamped intended center coordinate.
 */
export const getDraggedIntentCenter = ({
  pointerY,
  anchorOffset,
  draggedHeight,
  visibleBounds,
}: GetDraggedIntentCenterOptions): number => {
  const rawTop = pointerY - anchorOffset;
  const rawCenter = rawTop + draggedHeight / 2;
  const minCenter = visibleBounds.top + draggedHeight / 2;
  const maxCenter = visibleBounds.bottom - draggedHeight / 2;

  if (minCenter > maxCenter) {
    return (visibleBounds.top + visibleBounds.bottom) / 2;
  }

  return Math.min(Math.max(rawCenter, minCenter), maxCenter);
};

/**
 * Hysteresis margin as a fraction of a neighbor's height. The dragged intent must cross a
 * neighbor's center by this extra margin before a swap occurs, so the target index cannot
 * bounce back and forth while the pointer sits near a boundary.
 */
export const REORDER_HYSTERESIS_RATIO = 0.2;

/** Inputs for {@link getReorderTargetIndex}. */
export interface GetReorderTargetIndexOptions {
  /** Ordered item rects measured from the current DOM order. */
  rects: readonly ReorderItemRect[];
  /** Index of the dragged item inside {@link rects}, i.e. its current slot. */
  currentIndex: number;
  /** Clamped intended center of the dragged item, from {@link getDraggedIntentCenter}. */
  draggedCenter: number;
  /** Hysteresis margin in CSS pixels added against the direction of travel. */
  hysteresis?: number;
}

/**
 * Computes the index the dragged item should occupy given its current intended center.
 *
 * Scans outward from the dragged item's current slot in both directions. Each candidate
 * boundary is offset by {@link REORDER_HYSTERESIS_RATIO} of the candidate's height against
 * the direction of travel, so a swap only happens once the dragged intent clearly commits
 * past the neighbor's center — the pointer can hover exactly on a boundary without the
 * index oscillating.
 * @param options - Current rects, the dragged item's slot, and its intended center.
 * @returns The target index inside the ordered collection.
 */
export const getReorderTargetIndex = ({
  rects,
  currentIndex,
  draggedCenter,
  hysteresis,
}: GetReorderTargetIndexOptions): number => {
  let targetIndex = currentIndex;

  for (let index = currentIndex + 1; index < rects.length; index += 1) {
    const rect = rects[index];

    if (!rect) {
      break;
    }

    const margin = hysteresis ?? rect.height * REORDER_HYSTERESIS_RATIO;
    const boundary = getReorderRectCenter(rect) + margin;

    if (draggedCenter < boundary) {
      break;
    }

    targetIndex = index;
  }

  if (targetIndex !== currentIndex) {
    return targetIndex;
  }

  for (let index = currentIndex - 1; index >= 0; index -= 1) {
    const rect = rects[index];

    if (!rect) {
      break;
    }

    const margin = hysteresis ?? rect.height * REORDER_HYSTERESIS_RATIO;
    const boundary = getReorderRectCenter(rect) - margin;

    if (draggedCenter > boundary) {
      break;
    }

    targetIndex = index;
  }

  return targetIndex;
};

/**
 * Returns a copy of the list with one item moved to a new index.
 * @param list - Source list.
 * @param fromIndex - Index of the item to move.
 * @param toIndex - Index the item should land on.
 * @returns A new list with the item moved, or a plain copy when indices are invalid.
 */
export const moveReorderListItem = <T>(
  list: readonly T[],
  fromIndex: number,
  toIndex: number,
): T[] => {
  const result = [...list];

  if (
    fromIndex < 0 ||
    fromIndex >= result.length ||
    toIndex < 0 ||
    toIndex >= result.length ||
    fromIndex === toIndex
  ) {
    return result;
  }

  const [moved] = result.splice(fromIndex, 1);

  if (moved !== undefined) {
    result.splice(toIndex, 0, moved);
  }

  return result;
};

/**
 * Validates that a freshly measured DOM order is consistent with the caller's expected
 * order before a session is allowed to activate.
 *
 * The shared sortable layer fails closed: any mismatch (missing id, duplicate id, or an
 * unknown extra id) cancels activation instead of guessing feature intent.
 * @param measuredIds - Ids read from the DOM in current render order.
 * @param expectedIds - Authoritative display order known to the caller.
 * @returns True when the measured order is a valid permutation of the expected order.
 */
export const isReorderSessionModelConsistent = (
  measuredIds: readonly string[],
  expectedIds: readonly string[],
): boolean => {
  if (measuredIds.length === 0 || measuredIds.some((id) => !id)) {
    return false;
  }

  if (new Set(measuredIds).size !== measuredIds.length) {
    return false;
  }

  if (measuredIds.length !== expectedIds.length) {
    return false;
  }

  const expectedSet = new Set(expectedIds);

  return measuredIds.every((id) => expectedSet.has(id));
};
