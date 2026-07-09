import type { Page } from '@playwright/test';
import type { Point } from './coordinates';

/** Tuning for {@link performCdpTouchLongPressDrag}. */
export interface CdpTouchLongPressDragOptions {
  /**
   * Wall-clock wait after touch-down before the first move, covering the drag engine's
   * long-press delay plus a small safety margin. Reproduces the required press
   * duration for touch activation; it is not a flakiness workaround.
   */
  pressDelayMs?: number;
  /** Intermediate touchmove samples dispatched between start and end. */
  steps?: number;
  /** Wall-clock pause between successive touchmove samples. */
  stepDelayMs?: number;
  /**
   * Wall-clock pause at the drop point before touch-end. The drag engine's fallback
   * hit-testing polls the pointer position on a fixed interval rather than reacting
   * synchronously to each move event, so the pointer must rest at the target for at
   * least one poll tick before release for the engine to observe and commit the move.
   */
  settleMs?: number;
}

const DEFAULT_OPTIONS: Required<CdpTouchLongPressDragOptions> = {
  pressDelayMs: 220,
  steps: 10,
  stepDelayMs: 20,
  settleMs: 150,
};

/** Stable synthetic touch identifier reused across one gesture's touchStart/Move/End. */
const TOUCH_ID = 1;

/**
 * Performs a real touch long-press-then-drag gesture using the Chromium DevTools
 * Protocol's `Input.dispatchTouchEvent`, the same mechanism Playwright's own touch
 * actions use internally, rather than synthetic `dispatchEvent(new TouchEvent(...))`
 * from inside the page. Requires a Chromium-based browser context; throws immediately
 * on any other engine so a misuse fails fast instead of silently no-op-ing.
 * @param page - Page to drive the gesture on.
 * @param from - Touch-start coordinate (row center).
 * @param to - Touch-end coordinate (drop target center).
 * @param options - Gesture tuning.
 */
export const performCdpTouchLongPressDrag = async (
  page: Page,
  from: Point,
  to: Point,
  options: CdpTouchLongPressDragOptions = {},
) => {
  const browserName = page.context().browser()?.browserType().name();

  if (browserName !== 'chromium') {
    throw new Error(
      `performCdpTouchLongPressDrag requires a Chromium-based browser context (got "${browserName}")`,
    );
  }

  const { pressDelayMs, steps, stepDelayMs, settleMs } = { ...DEFAULT_OPTIONS, ...options };
  const client = await page.context().newCDPSession(page);

  try {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: from.x, y: from.y, id: TOUCH_ID }],
    });

    await page.waitForTimeout(pressDelayMs);

    for (let step = 1; step <= steps; step += 1) {
      const x = from.x + ((to.x - from.x) * step) / steps;
      const y = from.y + ((to.y - from.y) * step) / steps;

      // eslint-disable-next-line no-await-in-loop -- each sample must settle in order
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y, id: TOUCH_ID }],
      });
      // eslint-disable-next-line no-await-in-loop -- each sample must settle in order
      await page.waitForTimeout(stepDelayMs);
    }

    await page.waitForTimeout(settleMs);

    await client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
  } finally {
    await client.detach();
  }
};
