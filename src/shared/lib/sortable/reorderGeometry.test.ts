import { describe, expect, it } from 'vitest';
import {
  getDragAnchorOffset,
  getDraggedIntentCenter,
  getReorderRectCenter,
  getReorderTargetIndex,
  isReorderSessionModelConsistent,
  moveReorderListItem,
  REORDER_HYSTERESIS_RATIO,
  type ReorderItemRect,
} from './reorderGeometry';

const rect = (id: string, top: number, height = 40): ReorderItemRect => ({ id, top, height });

describe('reorderGeometry', () => {
  it('computes a rect vertical center', () => {
    expect(getReorderRectCenter(rect('a', 0, 40))).toBe(20);
    expect(getReorderRectCenter(rect('a', 100, 40))).toBe(120);
  });

  it('computes the drag anchor offset from pointer position', () => {
    expect(getDragAnchorOffset(112, rect('a', 100, 40))).toBe(12);
    expect(getDragAnchorOffset(100, rect('a', 100, 40))).toBe(0);
  });

  it('computes intent center from anchor and pointer position', () => {
    const center = getDraggedIntentCenter({
      pointerY: 150,
      anchorOffset: 12,
      draggedHeight: 40,
      visibleBounds: { top: 0, bottom: 1000 },
    });

    // rawTop = 150 - 12 = 138; rawCenter = 138 + 20 = 158
    expect(center).toBe(158);
  });

  it('clamps intent center to visible bounds', () => {
    const top = getDraggedIntentCenter({
      pointerY: -500,
      anchorOffset: 0,
      draggedHeight: 40,
      visibleBounds: { top: 100, bottom: 500 },
    });
    const bottom = getDraggedIntentCenter({
      pointerY: 5000,
      anchorOffset: 0,
      draggedHeight: 40,
      visibleBounds: { top: 100, bottom: 500 },
    });

    expect(top).toBe(120); // visibleBounds.top + height/2
    expect(bottom).toBe(480); // visibleBounds.bottom - height/2
  });

  it('falls back to the bounds midpoint when the dragged row cannot fit', () => {
    const center = getDraggedIntentCenter({
      pointerY: 200,
      anchorOffset: 0,
      draggedHeight: 900,
      visibleBounds: { top: 100, bottom: 500 },
    });

    expect(center).toBe(300);
  });

  describe('getReorderTargetIndex', () => {
    const rectA = rect('a', 0);
    const rectB = rect('b', 40);
    const rectC = rect('c', 80);
    const rectD = rect('d', 120);
    const rects = [rectA, rectB, rectC, rectD];

    it('keeps the current index when intent stays near the dragged slot', () => {
      expect(
        getReorderTargetIndex({
          rects,
          currentIndex: 1,
          draggedCenter: getReorderRectCenter(rectB),
        }),
      ).toBe(1);
    });

    it('moves forward once intent clears a later neighbor plus hysteresis', () => {
      const nextCenter = getReorderRectCenter(rectC) + rectC.height * REORDER_HYSTERESIS_RATIO + 1;

      expect(getReorderTargetIndex({ rects, currentIndex: 1, draggedCenter: nextCenter })).toBe(2);
    });

    it('does not move forward when intent stops just short of the hysteresis margin', () => {
      const shortCenter = getReorderRectCenter(rectC) + rectC.height * REORDER_HYSTERESIS_RATIO - 1;

      expect(getReorderTargetIndex({ rects, currentIndex: 1, draggedCenter: shortCenter })).toBe(1);
    });

    it('moves backward once intent clears an earlier neighbor plus hysteresis', () => {
      const prevCenter = getReorderRectCenter(rectA) - rectA.height * REORDER_HYSTERESIS_RATIO - 1;

      expect(getReorderTargetIndex({ rects, currentIndex: 1, draggedCenter: prevCenter })).toBe(0);
    });

    it('does not oscillate when intent sits exactly on the plain midpoint boundary (hysteresis)', () => {
      const boundaryCenter = getReorderRectCenter(rectC);

      expect(getReorderTargetIndex({ rects, currentIndex: 1, draggedCenter: boundaryCenter })).toBe(
        1,
      );
    });

    it('can skip multiple slots when intent travels far enough', () => {
      const farCenter = getReorderRectCenter(rectD) + rectD.height * REORDER_HYSTERESIS_RATIO + 1;

      expect(getReorderTargetIndex({ rects, currentIndex: 0, draggedCenter: farCenter })).toBe(3);
    });
  });

  it('moves a list item to a new index', () => {
    expect(moveReorderListItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveReorderListItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  it('returns a plain copy for a no-op or invalid move', () => {
    const source = ['a', 'b', 'c'];

    expect(moveReorderListItem(source, 1, 1)).toEqual(source);
    expect(moveReorderListItem(source, 1, 1)).not.toBe(source);
    expect(moveReorderListItem(source, -1, 1)).toEqual(source);
    expect(moveReorderListItem(source, 1, 5)).toEqual(source);
  });

  describe('isReorderSessionModelConsistent', () => {
    it('accepts a measured order that is a permutation of the expected ids', () => {
      expect(isReorderSessionModelConsistent(['b', 'a', 'c'], ['a', 'b', 'c'])).toBe(true);
    });

    it('rejects empty or blank measured ids', () => {
      expect(isReorderSessionModelConsistent([], ['a'])).toBe(false);
      expect(isReorderSessionModelConsistent(['a', ''], ['a', 'b'])).toBe(false);
    });

    it('rejects duplicate measured ids', () => {
      expect(isReorderSessionModelConsistent(['a', 'a'], ['a', 'b'])).toBe(false);
    });

    it('rejects a measured order with an unknown extra id', () => {
      expect(isReorderSessionModelConsistent(['a', 'b', 'z'], ['a', 'b', 'c'])).toBe(false);
    });

    it('rejects a measured order missing an expected id', () => {
      expect(isReorderSessionModelConsistent(['a', 'b'], ['a', 'b', 'c'])).toBe(false);
    });
  });
});
