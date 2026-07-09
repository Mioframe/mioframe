/**
 * Pure geometry for the reorder engine: item rect bookkeeping, axis detection,
 * target-index calculation, sibling shift offsets, and lifted-overlay clamping.
 *
 * All functions work on plain rect data measured once at session start, so they can be
 * unit-tested without DOM and reused for future horizontal collections without changing
 * the public reorder API.
 */

/** Primary movement axis of a reorder collection. */
export type ReorderAxis = 'x' | 'y';

/** Plain rect snapshot of one reorder item, in a stable measurement coordinate space. */
export interface ReorderItemRect {
  /** Stable item id read from the reorder item element. */
  id: string;
  /** Left edge in measurement coordinates. */
  left: number;
  /** Top edge in measurement coordinates. */
  top: number;
  /** Measured width. */
  width: number;
  /** Measured height. */
  height: number;
}

/** A 2D point in the same measurement coordinate space as {@link ReorderItemRect}. */
export interface ReorderPoint {
  /** Horizontal coordinate. */
  x: number;
  /** Vertical coordinate. */
  y: number;
}

/**
 * Reads a rect's start edge along an axis.
 * @param rect - Item rect to read.
 * @param axis - Primary movement axis.
 * @returns Top for a vertical axis, left for a horizontal axis.
 */
export const getReorderRectStart = (
  rect: Pick<ReorderItemRect, 'left' | 'top'>,
  axis: ReorderAxis,
): number => (axis === 'y' ? rect.top : rect.left);

/**
 * Reads a rect's size along an axis.
 * @param rect - Item rect to read.
 * @param axis - Primary movement axis.
 * @returns Height for a vertical axis, width for a horizontal axis.
 */
export const getReorderRectSize = (
  rect: Pick<ReorderItemRect, 'width' | 'height'>,
  axis: ReorderAxis,
): number => (axis === 'y' ? rect.height : rect.width);

/**
 * Reads a rect's center coordinate along an axis.
 * @param rect - Item rect to read.
 * @param axis - Primary movement axis.
 * @returns Center coordinate along the given axis.
 */
export const getReorderRectCenter = (rect: ReorderItemRect, axis: ReorderAxis): number =>
  getReorderRectStart(rect, axis) + getReorderRectSize(rect, axis) / 2;

/**
 * Detects the primary movement axis of a collection from its item rects.
 *
 * The axis with the larger spread between the first and last item centers wins; a
 * single-item or empty collection defaults to vertical, matching the current
 * production list scenarios.
 * @param rects - Ordered item rects measured at session start.
 * @returns The detected primary movement axis.
 */
export const getReorderAxis = (rects: readonly ReorderItemRect[]): ReorderAxis => {
  const first = rects.at(0);
  const last = rects.at(-1);

  if (!first || !last || first === last) {
    return 'y';
  }

  const spreadX = Math.abs(getReorderRectCenter(last, 'x') - getReorderRectCenter(first, 'x'));
  const spreadY = Math.abs(getReorderRectCenter(last, 'y') - getReorderRectCenter(first, 'y'));

  return spreadX > spreadY ? 'x' : 'y';
};

/** Inputs for {@link getReorderTargetIndex}. */
export interface GetReorderTargetIndexOptions {
  /** Ordered item rects measured at session start. */
  rects: readonly ReorderItemRect[];
  /** Index of the dragged item inside {@link rects}. */
  fromIndex: number;
  /** Current center of the dragged item along the primary axis, in measurement coordinates. */
  draggedCenter: number;
  /** Primary movement axis. */
  axis: ReorderAxis;
}

/**
 * Computes the index the dragged item would land on if released now.
 *
 * The dragged item's live center is compared against the *session-start* midpoints of
 * the other items, so each swap boundary stays fixed for the whole session and the
 * target index cannot oscillate while siblings animate into their shifted positions.
 * The comparisons are inclusive: dragged travel is clamped to the collection bounds,
 * so for equal-size items the clamped center can only ever *reach* the outermost
 * midpoints, and an exclusive comparison would make the first and last slots
 * unreachable.
 * @param options - Session rects, dragged index, and live dragged center.
 * @returns The target index inside the ordered collection.
 */
