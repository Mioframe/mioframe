import { describe, expect, it } from 'vitest';
import {
  resolveReorderPostDragClick,
  shouldClearReorderPostDragSuppressionOnInput,
} from './reorderPostDragClick';

describe('shouldClearReorderPostDragSuppressionOnInput', () => {
  it('clears pending suppression on the next new input after drag end', () => {
    expect(
      shouldClearReorderPostDragSuppressionOnInput({
        isDragging: false,
        suppressNextClick: true,
      }),
    ).toBe(true);
  });

  it('does not clear suppression while a drag is still active', () => {
    expect(
      shouldClearReorderPostDragSuppressionOnInput({
        isDragging: true,
        suppressNextClick: true,
      }),
    ).toBe(false);
  });
});

describe('resolveReorderPostDragClick', () => {
  it('suppresses a synthetic click inside the reorder surface', () => {
    expect(
      resolveReorderPostDragClick({
        suppressNextClick: true,
        isTargetInsideSurface: true,
      }),
    ).toEqual({
      clearSuppression: true,
      preventClick: true,
    });
  });

  it('clears suppression without blocking unrelated clicks outside the surface', () => {
    expect(
      resolveReorderPostDragClick({
        suppressNextClick: true,
        isTargetInsideSurface: false,
      }),
    ).toEqual({
      clearSuppression: true,
      preventClick: false,
    });
  });
});
