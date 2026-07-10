import { REORDER_ITEM_ATTRIBUTE } from './constants';
import type { ReorderItemRect } from './reorderGeometry';

/**
 * Checks the user's reduced-motion preference.
 * @returns True when transform-based reorder animation must be skipped.
 */
export const prefersReducedReorderMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Applies a FLIP (First/Last/Invert/Play) transform to reorder items whose position
 * changed, so a reactive Vue reorder reads as smooth movement instead of a hard jump.
 *
 * Vue has already moved the real DOM nodes to their new order by the time this runs (it
 * is meant to be called after `nextTick` following a `displayItemIdList` change). This
 * only inverts each moved item's travel with an inline `transform` and clears it on the
 * next frame; the CSS `transition: transform` already scoped to an active reorder surface
 * animates the release. No overlay, clone, or DOM reordering happens here.
 * @param containerEl - Reorder surface container to scan for items.
 * @param previousRects - Rects measured immediately before the order changed, keyed by id.
 */
export const applyReorderFlipAnimation = (
  containerEl: HTMLElement,
  previousRects: readonly ReorderItemRect[],
): void => {
  if (previousRects.length === 0 || prefersReducedReorderMotion()) {
    return;
  }

  const previousById = new Map(previousRects.map((rect) => [rect.id, rect]));
  const itemEls = [...containerEl.querySelectorAll(`[${REORDER_ITEM_ATTRIBUTE}]`)].filter(
    (element): element is HTMLElement => element instanceof HTMLElement,
  );

  itemEls.forEach((element) => {
    const id = element.getAttribute(REORDER_ITEM_ATTRIBUTE);
    const previous = id ? previousById.get(id) : undefined;

    if (!previous) {
      return;
    }

    const delta = previous.top - element.getBoundingClientRect().top;

    if (Math.abs(delta) < 0.5) {
      return;
    }

    element.style.transition = 'none';
    element.style.transform = `translateY(${delta}px)`;
    // Force a synchronous layout so the browser commits the inverted position before the
    // transition is re-enabled on the next frame.
    void element.offsetHeight;
    element.style.transition = '';

    requestAnimationFrame(() => {
      element.style.transform = '';
    });
  });
};

/**
 * Clears any inline transform left on reorder items, in case a session ends mid-animation.
 * @param containerEl - Reorder surface container to scan for items.
 */
export const clearReorderItemTransforms = (containerEl: HTMLElement): void => {
  const itemEls = containerEl.querySelectorAll<HTMLElement>(`[${REORDER_ITEM_ATTRIBUTE}]`);

  itemEls.forEach((element) => {
    element.style.transform = '';
  });
};
