/**
 * Post-drag click suppression and early-cancellation release tracking, kept independent from
 * ordinary session teardown.
 *
 * A normal completed drag arms one-shot suppression immediately during the original `pointerup`
 * handling: the browser dispatches the resulting synthetic `click` after `pointerup`, so
 * suppression must survive the pointer session's own (synchronous) cleanup, which it does through
 * a bounded next-task fallback.
 *
 * A session cancelled *before* the original pointer physically releases (`Escape`, blur,
 * visibility loss, a second pointer, an active-item unmount, or another mid-gesture event while
 * the container/composable stay mounted) cannot use that same immediate arm-and-fallback shape:
 * the physical release may be arbitrarily far in the future, well past one event-loop turn. For
 * that case this module instead starts a minimal, bounded release watcher that listens for the
 * original pointer's own `pointerup`/`pointercancel` and only arms suppression once that release
 * actually happens (or gives up after a bounded safety timeout, or once a matching `pointercancel`
 * proves no click will ever follow).
 *
 * Container/composable removal (`PointerSession.detachContainer`/`dispose`) is a *hard* cleanup
 * boundary, not one more release-watcher trigger: cancelling a still-physically-held dragging
 * session as part of that removal would otherwise start exactly this watcher, but both callers
 * unconditionally call {@link ClickSuppressionController.disarm} immediately afterward, in the
 * same synchronous call, so no watcher (or its safety timeout) ever survives past a
 * `detachContainer`/`dispose` call — there is no longer a container left to observe a future click
 * on, or a mounted composable left to own the watcher.
 *
 * This module does not re-install any `selectstart`-prevention guard for the bounded window: an
 * earlier version did, on the theory that Chromium's native "extend a text selection near a
 * scrollable edge autoscrolls it" behavior could otherwise continue scrolling the container after
 * `activeSessionEffects.dispose()` removes `activeSessionEffects.ts`'s own active-drag guard. A
 * causal Playwright A/B investigation (see `tests/e2e/storybook/reorder.autoscroll.spec.ts`'s
 * external-order-mutation autoscroll test) disproved that theory: with the guard fully disabled, a
 * real text selection reliably formed and extended across the post-cancellation window, yet the
 * observed `scrollTop` settling after cancellation was statistically identical, in both shape and
 * magnitude, to runs where no selection ever formed. In every run, in both conditions, zero
 * additional library-issued `scrollBy`/`window.scrollBy` calls occurred after cancellation — the
 * settling is the browser's own scroll compositor finishing already-issued, already-correctly-
 * stopped scrolling over a few more frames, not a new scroll caused by selection or by anything
 * else post-cancellation. Do not reintroduce a post-cancel `selectstart` guard without new causal
 * evidence.
 */
import { RELEASE_WATCHER_SAFETY_TIMEOUT_MS } from './constants';

/** The removal fallback delay, chosen to run in the task after the pointerup event turn. */
const CLICK_SUPPRESSION_FALLBACK_MS = 0;

/** Identifies the original pointer a release watcher is waiting for. */
export interface ReleaseWatcherTarget {
  /** The reorder container the just-cancelled gesture occurred on. */
  containerEl: HTMLElement;
  /** The original session's pointer id. */
  pointerId: number;
}

/** The imperative controller for one `useReorder` instance's post-drag click suppression. */
export interface ClickSuppressionController {
  /**
   * Arms one-shot suppression for the next `click` dispatched on `containerEl`. Re-arming clears
   * any previously armed suppression or pending release watcher first. Call only when the
   * original pointer's physical release is known to have already happened (inside the
   * `pointerup` handler itself).
   * @param containerEl - The reorder container the just-ended drag gesture occurred on.
   */
  arm: (containerEl: HTMLElement) => void;
  /**
   * Starts a bounded watcher for `target`'s original pointer to physically release. Call when a
   * session is cancelled before that release is known to have happened. On a matching
   * `pointerup`, arms suppression as {@link arm} would. On a matching `pointercancel`, or once the
   * bounded safety timeout elapses, cleans up without arming suppression. Clears any previously
   * armed suppression or pending watcher first. See the module-level doc comment for why this does
   * not re-install a `selectstart`-prevention guard.
   * @param target - The original gesture's container and pointer id to watch for.
   */
  armReleaseWatcher: (target: ReleaseWatcherTarget) => void;
  /** Clears any pending suppression or release watcher immediately; safe when idle. */
  disarm: () => void;
}

/**
 * Creates one click-suppression controller, scoped to a single `useReorder` instance.
 * @returns The imperative `arm`/`armReleaseWatcher`/`disarm` controller.
 */
export const createClickSuppression = (): ClickSuppressionController => {
  let armedContainerEl: HTMLElement | null = null;
  let clickListener: ((event: MouseEvent) => void) | null = null;
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

  let releaseWatcher: {
    onPointerUp: (event: PointerEvent) => void;
    onPointerCancel: (event: PointerEvent) => void;
    safetyTimer: ReturnType<typeof setTimeout>;
  } | null = null;

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

    if (releaseWatcher) {
      window.removeEventListener('pointerup', releaseWatcher.onPointerUp);
      window.removeEventListener('pointercancel', releaseWatcher.onPointerCancel);
      clearTimeout(releaseWatcher.safetyTimer);
      releaseWatcher = null;
    }
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

  const armReleaseWatcher = ({ containerEl, pointerId }: ReleaseWatcherTarget): void => {
    disarm();

    const onPointerUp = (event: PointerEvent): void => {
      if (event.pointerId !== pointerId) return;
      arm(containerEl);
    };

    const onPointerCancel = (event: PointerEvent): void => {
      if (event.pointerId !== pointerId) return;
      disarm();
    };

    const safetyTimer = setTimeout(() => {
      disarm();
    }, RELEASE_WATCHER_SAFETY_TIMEOUT_MS);

    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);

    releaseWatcher = { onPointerUp, onPointerCancel, safetyTimer };
  };

  return { arm, armReleaseWatcher, disarm };
};