export const getReorderTargetIndex = ({
  rects,
  fromIndex,
  draggedCenter,
  axis,
}: GetReorderTargetIndexOptions): number => {
  let targetIndex = fromIndex;

  for (let index = fromIndex + 1; index < rects.length; index += 1) {
    const rect = rects[index];

    if (rect && draggedCenter >= getReorderRectCenter(rect, axis)) {
      targetIndex = index;
    }
  }

  if (targetIndex !== fromIndex) {
    return targetIndex;
  }

  for (let index = fromIndex - 1; index >= 0; index -= 1) {
    const rect = rects[index];

    if (rect && draggedCenter <= getReorderRectCenter(rect, axis)) {
      targetIndex = index;
    }
  }

  return targetIndex;
};

/**
 * Computes how far shifted siblings travel: the dragged item's size plus the gap to its
 * adjacent item, i.e. the size of the slot that opens or closes during the move.
 * @param rects - Ordered item rects measured at session start.
 * @param fromIndex - Index of the dragged item inside {@link rects}.
 * @param axis - Primary movement axis.
 * @returns The slot step in pixels along the primary axis.
 */
export const getReorderSlotStep = (
  rects: readonly ReorderItemRect[],
  fromIndex: number,
  axis: ReorderAxis,
): number => {
  const dragged = rects[fromIndex];

  if (!dragged) {
    return 0;
  }

  const neighbor = rects[fromIndex + 1] ?? rects[fromIndex - 1];

  if (!neighbor) {
    return getReorderRectSize(dragged, axis);
  }

  const [before, after] =
    getReorderRectStart(neighbor, axis) > getReorderRectStart(dragged, axis)
      ? [dragged, neighbor]
      : [neighbor, dragged];
  const gap = Math.max(
    0,
    getReorderRectStart(after, axis) -
      getReorderRectStart(before, axis) -
      getReorderRectSize(before, axis),
  );

  return getReorderRectSize(dragged, axis) + gap;
};

/** Inputs for {@link getReorderSiblingOffset}. */
export interface GetReorderSiblingOffsetOptions {
  /** Session-start index of the sibling being positioned. */
  index: number;
  /** Session-start index of the dragged item. */
  fromIndex: number;
  /** Current target index of the dragged item. */
  targetIndex: number;
  /** Slot step from {@link getReorderSlotStep}. */
  slotStep: number;
}

/**
 * Computes the translate offset for one sibling given the current target index.
 *
 * Siblings between the dragged item's start slot and its current target slot shift by
 * one slot step toward the vacated position; everything else stays in place.
 * @param options - Sibling index, session indices, and slot step.
 * @returns Offset in pixels along the primary axis.
 */
export const getReorderSiblingOffset = ({
  index,
  fromIndex,
  targetIndex,
  slotStep,
}: GetReorderSiblingOffsetOptions): number => {
  if (index === fromIndex) {
    return 0;
  }

  if (targetIndex > fromIndex && index > fromIndex && index <= targetIndex) {
    return -slotStep;
  }

  if (targetIndex < fromIndex && index >= targetIndex && index < fromIndex) {
    return slotStep;
  }

  return 0;
};

/** Inputs for {@link clampReorderDragOffset}. */
export interface ClampReorderDragOffsetOptions {
  /** Ordered item rects measured at session start. */
  rects: readonly ReorderItemRect[];
  /** Session-start index of the dragged item. */
  fromIndex: number;
  /** Raw pointer travel along the primary axis, in measurement coordinates. */
  desiredOffset: number;
  /** Primary movement axis. */
  axis: ReorderAxis;
}

/**
 * Clamps the dragged item's travel to the collection's own geometry, so the lifted
 * presentation layer stays inside the collection instead of following the pointer
 * freely across the page.
 * @param options - Session rects, dragged index, and requested travel.
 * @returns The clamped travel along the primary axis.
 */
export const clampReorderDragOffset = ({
  rects,
  fromIndex,
  desiredOffset,
  axis,
}: ClampReorderDragOffsetOptions): number => {
  const dragged = rects[fromIndex];
  const first = rects.at(0);
  const last = rects.at(-1);

  if (!dragged || !first || !last) {
    return 0;
  }

  const minStart = Math.min(getReorderRectStart(first, axis), getReorderRectStart(dragged, axis));
  const maxEnd = Math.max(
    getReorderRectStart(last, axis) + getReorderRectSize(last, axis),
    getReorderRectStart(dragged, axis) + getReorderRectSize(dragged, axis),
  );
  const minOffset = minStart - getReorderRectStart(dragged, axis);
  const maxOffset = maxEnd - getReorderRectSize(dragged, axis) - getReorderRectStart(dragged, axis);

  return Math.min(Math.max(desiredOffset, minOffset), maxOffset);
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
