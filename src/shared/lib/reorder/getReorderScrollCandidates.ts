import { getComputedStyles, getScrollableAncestors, isHTMLElement } from '@dnd-kit/dom/utilities';

/**
 * Finds the nearest ancestor of `start` (inclusive) with `position: fixed`, or `null` when none
 * exists.
 * @param start - The element to start walking from, inclusive.
 * @returns The nearest `position: fixed` ancestor element, or `null`.
 */
const getNearestFixedPositionAncestor = (start: Element): HTMLElement | null => {
  let current: Element | null = start;
  while (current) {
    if (isHTMLElement(current) && getComputedStyles(current, true).position === 'fixed') {
      return current;
    }
    current = current.parentElement;
  }
  return null;
};

/**
 * Whether `element` (already known to be `position: fixed`) is genuinely fixed to the browser
 * viewport, as opposed to an ancestor's own containing block (e.g. established by `transform`).
 *
 * Rather than reimplementing the CSS containing-block algorithm, this reads the browser's own
 * resolved layout relationship: a genuinely viewport-fixed element reports a `null`
 * `offsetParent`, while a fixed element whose containing block is an ancestor reports that
 * ancestor as its `offsetParent`.
 * @param element - A `position: fixed` element.
 * @returns Whether `element` is fixed to the viewport.
 */
const isViewportFixed = (element: HTMLElement): boolean => element.offsetParent === null;

/**
 * Builds the ordered scroll candidate chain for the active reorder container, nearest to
 * farthest: the container itself when scrollable, its scrollable DOM ancestors, and the document
 * scrolling element.
 *
 * When a genuinely viewport-fixed ancestor exists from the container upward (inclusive), only
 * candidates contained by that fixed boundary are kept, including the boundary itself. Scrolling
 * the document, or anything else outside a fixed boundary, can never move or reveal content
 * inside that fixed surface, so those candidates are excluded rather than attempted and ignored.
 *
 * A `position: fixed` element whose containing block is a transformed (or otherwise
 * containing-block-establishing) ancestor is not treated as a boundary: scrolling that ancestor
 * still moves the fixed surface and can reveal more of it. dnd-kit's own `getScrollableAncestors`
 * unconditionally stops walking at the first `position: fixed` node it meets, so in this case the
 * walk is resumed from just past that node to pick up the scrollable ancestors it would otherwise
 * miss.
 * @param container - The active reorder container, as resolved by `getReorderContainer`. On the
 * recursive continuation past a non-viewport-fixed boundary, an ancestor beyond it instead.
 * @returns The ordered scroll candidates for this drag, nearest to farthest.
 */
export const getReorderScrollCandidates = (container: Element): readonly Element[] => {
  const ancestors = [...getScrollableAncestors(container, { excludeElement: false })];

  const nearestFixed = getNearestFixedPositionAncestor(container);
  if (!nearestFixed) {
    return ancestors;
  }

  const withinFixedBoundary = ancestors.filter(
    (candidate) => candidate === nearestFixed || nearestFixed.contains(candidate),
  );

  if (isViewportFixed(nearestFixed)) {
    return withinFixedBoundary;
  }

  const beyondFixedBoundary = nearestFixed.parentElement
    ? getReorderScrollCandidates(nearestFixed.parentElement)
    : [];

  return [...withinFixedBoundary, ...beyondFixedBoundary];
};
