import type { ReorderAxis } from './reorderGeometry';

/** Distance in CSS pixels from a scroll edge where auto-scroll starts. */
const REORDER_AUTO_SCROLL_EDGE = 36;

/** Maximum auto-scroll speed in CSS pixels per animation frame. */
const REORDER_AUTO_SCROLL_MAX_SPEED = 14;

/** Options for {@link createReorderAutoScroll}. */
export interface CreateReorderAutoScrollOptions {
  /** Element whose scroll position is driven while the pointer is near its edges. */
  scrollEl: HTMLElement;
  /** Primary movement axis of the reorder collection. */
  axis: ReorderAxis;
  /** Called after each applied scroll step so the engine can re-run its move logic. */
  onScrollStep: () => void;
}

/** Auto-scroll driver bound to one reorder session. */
export interface ReorderAutoScroll {
  /**
   * Updates the driver with the latest pointer position in viewport coordinates.
   * @param clientX - Pointer x in viewport coordinates.
   * @param clientY - Pointer y in viewport coordinates.
   */
  update: (clientX: number, clientY: number) => void;
  /** Stops any pending scroll animation frame. */
  stop: () => void;
}

/**
 * Creates an edge-proximity auto-scroll driver for an active reorder session.
 *
 * While the pointer sits inside the edge zone of the scroll container, the container is
 * scrolled a bounded amount per animation frame along the collection axis, and the
 * engine is asked to re-run its move logic so target index and overlay clamping stay in
 * sync with the new scroll position.
 * @param options - Scroll element, axis, and per-step callback.
 * @returns The auto-scroll driver.
 */
export const createReorderAutoScroll = ({
  scrollEl,
  axis,
  onScrollStep,
}: CreateReorderAutoScrollOptions): ReorderAutoScroll => {
  let velocity = 0;
  let frameHandle: number | undefined;

  const step = () => {
    frameHandle = undefined;

    if (velocity === 0) {
      return;
    }

    const before = axis === 'y' ? scrollEl.scrollTop : scrollEl.scrollLeft;

    if (axis === 'y') {
      scrollEl.scrollTop = before + velocity;
    } else {
      scrollEl.scrollLeft = before + velocity;
    }

    const after = axis === 'y' ? scrollEl.scrollTop : scrollEl.scrollLeft;

    if (after !== before) {
      onScrollStep();
    }

    scheduleStep();
  };

  const scheduleStep = () => {
    if (frameHandle !== undefined || velocity === 0) {
      return;
    }

    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      return;
    }

    frameHandle = window.requestAnimationFrame(step);
  };

  return {
    update: (clientX, clientY) => {
      const rect = scrollEl.getBoundingClientRect();
      const pointer = axis === 'y' ? clientY : clientX;
      const start = axis === 'y' ? rect.top : rect.left;
      const end = axis === 'y' ? rect.bottom : rect.right;
      const startDistance = pointer - start;
      const endDistance = end - pointer;

      if (startDistance < REORDER_AUTO_SCROLL_EDGE) {
        const strength = Math.min(1, Math.max(0, 1 - startDistance / REORDER_AUTO_SCROLL_EDGE));

        velocity = -Math.ceil(strength * REORDER_AUTO_SCROLL_MAX_SPEED);
      } else if (endDistance < REORDER_AUTO_SCROLL_EDGE) {
        const strength = Math.min(1, Math.max(0, 1 - endDistance / REORDER_AUTO_SCROLL_EDGE));

        velocity = Math.ceil(strength * REORDER_AUTO_SCROLL_MAX_SPEED);
      } else {
        velocity = 0;
      }

      scheduleStep();
    },
    stop: () => {
      velocity = 0;

      if (frameHandle !== undefined && typeof window !== 'undefined') {
        window.cancelAnimationFrame(frameHandle);
        frameHandle = undefined;
      }
    },
  };
};
