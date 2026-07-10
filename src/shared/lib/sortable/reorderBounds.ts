/** Vertical extent, in viewport coordinates, that reorder interaction is clamped to. */
export interface ReorderVisibleBounds {
  /** Top edge of the visible interaction area. */
  top: number;
  /** Bottom edge of the visible interaction area. */
  bottom: number;
}

/**
 * Checks whether an element establishes a clipping context for its content.
 * @param element - Ancestor element to inspect.
 * @returns True when the element's computed overflow clips descendant content vertically.
 */
const isClippingAncestor = (element: Element): boolean => {
  const style = window.getComputedStyle(element);

  return /(auto|hidden|scroll|clip)/.test(`${style.overflowY} ${style.overflow}`);
};

/**
 * Computes the visible interaction bounds of a reorder container: the intersection of the
 * container's own rect with the viewport and every clipping ancestor up to the document.
 *
 * Auto-scroll edge zones and drag-intent clamping must use this area, not the raw
 * container rect, so a container taller than the viewport or clipped by a parent (a
 * bottom sheet, a scrollable pane) never treats an offscreen edge as an active edge zone.
 * @param containerEl - Reorder surface container element.
 * @returns The visible interaction bounds in viewport coordinates.
 */
export const getReorderVisibleBounds = (containerEl: HTMLElement): ReorderVisibleBounds => {
  const containerRect = containerEl.getBoundingClientRect();
  let top = containerRect.top;
  let bottom = containerRect.bottom;

  let ancestor = containerEl.parentElement;

  while (ancestor) {
    if (isClippingAncestor(ancestor)) {
      const ancestorRect = ancestor.getBoundingClientRect();

      top = Math.max(top, ancestorRect.top);
      bottom = Math.min(bottom, ancestorRect.bottom);
    }

    ancestor = ancestor.parentElement;
  }

  const viewportHeight =
    typeof window === 'undefined' ? bottom : (window.visualViewport?.height ?? window.innerHeight);

  top = Math.max(top, 0);
  bottom = Math.min(bottom, viewportHeight);

  return { top, bottom: Math.max(top, bottom) };
};
