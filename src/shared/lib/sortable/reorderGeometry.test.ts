import { describe, expect, it } from 'vitest';
import {
  clampReorderDragOffset,
  getReorderAxis,
  getReorderRectCenter,
  getReorderSiblingOffset,
  getReorderSlotStep,
  getReorderTargetIndex,
  moveReorderListItem,
  type ReorderItemRect,
} from './reorderGeometry';

const rectAt = (rects: readonly ReorderItemRect[], index: number): ReorderItemRect => {
  const rect = rects[index];

  if (!rect) {
    throw new Error(`missing fixture rect at index ${index}`);
  }

  return rect;
};

const makeVerticalRects = (heights: number[], gap = 8): ReorderItemRect[] => {
  let top = 100;

  return heights.map((height, index) => {
    const rect: ReorderItemRect = {
      id: `item-${index}`,
      left: 20,
      top,
      width: 320,
      height,
    };

    top += height + gap;
    return rect;
  });
};

describe('reorderGeometry', () => {
  it('detects the primary axis from the dominant spread of item centers', () => {
    const vertical = makeVerticalRects([56, 56, 56]);
    const horizontal: ReorderItemRect[] = [
      { id: 'a', left: 0, top: 10, width: 80, height: 40 },
      { id: 'b', left: 100, top: 10, width: 80, height: 40 },
      { id: 'c', left: 200, top: 10, width: 80, height: 40 },
    ];

    expect(getReorderAxis(vertical)).toBe('y');
    expect(getReorderAxis(horizontal)).toBe('x');
    expect(getReorderAxis([])).toBe('y');
    expect(getReorderAxis(vertical.slice(0, 1))).toBe('y');
  });

  it('reads rect centers along both axes', () => {
    const rect: ReorderItemRect = { id: 'a', left: 10, top: 100, width: 300, height: 56 };

    expect(getReorderRectCenter(rect, 'y')).toBe(128);
    expect(getReorderRectCenter(rect, 'x')).toBe(160);
  });

  it('keeps the target index at the start slot before any midpoint is crossed', () => {
    const rects = makeVerticalRects([56, 56, 56, 56]);

    expect(
      getReorderTargetIndex({
        rects,
        fromIndex: 1,
        draggedCenter: getReorderRectCenter(rectAt(rects, 1), 'y') + 10,
        axis: 'y',
      }),
    ).toBe(1);
  });

  it('moves the target index down as the dragged center crosses lower midpoints', () => {
    const rects = makeVerticalRects([56, 56, 56, 56]);

    // Inclusive boundary: reaching a midpoint exactly claims the slot, so the outermost
    // slot stays reachable under clamped travel.
    expect(
      getReorderTargetIndex({
        rects,
        fromIndex: 0,
        draggedCenter: getReorderRectCenter(rectAt(rects, 3), 'y'),
        axis: 'y',
      }),
    ).toBe(3);
    expect(
      getReorderTargetIndex({
        rects,
        fromIndex: 0,
        draggedCenter: getReorderRectCenter(rectAt(rects, 2), 'y') + 1,
        axis: 'y',
      }),
    ).toBe(2);
    expect(
      getReorderTargetIndex({
        rects,
        fromIndex: 0,
        draggedCenter: getReorderRectCenter(rectAt(rects, 3), 'y') + 1,
        axis: 'y',
      }),
    ).toBe(3);
  });

  it('moves the target index up as the dragged center crosses higher midpoints', () => {
    const rects = makeVerticalRects([56, 56, 56, 56]);

    expect(
      getReorderTargetIndex({
        rects,
        fromIndex: 3,
        draggedCenter: getReorderRectCenter(rectAt(rects, 1), 'y') - 1,
        axis: 'y',
      }),
    ).toBe(1);
    expect(
      getReorderTargetIndex({
        rects,
        fromIndex: 3,
        draggedCenter: getReorderRectCenter(rectAt(rects, 0), 'y') - 1,
        axis: 'y',
      }),
    ).toBe(0);
  });

  it('computes target indices against session-start midpoints for variable heights', () => {
    const rects = makeVerticalRects([40, 120, 40]);

    // Crossing the tall middle item's midpoint from above lands on its slot.
    expect(
      getReorderTargetIndex({
        rects,
        fromIndex: 0,
        draggedCenter: getReorderRectCenter(rectAt(rects, 1), 'y') + 1,
        axis: 'y',
      }),
    ).toBe(1);
    // Staying above that midpoint keeps the start slot.
    expect(
      getReorderTargetIndex({
        rects,
        fromIndex: 0,
        draggedCenter: getReorderRectCenter(rectAt(rects, 1), 'y') - 1,
        axis: 'y',
      }),
    ).toBe(0);
  });

  it('derives the slot step from the dragged size plus the adjacent gap', () => {
    const rects = makeVerticalRects([56, 56, 56], 8);

    expect(getReorderSlotStep(rects, 1, 'y')).toBe(64);
    // Last item uses the gap toward its previous neighbor.
    expect(getReorderSlotStep(rects, 2, 'y')).toBe(64);
    // A single item has no gap to include.
    expect(getReorderSlotStep(rects.slice(0, 1), 0, 'y')).toBe(56);
    expect(getReorderSlotStep(rects, 5, 'y')).toBe(0);
  });

  it('shifts only the siblings between the start slot and the target slot', () => {
    const slotStep = 64;

    // Dragging item 0 down to slot 2: items 1 and 2 shift up.
    expect(getReorderSiblingOffset({ index: 0, fromIndex: 0, targetIndex: 2, slotStep })).toBe(0);
    expect(getReorderSiblingOffset({ index: 1, fromIndex: 0, targetIndex: 2, slotStep })).toBe(-64);
    expect(getReorderSiblingOffset({ index: 2, fromIndex: 0, targetIndex: 2, slotStep })).toBe(-64);
    expect(getReorderSiblingOffset({ index: 3, fromIndex: 0, targetIndex: 2, slotStep })).toBe(0);

    // Dragging item 3 up to slot 1: items 1 and 2 shift down.
    expect(getReorderSiblingOffset({ index: 0, fromIndex: 3, targetIndex: 1, slotStep })).toBe(0);
    expect(getReorderSiblingOffset({ index: 1, fromIndex: 3, targetIndex: 1, slotStep })).toBe(64);
    expect(getReorderSiblingOffset({ index: 2, fromIndex: 3, targetIndex: 1, slotStep })).toBe(64);

    // No move: nothing shifts.
    expect(getReorderSiblingOffset({ index: 1, fromIndex: 2, targetIndex: 2, slotStep })).toBe(0);
  });

  it('clamps dragged travel to the collection bounds', () => {
    const rects = makeVerticalRects([56, 56, 56]);

    // Upward travel cannot lift the dragged item above the first item's top.
    expect(clampReorderDragOffset({ rects, fromIndex: 1, desiredOffset: -500, axis: 'y' })).toBe(
      rectAt(rects, 0).top - rectAt(rects, 1).top,
    );
    // Downward travel cannot push it past the last item's bottom edge.
    expect(clampReorderDragOffset({ rects, fromIndex: 1, desiredOffset: 500, axis: 'y' })).toBe(
      rectAt(rects, 2).top +
        rectAt(rects, 2).height -
        rectAt(rects, 1).height -
        rectAt(rects, 1).top,
    );
    // Travel inside the bounds passes through unchanged.
    expect(clampReorderDragOffset({ rects, fromIndex: 1, desiredOffset: 10, axis: 'y' })).toBe(10);
    expect(clampReorderDragOffset({ rects: [], fromIndex: 0, desiredOffset: 10, axis: 'y' })).toBe(
      0,
    );
  });

  it('moves list items and copies the list for invalid indices', () => {
    expect(moveReorderListItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveReorderListItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
    expect(moveReorderListItem(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
    expect(moveReorderListItem(['a', 'b'], 5, 0)).toEqual(['a', 'b']);

    const source = ['a', 'b'];

    expect(moveReorderListItem(source, 0, 1)).not.toBe(source);
  });
});
