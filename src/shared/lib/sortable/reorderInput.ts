/** Normalized input source for a reorder interaction. */
export type ReorderInput = 'pointer' | 'touch';

/**
 * Movement in CSS pixels a mouse pointer must travel before a press becomes a reorder.
 * Below this, the press stays a plain click.
 */
export const REORDER_POINTER_MOVE_THRESHOLD = 4;

/**
 * Movement in CSS pixels a touch/pen press may drift and still count as a long press.
 * Faster movement before the long-press delay is treated as scrolling, not reorder.
 */
export const REORDER_TOUCH_MOVE_SLOP = 8;

/** Press duration in milliseconds before a touch/pen press activates reorder. */
export const REORDER_TOUCH_LONG_PRESS_MS = 180;

/**
 * Guards browser-only heuristics for SSR and test environments.
 * @returns True when the `navigator` global is available.
 */
const isNavigatorAvailable = (): boolean => typeof navigator !== 'undefined';

/**
 * Picks the default input mode when no active pointer type is known yet.
 * @returns `touch` on touch-capable devices, otherwise `pointer`.
 */
export const getDefaultReorderInput = (): ReorderInput => {
  if (!isNavigatorAvailable()) {
    return 'pointer';
  }

  if (navigator.maxTouchPoints > 0) {
    return 'touch';
  }

  if (
    typeof window !== 'undefined' &&
    'matchMedia' in window &&
    window.matchMedia('(any-pointer: coarse)').matches
  ) {
    return 'touch';
  }

  return 'pointer';
};

/**
 * Normalizes browser pointer types into the reorder input vocabulary.
 * @param pointerType - Raw `PointerEvent.pointerType` value.
 * @returns `touch` for touch/pen input, `pointer` for mouse, device default otherwise.
 */
export const getReorderInputFromPointerType = (pointerType: string | undefined): ReorderInput => {
  switch (pointerType) {
    case 'touch':
      return 'touch';
    case 'pen':
      return 'touch';
    case 'mouse':
      return 'pointer';
    default:
      return getDefaultReorderInput();
  }
};
