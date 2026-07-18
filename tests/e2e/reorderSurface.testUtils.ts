import { expect, type CDPSession, type Page } from '@playwright/test';

// Chromium tracks in-flight touch sequence state per CDP client: opening a fresh session for
// each dispatch call breaks a multi-event gesture ("Must send a TouchStart first"). Reuse one
// session per page for the whole gesture instead.
const cdpSessions = new WeakMap<Page, CDPSession>();

const getCdpSession = async (page: Page): Promise<CDPSession> => {
  const existing = cdpSessions.get(page);
  if (existing) return existing;

  const session = await page.context().newCDPSession(page);
  cdpSessions.set(page, session);
  return session;
};

/**
 * Dispatches one raw Chromium CDP touch event via the page's reused touch session. Reused across
 * scenarios needing raw touch sequences (long-press activation, pre-activation swipes).
 * @param page - The page to dispatch the touch event on.
 * @param type - The CDP touch event type.
 * @param point - Touch point coordinates; omitted for `touchEnd`.
 */
export const dispatchTouch = async (
  page: Page,
  type: 'touchStart' | 'touchMove' | 'touchEnd',
  point?: { x: number; y: number },
) => {
  const cdp = await getCdpSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: point ? [{ x: point.x, y: point.y }] : [],
  });
};

/**
 * Computes the center point of a bounding box.
 * @param box - The rectangle to find the center of.
 * @returns The center coordinates.
 */
export const center = (box: { x: number; y: number; width: number; height: number }) => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
});

/**
 * Finds a row's index by name substring match. The document's own default view row always
 * renders alongside any added views, so row order must be asserted relatively (by name) rather
 * than by fixed list index.
 * @param rows - Row text contents in current list order.
 * @param name - The row name to search for.
 * @returns The matching row's index, or -1 when not found.
 */
export const indexOfRow = (rows: string[], name: string) =>
  rows.findIndex((text) => text.includes(name));

/**
 * Samples a scrollable element's `scrollTop` across consecutive rendered animation frames. A real
 * autoscroll loop would increment `scrollTop` every single frame for as long as the pointer stays
 * near the edge, so comparing every sample (not just the last few) against a pre-hold baseline is
 * required to catch a scroll that happens first and then stops.
 * @param page - The page hosting the scrollable element, used to await animation frames.
 * @param scrollable - The scrollable element handle to sample.
 * @param frameCount - Number of consecutive animation frames to sample.
 * @returns The sampled `scrollTop` values, one per frame.
 */
export const sampleScrollTop = async (
  page: Page,
  scrollable: { evaluate: (fn: (el: HTMLElement) => number) => Promise<number> },
  frameCount = 12,
): Promise<number[]> => {
  const samples: number[] = [];
  for (let frame = 0; frame < frameCount; frame += 1) {
    // eslint-disable-next-line no-await-in-loop -- each frame must render before the next
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    // eslint-disable-next-line no-await-in-loop -- sampling must happen in order, one per frame
    samples.push(await scrollable.evaluate((el) => el.scrollTop));
  }
  return samples;
};

/**
 * Asserts that every sampled `scrollTop` value stays within tolerance of a baseline, catching a
 * scroll that happens first and later settles back, not just a mismatched tail sample.
 * @param samples - Sampled `scrollTop` values to check.
 * @param baseline - The expected `scrollTop` value the samples must hold at.
 */
export const assertScrollTopHoldsAtBaseline = (samples: number[], baseline: number): void => {
  for (const sample of samples) {
    expect(
      Math.abs(sample - baseline),
      `scrollTop samples: ${samples.join(', ')}, baseline: ${baseline}`,
    ).toBeLessThanOrEqual(1);
  }
};

/**
 * Waits for a scrollable element's `scrollTop` to hold steady across several consecutive polls,
 * not just one, before treating it as settled: a single matching poll pair can still land inside
 * an in-progress reposition (e.g. the bottom sheet's own ResizeObserver-driven watcher) on a
 * resource-constrained runner.
 * @param scrollable - The scrollable element handle to poll.
 * @param requiredStableReads - Number of consecutive matching reads required to consider it stable.
 * @returns The settled `scrollTop` value.
 */
export const waitForStableScrollTop = async (
  scrollable: { evaluate: (fn: (el: HTMLElement) => number) => Promise<number> },
  requiredStableReads = 3,
): Promise<number> => {
  let previous = await scrollable.evaluate((el) => el.scrollTop);
  let stableCount = 1;
  await expect
    .poll(
      async () => {
        const current = await scrollable.evaluate((el) => el.scrollTop);
        stableCount = current === previous ? stableCount + 1 : 1;
        previous = current;
        return stableCount >= requiredStableReads;
      },
      { timeout: 5000, intervals: [200] },
    )
    .toBe(true);
  return previous;
};
