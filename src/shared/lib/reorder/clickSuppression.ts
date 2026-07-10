/**
 * Post-drag click suppression, kept independent from ordinary session teardown.
 *
 * The browser dispatches the synthetic `click` for a completed pointer gesture after
 * `pointerup`, so suppression must survive the pointer session's own (synchronous) cleanup. This
 * module owns exactly one transient, one-shot capture-phase `click` listener per armed gesture:
 * it intercepts the very next click on the given container, then removes itself; if no click
 * arrives, a bounded fallback (scheduled for the next task after the pointerup event turn) removes
 * it instead so a later, genuinely unrelated click is never suppressed.
 */

/** The removal fallback delay, chosen to run in the task after the pointerup event turn. */
const CLICK_SUPPRESSION_FALLBACK_MS = 0;

/** The imperative controller for one `useReorder` instance's post-drag click suppression. */
export interface ClickSuppressionController {
  /**
   * Arms one-shot suppression for the next `click` dispatched on `containerEl`. Re-arming clears
   * any previously armed (still-pending) suppression first.
   * @param containerEl - The reorder container the just-ended drag gesture occurred on.
   */
  arm: (containerEl: HTMLElement) => void;
  /** Clears any pending suppression immediately; safe to call when nothing is armed. */
  disarm: () => void;
}

/**
 * Creates one click-suppression controller, scoped to a single `useReorder` instance.
 * @returns The imperative `arm`/`disarm` controller.
 */
export const createClickSuppression = (): ClickSuppressionController => {
  let armedContainerEl: HTMLElement | null = null;
  let clickListener: ((event: MouseEvent) => void) | null = null;
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

  const disarm = (): void => {
    if (armedContainerEl && clickListener) {
      armedContainerEl.removeEventListener('click', clickListener, true);
    }
    if (fallbackTimer !== null) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    armedContainerEl = null;
    clickListener = null;
  };

  const arm = (containerEl: HTMLElement): void => {
    disarm();

    const listener = (event: MouseEvent): void => {
      event.preventDefault();
      event.stopPropagation();
      disarm();
    };

    armedContainerEl = containerEl;
    clickListener = listener;
    containerEl.addEventListener('click', listener, true);

    fallbackTimer = setTimeout(() => {
      disarm();
    }, CLICK_SUPPRESSION_FALLBACK_MS);
  };

  return { arm, disarm };
};
