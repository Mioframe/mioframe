/** Reverts every ancestor `scroll-snap-type` suspended by {@link suspendAncestorScrollSnap}. */
export type RestoreAncestorScrollSnap = () => void;

/**
 * Checks whether an element has CSS scroll-snap enabled.
 * @param element - Ancestor element to inspect.
 * @returns True when the element's computed `scroll-snap-type` is not `none`.
 */
const hasScrollSnap = (element: Element): boolean => {
  const value = window.getComputedStyle(element).scrollSnapType;

  return value !== '' && value !== 'none';
};

/**
 * Suspends `scroll-snap-type` on every ancestor of the reorder container that has it
 * enabled, for the duration of an active reorder session.
 *
 * Reactive reorder physically moves real DOM nodes inside the container. A
 * `scroll-snap-type` ancestor (for example a bottom sheet) can react to that DOM
 * mutation by resnapping its own scroll position — a genuine browser behavior, not
 * something this module ever calls directly, but one that still has to be neutralized
 * so an ancestor's scroll position is never driven by a reorder gesture.
 * @param containerEl - Reorder surface container.
 * @returns A restore function that reverts every suspended ancestor's inline style.
 */
export const suspendAncestorScrollSnap = (containerEl: HTMLElement): RestoreAncestorScrollSnap => {
  const restores: Array<() => void> = [];
  let ancestor = containerEl.parentElement;

  while (ancestor) {
    const snappingAncestor = ancestor;

    if (snappingAncestor instanceof HTMLElement && hasScrollSnap(snappingAncestor)) {
      const previousValue = snappingAncestor.style.scrollSnapType;

      snappingAncestor.style.scrollSnapType = 'none';
      restores.push(() => {
        snappingAncestor.style.scrollSnapType = previousValue;
      });
    }

    ancestor = ancestor.parentElement;
  }

  return () => {
    restores.forEach((restore) => {
      restore();
    });
  };
};
