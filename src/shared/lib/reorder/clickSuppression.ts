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
 * visibility loss, a second pointer, container removal, or another mid-gesture event) cannot use
 * that same immediate arm-and-fallback shape: the physical release may be arbitrarily far in the
 * future, well past one event-loop turn. For that case this module instead starts a minimal,
 * bounded release watcher that listens for the *original* pointer's own `pointerup`/`pointercancel`
 * and only arms suppression once that release actually happens (or gives up after a bounded
 * safety timeout, or once a matching `pointercancel` proves no click will ever follow).
 *
 * The same bounded window also re-installs the `selectstart`-prevention guard that
 * `activeSessionEffects.ts` owns during an active drag. Diagnosed via Playwright-only scroll
 * instrumentation (see `tests/e2e/storybook/reorder.spec.ts`'s external-order-mutation autoscroll
 * test): once a session cancels mid-gesture, `activeSessionEffects.dispose()` removes that guard
 * immediately, but the physical mouse button can still be down and stationary near the (former)
 * autoscroll edge; with the guard gone, Chromium's own native "extend a text selection near a
 * scrollable edge autoscrolls it" behavior can pick up and keep scrolling the container with zero
 * further library-issued `scrollBy` calls. Re-arming the same guard for this bounded window
 * prevents exactly that native behavior without reviving any part of the ended session.
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
   * armed suppression or pending watcher first. Also re-installs a `selectstart`-prevention guard
   * for the same bounded window, so native browser scrolling (Chromium's own drag-a-selection-
   * near-an-edge autoscroll) can't continue after the session's own guards are torn down while the
   * physical pointer is still down; see the module-level doc comment for the diagnosis.
   * @param target - The original gesture's container and pointer id to watch for.
   */
  armReleaseWatcher: (target: ReleaseWatcherTarget) => void;
  /** Clears any pending suppression, release watcher, or guard immediately; safe when idle. */
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

  /**
   * The bounded post-cancellation `selectstart` guard, installed only while a release watcher is
   * pending; see the module-level doc comment for why this specific guard is re-armed here.
   */
  let selectStartGuard: ((event: Event) => void) | null = null;

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

    if (selectStartGuard) {
      document.removeEventListener('selectstart', selectStartGuard);
      selectStartGuard = null;
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

    const guard = (event: Event): void => {
      event.preventDefault();
    };
    document.addEventListener('selectstart', guard);
    selectStartGuard = guard;

    releaseWatcher = { onPointerUp, onPointerCancel, safetyTimer };
  };

  return { arm, armReleaseWatcher, disarm };
};
