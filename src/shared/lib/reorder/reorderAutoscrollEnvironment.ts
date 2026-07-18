const SCROLL_SNAP_PROPERTY = 'scroll-snap-type';
const SCROLL_SNAP_SUPPRESSED_VALUE = 'none';
const SCROLL_SNAP_SUPPRESSED_PRIORITY = '';

interface SavedScrollSnapDeclaration {
  readonly element: HTMLElement;
  readonly value: string;
  readonly priority: string;
}

/** A live guard suppressing scroll-snap on the candidates it was acquired for. */
export interface ReorderAutoscrollEnvironment {
  /**
   * Restores each candidate's original inline `scroll-snap-type` declaration, unless a concurrent
   * consumer changed that inline property (its value, its priority, or both) during the drag, in
   * which case that change is left untouched. Safe to call more than once.
   */
  dispose(): void;
}

/**
 * Temporarily suppresses scroll-snap on every scroll candidate for the lifetime of an active
 * reorder drag, so `ReorderAutoScroller` (see `ReorderAutoScroller.ts`) can apply deterministic
 * autoscroll deltas without a candidate's own `scroll-snap-type` redirecting or undoing them.
 *
 * The suppression is applied as a normal-priority inline declaration; it never uses `!important`.
 * An inline declaration is a single per-property slot, so setting it replaces whatever inline
 * value and priority a candidate already had, and its specificity still outranks any non-important
 * author stylesheet rule (such as the fixture's `scroll-snap-type: y proximity`). This is
 * temporary runtime state, not a project styling convention. Callers must dispose the returned
 * environment when the drag ends, is cancelled, or the owning plugin is disabled/destroyed.
 * @param candidates - The precomputed scroll candidate chain for the active drag (see
 * `getReorderScrollCandidates`). Non-`HTMLElement` candidates are left untouched.
 * @returns A guard whose `dispose()` restores the original scroll-snap declarations.
 */
export const acquireReorderAutoscrollEnvironment = (
  candidates: readonly Element[],
): ReorderAutoscrollEnvironment => {
  const uniqueElements = new Set(
    candidates.filter((candidate): candidate is HTMLElement => candidate instanceof HTMLElement),
  );

  const saved: SavedScrollSnapDeclaration[] = [];

  for (const element of uniqueElements) {
    saved.push({
      element,
      value: element.style.getPropertyValue(SCROLL_SNAP_PROPERTY),
      priority: element.style.getPropertyPriority(SCROLL_SNAP_PROPERTY),
    });
    element.style.setProperty(SCROLL_SNAP_PROPERTY, SCROLL_SNAP_SUPPRESSED_VALUE);
  }

  let disposed = false;

  return {
    dispose: () => {
      if (disposed) {
        return;
      }
      disposed = true;

      for (const { element, value, priority } of saved) {
        const currentPriority = element.style.getPropertyPriority(SCROLL_SNAP_PROPERTY);
        const stillOwned =
          element.style.getPropertyValue(SCROLL_SNAP_PROPERTY) === SCROLL_SNAP_SUPPRESSED_VALUE &&
          currentPriority === SCROLL_SNAP_SUPPRESSED_PRIORITY;

        if (!stillOwned) {
          continue;
        }

        if (value) {
          element.style.setProperty(SCROLL_SNAP_PROPERTY, value, priority);
        } else {
          element.style.removeProperty(SCROLL_SNAP_PROPERTY);
        }
      }
    },
  };
};
