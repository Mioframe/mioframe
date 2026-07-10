import { getReorderVisibleBounds } from './reorderBounds';

/** Distance in CSS pixels from a visible edge where auto-scroll starts. */
const REORDER_AUTO_SCROLL_EDGE = 36;

/** Maximum auto-scroll speed in CSS pixels per animation frame. */
const REORDER_AUTO_SCROLL_MAX_SPEED = 14;

/** Options for {@link createReorderAutoScroll}. */
export interface CreateReorderAutoScrollOptions {
  /** Reorder surface container; auto-scroll only ever scrolls this element. */
  containerEl: HTMLElement;
  /** Called after each applied scroll step so the session can refresh rects and intent. */
  onScrollStep: () => void;
}

/** Auto-scroll driver bound to one reorder session. */
export interface ReorderAutoScroll {
  /**
   * Updates the driver with the latest pointer position in viewport coordinates.
   * @param clientY - Pointer y in viewport coordinates.
   */
  update: (clientY: number) => void;
  /** Stops any pending scroll animation frame. */
  stop: () => void;
}

/**
 * Returns whether the container can still scroll further in the given direction.
 * @param containerEl - Reorder surface container.
 * @param velocity - Signed scroll step; negative scrolls up, positive scrolls down.
 * @returns True when scrolling in that direction would move the container.
 */
const canScrollFurther = (containerEl: HTMLElement, velocity: number): boolean => {
  if (velocity < 0) {
    return containerEl.scrollTop > 0;
  }

  return containerEl.scrollTop + containerEl.clientHeight < containerEl.scrollHeight;
};

/**
 * Creates a container-local edge-proximity auto-scroll driver for an active reorder
 * session.
 *
 * The container is never assumed to be fully visible: edge zones are computed from the
 * visible interaction bounds (the intersection of the container with the viewport and any
 * clipping ancestor), so an offscreen container edge never triggers a scroll. Only the
 * container itself is ever scrolled — never the document, a page, a pane, or a sheet.
 * @param options - Container element and per-step callback.
 * @returns The auto-scroll driver.
 */
export const createReorderAutoScroll = ({
  containerEl,
  onScrollStep,
}: CreateReorderAutoScrollOptions): ReorderAutoScroll => {
  let velocity = 0;
  let frameHandle: number | undefined;

  const step = () => {
    frameHandle = undefined;

    if (velocity === 0 || !canScrollFurther(containerEl, velocity)) {
      velocity = 0;
      return;
    }

    const before = containerEl.scrollTop;

    containerEl.scrollTop = before + velocity;

    if (containerEl.scrollTop !== before) {
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
    update: (clientY) => {
      const bounds = getReorderVisibleBounds(containerEl);
      const startDistance = clientY - bounds.top;
      const endDistance = bounds.bottom - clientY;

      if (startDistance < REORDER_AUTO_SCROLL_EDGE) {
        const strength = Math.min(1, Math.max(0, 1 - startDistance / REORDER_AUTO_SCROLL_EDGE));

        velocity = -Math.ceil(strength * REORDER_AUTO_SCROLL_MAX_SPEED);
      } else if (endDistance < REORDER_AUTO_SCROLL_EDGE) {
        const strength = Math.min(1, Math.max(0, 1 - endDistance / REORDER_AUTO_SCROLL_EDGE));

        velocity = Math.ceil(strength * REORDER_AUTO_SCROLL_MAX_SPEED);
      } else {
        velocity = 0;
      }

      if (velocity !== 0 && canScrollFurther(containerEl, velocity)) {
        scheduleStep();
      }
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
