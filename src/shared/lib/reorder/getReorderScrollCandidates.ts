import { getComputedStyles, getScrollableAncestors } from '@dnd-kit/dom/utilities';

const getNearestFixedPositionElement = (start: Element): Element | null => {
  let current: Element | null = start;
  while (current) {
    if (getComputedStyles(current, true).position === 'fixed') {
      return current;
    }
    current = current.parentElement;
  }
  return null;
};

/**
 * Builds the ordered scroll candidate chain for the active reorder container, nearest to
 * farthest: the container itself when scrollable, its scrollable DOM ancestors, and the document
 * scrolling element.
 *
 * When a `position: fixed` element exists from the container upward (inclusive), only candidates
 * contained by that fixed boundary are kept, including the boundary itself. Scrolling the
 * document, or anything else outside a fixed boundary, can never move or reveal content inside
 * that fixed surface, so those candidates are excluded rather than attempted and ignored.
 * @param container - The active reorder container, as resolved by `getReorderContainer`.
 * @returns The ordered scroll candidates for this drag, nearest to farthest.
 */
export const getReorderScrollCandidates = (container: Element): readonly Element[] => {
  const ancestors = [...getScrollableAncestors(container, { excludeElement: false })];

  const fixedBoundary = getNearestFixedPositionElement(container);
  if (!fixedBoundary) {
    return ancestors;
  }

  return ancestors.filter(
    (candidate) => candidate === fixedBoundary || fixedBoundary.contains(candidate),
  );
};
