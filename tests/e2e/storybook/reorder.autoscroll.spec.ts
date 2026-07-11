import { expect, test, type Page } from '@playwright/test';
import {
  boxOf,
  center,
  getCount,
  getDraggingKey,
  getLastDragEnd,
  getOrder,
  STORY_ID,
} from './reorder.testUtils';
import { openStory } from './storybook.testUtils';

/** One recorded native `Element.scrollBy`/`window.scrollBy` call, in call order. */
interface ReorderScrollLogEntry {
  /** The `data-testid` (or tag name fallback) of the scrolled element, or `'window'`. */
  target: string;
  left: number;
  top: number;
  beforeLeft: number;
  beforeTop: number;
  afterLeft: number;
  afterTop: number;
  /** Monotonic call order, assigned in-page. */
  seq: number;
  /** `performance.now()` at call time, comparable to `testReorderCancelledAtMs`. */
  timeMs: number;
}

/** One `document`-level `selectstart` observation. */
interface SelectStartLogEntry {
  defaultPrevented: boolean;
  timeMs: number;
}

declare global {
  interface Window {
    testReorderScrollLog?: ReorderScrollLogEntry[];
    testReorderCancelledAtMs?: number | null;
    testReorderSelectStartLog?: SelectStartLogEntry[];
  }
}

const BORDERED_VIEWPORT_STORY_ID =
  'shared-lib-reorder-reorderborderedviewportstoryharness--default';

/**
 * Mirrors `AUTOSCROLL_MAX_SPEED_PX_PER_SEC` and `AUTOSCROLL_EDGE_ZONE_PX` from `constants.ts`.
 * Kept local since Playwright specs run outside the Vite alias graph; used only to derive
 * generous-but-bounded poll budgets and edge-zone preconditions below, never to assert an exact
 * scroll rate.
 */
const AUTOSCROLL_MAX_SPEED_PX_PER_SEC = 900;
const AUTOSCROLL_EDGE_ZONE_PX = 56;

/**
 * A poll budget, in ms, generous enough for a real autoscroll covering `extentPx` to finish even
 * under heavy CI/single-worker CPU contention, without resorting to a blanket multi-minute
 * timeout.
 * @param extentPx - The scroll distance the phase must cover.
 * @returns The poll timeout, in ms, to use for that phase.
 */
const autoscrollBudgetMs = (extentPx: number): number =>
  Math.max(4000, Math.ceil((extentPx / AUTOSCROLL_MAX_SPEED_PX_PER_SEC) * 1000 * 6) + 2000);

/**
 * Installs Playwright-only instrumentation that records every native `Element.scrollBy`/
 * `window.scrollBy` call (target identity, requested delta, before/after position, and a
 * monotonic timestamp), plus the timestamp `onDragEnd(cancelled: true)` first becomes observable
 * in the DOM. Must be installed before the story navigates so the wrap is already in place before
 * any library code runs; the caller is responsible for (re)navigating afterward.
 * @param page - The Playwright page to instrument.
 * @returns A promise that resolves once the instrumentation script is registered.
 */
const installScrollInstrumentation = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    window.testReorderScrollLog = [];
    window.testReorderCancelledAtMs = null;
    window.testReorderSelectStartLog = [];
    let seq = 0;

    const targetIdentity = (element: Element): string =>
      element.getAttribute('data-testid') ?? element.tagName;

    document.addEventListener('selectstart', (event) => {
      window.testReorderSelectStartLog?.push({
        defaultPrevented: event.defaultPrevented,
        timeMs: performance.now(),
      });
    });

    // Captured before the prototype is patched below, so the wrapper below can still call
    // through to real scrolling; always invoked with an explicit receiver via `.call`, never as a
    // bare unbound reference. `.call`/`.apply` only type-check against the last overload of an
    // overloaded function, so each call shape gets its own single-signature typed view of the
    // same native method rather than one broadly-typed reference.
    type NativeScrollByOptions = (this: Element, options?: ScrollToOptions) => void;
    type NativeScrollByXY = (this: Element, x: number, y: number) => void;
    // oxlint-disable-next-line unbound-method -- stored only to call via `.call(this, ...)` below.
    const nativeElementScrollByOptions: NativeScrollByOptions = Element.prototype.scrollBy;
    // oxlint-disable-next-line unbound-method -- stored only to call via `.call(this, ...)` below.
    const nativeElementScrollByXY: NativeScrollByXY = Element.prototype.scrollBy;

    function patchedElementScrollBy(this: Element, options?: ScrollToOptions): void;
    function patchedElementScrollBy(this: Element, x: number, y: number): void;
    function patchedElementScrollBy(
      this: Element,
      xOrOptions?: number | ScrollToOptions,
      y?: number,
    ): void {
      const beforeLeft = this.scrollLeft;
      const beforeTop = this.scrollTop;
      let left: number;
      let top: number;
      if (typeof xOrOptions === 'object') {
        nativeElementScrollByOptions.call(this, xOrOptions);
        left = xOrOptions.left ?? 0;
        top = xOrOptions.top ?? 0;
      } else {
        nativeElementScrollByXY.call(this, xOrOptions ?? 0, y ?? 0);
        left = xOrOptions ?? 0;
        top = y ?? 0;
      }
      window.testReorderScrollLog?.push({
        target: targetIdentity(this),
        left,
        top,
        beforeLeft,
        beforeTop,
        afterLeft: this.scrollLeft,
        afterTop: this.scrollTop,
        seq: seq++,
        timeMs: performance.now(),
      });
    }
    Element.prototype.scrollBy = patchedElementScrollBy;

    // Global `scrollBy` needs no receiver binding, only wrapping; called directly below.
    const nativeWindowScrollBy = window.scrollBy;

    function patchedWindowScrollBy(options?: ScrollToOptions): void;
    function patchedWindowScrollBy(x: number, y: number): void;
    function patchedWindowScrollBy(xOrOptions?: number | ScrollToOptions, y?: number): void {
      const beforeLeft = window.scrollX;
      const beforeTop = window.scrollY;
      let left: number;
      let top: number;
      if (typeof xOrOptions === 'object') {
        nativeWindowScrollBy(xOrOptions);
        left = xOrOptions.left ?? 0;
        top = xOrOptions.top ?? 0;
      } else {
        nativeWindowScrollBy(xOrOptions ?? 0, y ?? 0);
        left = xOrOptions ?? 0;
        top = y ?? 0;
      }
      window.testReorderScrollLog?.push({
        target: 'window',
        left,
        top,
        beforeLeft,
        beforeTop,
        afterLeft: window.scrollX,
        afterTop: window.scrollY,
        seq: seq++,
        timeMs: performance.now(),
      });
    }
    window.scrollBy = patchedWindowScrollBy;

    const isCancelledPayload = (value: unknown): boolean =>
      typeof value === 'object' &&
      value !== null &&
      'cancelled' in value &&
      value.cancelled === true;

    const observeCancellation = (): void => {
      const el = document.querySelector('[data-testid="reorder-last-drag-end"]');
      if (!el) {
        requestAnimationFrame(observeCancellation);
        return;
      }
      const check = (): void => {
        if (window.testReorderCancelledAtMs !== null) return;
        try {
          const parsed: unknown = JSON.parse(el.textContent || 'null');
          if (isCancelledPayload(parsed)) window.testReorderCancelledAtMs = performance.now();
        } catch {
          // Not yet valid JSON (initial empty text); wait for the next mutation.
        }
      };
      new MutationObserver(check).observe(el, {
        childList: true,
        characterData: true,
        subtree: true,
      });
      check();
    };
    requestAnimationFrame(observeCancellation);
  });
};

const getScrollLog = (page: Page): Promise<ReorderScrollLogEntry[]> =>
  page.evaluate(() => window.testReorderScrollLog ?? []);

const getCancelledAtMs = (page: Page): Promise<number | null> =>
  page.evaluate(() => window.testReorderCancelledAtMs ?? null);

const getSelectStartLog = (page: Page): Promise<SelectStartLogEntry[]> =>
  page.evaluate(() => window.testReorderSelectStartLog ?? []);

test.beforeEach(async ({ page }) => {
  await openStory(page, STORY_ID);
});

test.describe('autoscroll', () => {
  test('scrolls the reorder container itself near its edge', async ({ page }) => {
    const container = page.getByTestId('reorder-container');
    const containerBox = await boxOf(container);
    const scrollTopBefore = await container.evaluate((el) => el.scrollTop);

    const from = center(await boxOf(page.getByTestId('reorder-item-alpha')));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x, containerBox.y + containerBox.height - 4, { steps: 6 });

    await expect
      .poll(() => container.evaluate((el) => el.scrollTop), { timeout: 3000 })
      .toBeGreaterThan(scrollTopBefore);

    await page.mouse.up();
  });

  test('continues scrolling with a stationary pointer and falls through to the scrollable ancestor once the container hits its limit', async ({
    page,
  }) => {
    const container = page.getByTestId('reorder-container');
    const scrollAncestor = page.getByTestId('reorder-scroll-ancestor');
    const containerBox = await boxOf(container);

    const containerExtent = await container.evaluate((el) => el.scrollHeight - el.clientHeight);
    const ancestorExtentBefore = await scrollAncestor.evaluate(
      (el) => el.scrollHeight - el.clientHeight,
    );

    // Preconditions: both the container and its scrollable ancestor must have real scroll room.
    expect(containerExtent).toBeGreaterThan(0);
    expect(ancestorExtentBefore).toBeGreaterThan(0);

    // Two sequential real-time-bound autoscroll phases, each with its own generous poll budget
    // derived from the harness's real scroll extents; the outer test timeout comfortably exceeds
    // their sum (rather than sitting flush against it) so real single-worker CPU contention
    // delaying one phase can't silently truncate the other.
    test.setTimeout(
      autoscrollBudgetMs(containerExtent) * 2 + autoscrollBudgetMs(ancestorExtentBefore) + 5000,
    );

    const from = center(await boxOf(page.getByTestId('reorder-item-alpha')));
    const containerEdgeY = containerBox.y + containerBox.height - 4;
    expect(containerBox.y + containerBox.height - containerEdgeY).toBeLessThan(
      AUTOSCROLL_EDGE_ZONE_PX,
    );

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x, containerEdgeY, { steps: 6 });

    // Phase 1: the inner container scrolls.
    const containerScrollTopBefore = await container.evaluate((el) => el.scrollTop);
    await expect
      .poll(() => container.evaluate((el) => el.scrollTop), {
        timeout: autoscrollBudgetMs(containerExtent),
      })
      .toBeGreaterThan(containerScrollTopBefore);

    // Phase 2: the inner container reaches its own scroll limit while the pointer stays put
    // (stationary-pointer autoscroll).
    await expect
      .poll(
        () =>
          container.evaluate((el) => Math.abs(el.scrollTop - (el.scrollHeight - el.clientHeight))),
        { timeout: autoscrollBudgetMs(containerExtent) },
      )
      .toBeLessThanOrEqual(2);
    const containerScrollTopAtLimit = await container.evaluate((el) => el.scrollTop);

    // Phase 3: record the ancestor's own scroll position before falling through to it, and prove
    // it genuinely retains scroll room of its own now that the inner container has none left.
    const ancestorScrollTopBefore = await scrollAncestor.evaluate((el) => el.scrollTop);
    expect(ancestorExtentBefore - ancestorScrollTopBefore).toBeGreaterThan(0);

    // Phase 4: move the pointer into the ancestor's own edge zone so the chain falls through once
    // the inner container can no longer scroll.
    const ancestorBox = await boxOf(scrollAncestor);
    const ancestorEdgeY = ancestorBox.y + ancestorBox.height - 4;
    expect(ancestorBox.y + ancestorBox.height - ancestorEdgeY).toBeLessThan(
      AUTOSCROLL_EDGE_ZONE_PX,
    );
    await page.mouse.move(from.x, ancestorEdgeY, { steps: 4 });

    // Phase 5: the ancestor scrolls while the inner container stays at its own limit.
    await expect
      .poll(() => scrollAncestor.evaluate((el) => el.scrollTop), {
        timeout: autoscrollBudgetMs(ancestorExtentBefore),
      })
      .toBeGreaterThan(ancestorScrollTopBefore);
    expect(await container.evaluate((el) => el.scrollTop)).toBe(containerScrollTopAtLimit);

    await page.mouse.up();
  });

  test('a pointer beyond the visible edge continues intuitive autoscroll and eventually causes a reorder', async ({
    page,
  }) => {
    test.setTimeout(60000);

    const container = page.getByTestId('reorder-container');
    const containerBox = await boxOf(container);
    const scrollTopBefore = await container.evaluate((el) => el.scrollTop);
    const orderBefore = await getOrder(page);

    const from = center(await boxOf(page.getByTestId('reorder-item-alpha')));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    // Move well past the container's bottom edge, outside its visible bounds.
    await page.mouse.move(from.x, containerBox.y + containerBox.height + 60, { steps: 6 });

    await expect
      .poll(() => container.evaluate((el) => el.scrollTop), { timeout: 3000 })
      .toBeGreaterThan(scrollTopBefore);

    expect(await getDraggingKey(page)).toBe('alpha');

    // Keep the pointer beyond the edge long enough for autoscroll to bring another item under it
    // and for the geometry-based hit test to actually request a reorder.
    await expect.poll(() => getOrder(page), { timeout: 20000 }).not.toEqual(orderBefore);

    await page.mouse.up();
  });

  test('an external order mutation while autoscrolling cancels before any further library scroll write, with no selection involvement, and the container settles to a stable position', async ({
    page,
  }) => {
    // Instrumentation must be installed and the story navigated with it in place before the
    // gesture starts, so every native scrollBy call the library could possibly make is captured.
    await installScrollInstrumentation(page);
    await openStory(page, STORY_ID);

    const container = page.getByTestId('reorder-container');
    const containerBox = await boxOf(container);
    const scrollTopBefore = await container.evaluate((el) => el.scrollTop);

    // Precondition: real scroll room must exist, otherwise "scrolling has begun" below would be
    // vacuously satisfied.
    const containerExtent = await container.evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(containerExtent).toBeGreaterThan(0);

    const from = center(await boxOf(page.getByTestId('reorder-item-alpha')));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x, containerBox.y + containerBox.height - 4, { steps: 6 });

    // 1. Confirm autoscroll has actually begun before triggering the external mutation.
    await expect
      .poll(() => container.evaluate((el) => el.scrollTop), {
        timeout: autoscrollBudgetMs(containerExtent),
      })
      .toBeGreaterThan(scrollTopBefore);

    // 2. Trigger the external, non-library-issued order mutation.
    await page.getByTestId('reorder-control-reverse-order').evaluate((el: HTMLElement) => {
      el.click();
    });

    // 3. Wait for exactly one cancelled onDragEnd.
    await expect.poll(() => getCount(page, 'reorder-drag-end-count'), { timeout: 10000 }).toBe(1);
    const lastDragEnd = await getLastDragEnd(page);
    expect(lastDragEnd?.cancelled).toBe(true);

    const cancelledAtMs = await getCancelledAtMs(page);
    expect(cancelledAtMs).not.toBeNull();

    // 4. Wait for the container to settle: a causal A/B investigation (guard-disabled Control A,
    // reproducing a real, confirmed text selection via `selectionchange`/`rangeCount`, vs.
    // guard-enabled Control B, with zero selection activity) found the `scrollTop` reported right
    // at cancellation is not yet final — it keeps climbing toward its eventual resting value for a
    // further handful of animation frames, statistically identically in both conditions. That
    // rules out Chromium's native "extend a selection near a scrollable edge autoscrolls it"
    // behavior as the cause: it never correlates with whether a selection exists. A further
    // controlled investigation (`reorder.postCancellationScrollDiagnosis.spec.ts`) also ruled out
    // CSS scroll anchoring (the same zero-further-`scrollBy` result reproduces with
    // `overflow-anchor: none` and even with no DOM reorder at all) and a literal
    // `scroll-behavior: smooth` interaction (`getComputedStyle` stays `'auto'`). No further
    // library-issued `scrollBy` call is ever timestamped after cancellation in any of those
    // conditions, so this is not a library or CSS-driven scroll; a more specific cause is not
    // claimed here, since it could not be distinguished from lag in this test's own
    // DOM-mutation-based "cancelled" observation. Poll for two consecutive equal readings, bounded
    // well above the settling window observed in that investigation (well under 200ms), before
    // treating the position as final.
    let previousScrollTop = await container.evaluate((el) => el.scrollTop);
    await expect
      .poll(
        async () => {
          const current = await container.evaluate((el) => el.scrollTop);
          const stable = current === previousScrollTop;
          previousScrollTop = current;
          return stable;
        },
        { timeout: 2000, intervals: [30] },
      )
      .toBe(true);
    const scrollTopAfterSettle = previousScrollTop;

    // 5/6. Keep the physical mouse button down and observe both the real scroll position and the
    // instrumented call log across several more real animation frames, well past settling.
    await page.waitForTimeout(300);

    const scrollLog = await getScrollLog(page);
    const writesAfterCancellation = scrollLog.filter(
      (entry) => cancelledAtMs !== null && entry.timeMs > cancelledAtMs,
    );
    const selectStartAfterCancellation = (await getSelectStartLog(page)).filter(
      (entry) => cancelledAtMs !== null && entry.timeMs > cancelledAtMs,
    );

    // No library-issued scroll write occurs after cancellation: `processActiveFrame` in
    // `PointerSession.ts` runs the controlled-order mutation check before any autoscroll write
    // each frame, and `cancelSession` clears `session` synchronously, so `scheduleFrame`'s own
    // `session` guard prevents any further frame (queued or reentrant) from running at all.
    expect(writesAfterCancellation).toEqual([]);
    // Selection is never even attempted: the active-drag guard in `activeSessionEffects.ts` is
    // still installed at the moment of cancellation (it is only removed as part of this same
    // synchronous cancellation), so no `selectstart` reaches the document during this test.
    expect(selectStartAfterCancellation).toEqual([]);
    // Once settled, the position stays exactly there: no ongoing scroll of any kind remains.
    expect(await container.evaluate((el) => el.scrollTop)).toBe(scrollTopAfterSettle);

    // 7. Release the pointer only after every observation above has completed.
    await page.mouse.up();
  });

  test.describe('viewport fallback', () => {
    test.use({ viewport: { width: 500, height: 320 } });

    test.beforeEach(async ({ page }) => {
      // Restore ordinary document-level scroll semantics for only this scenario: the product app
      // shell (imported globally into Storybook for design tokens) fixes html/body to a bounded
      // height, which turns body into its own internal scroll container and leaves
      // `window.scrollY` permanently at 0. Scoped to this page only; reverted automatically by
      // Playwright's per-test page isolation, so no other story or visual test is affected.
      await page.addStyleTag({
        content: 'html, body { height: auto; min-height: 100%; overflow: visible; }',
      });
    });

    test('falls back to the page viewport once the container and its scrollable ancestor are both exhausted', async ({
      page,
    }) => {
      const container = page.getByTestId('reorder-container');
      const scrollAncestor = page.getByTestId('reorder-scroll-ancestor');

      const containerExtent = await container.evaluate((el) => el.scrollHeight - el.clientHeight);
      const ancestorExtent = await scrollAncestor.evaluate(
        (el) => el.scrollHeight - el.clientHeight,
      );
      const documentExtent = await page.evaluate(() => {
        const scrollingElement = document.scrollingElement ?? document.documentElement;
        return scrollingElement.scrollHeight - window.innerHeight;
      });

      // Preconditions: the isolated document-scroll setup above must actually produce a
      // genuinely scrollable viewport, on top of a scrollable inner container and ancestor;
      // otherwise "window.scrollY increases" below would be structurally unreachable regardless
      // of production behavior.
      expect(containerExtent).toBeGreaterThan(0);
      expect(ancestorExtent).toBeGreaterThan(0);
      expect(documentExtent).toBeGreaterThan(0);

      const viewportSize = page.viewportSize();
      if (!viewportSize) throw new Error('missing viewport size');
      // A fixed point near the window's own bottom edge, in viewport-relative coordinates (stable
      // regardless of document scroll position), so the pointer stays inside the viewport's own
      // edge zone for the whole gesture without depending on item/container geometry.
      const pointerEdgeY = viewportSize.height - 4;
      expect(viewportSize.height - pointerEdgeY).toBeLessThan(AUTOSCROLL_EDGE_ZONE_PX);

      const item = page.getByTestId('reorder-item-alpha');
      // `boxOf` calls `scrollIntoViewIfNeeded`, which can itself use real document scrolling to
      // bring the item into view under this small viewport; the baseline below is read after
      // that settles, but still well before the gesture (and any autoscroll) starts.
      const from = center(await boxOf(item));

      // Captured now, right before the gesture starts, not after the container/ancestor phases:
      // the viewport chain entry can already become eligible and start progressing while a later
      // phase's poll is still waiting on an earlier chain entry, so a baseline read after those
      // phases could already be maxed out.
      const pageScrollBefore = await page.evaluate(() => window.scrollY);

      // Three sequential real-time-bound autoscroll phases, each with its own generous poll
      // budget derived from the harness's real scroll extents; the outer test timeout
      // comfortably exceeds their sum (rather than sitting flush against it) so real
      // single-worker CPU contention delaying one phase can't silently truncate a later one.
      test.setTimeout(
        autoscrollBudgetMs(containerExtent) +
          autoscrollBudgetMs(ancestorExtent) +
          autoscrollBudgetMs(documentExtent) +
          5000,
      );

      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      // The pointer stays fixed at this viewport-edge point for the remainder of the gesture, so
      // it remains inside the viewport's own edge zone throughout every phase below.
      await page.mouse.move(from.x, pointerEdgeY, { steps: 6 });

      // Phase 1: the inner container reaches its own scroll limit.
      await expect
        .poll(
          () =>
            container.evaluate((el) =>
              Math.abs(el.scrollTop - (el.scrollHeight - el.clientHeight)),
            ),
          { timeout: autoscrollBudgetMs(containerExtent) },
        )
        .toBeLessThanOrEqual(2);

      // Phase 2: the ancestor reaches its own scroll limit.
      await expect
        .poll(
          () =>
            scrollAncestor.evaluate((el) =>
              Math.abs(el.scrollTop - (el.scrollHeight - el.clientHeight)),
            ),
          { timeout: autoscrollBudgetMs(ancestorExtent) },
        )
        .toBeLessThanOrEqual(2);

      // Phase 3: the chain falls through to real `window.scrollY` movement, not a `body`
      // internal scroll container.
      await expect
        .poll(() => page.evaluate(() => window.scrollY), {
          timeout: autoscrollBudgetMs(documentExtent),
        })
        .toBeGreaterThan(pageScrollBefore);
      expect(await page.evaluate(() => document.body.scrollTop)).toBe(0);

      await page.mouse.up();
    });
  });
});

test.describe('bordered client viewport autoscroll', () => {
  test('autoscroll activation is measured from the client viewport, excluding the container border', async ({
    page,
  }) => {
    await openStory(page, BORDERED_VIEWPORT_STORY_ID);

    const container = page.getByTestId('reorder-bordered-viewport-container');
    const containerBox = await boxOf(container);
    const scrollTopBefore = await container.evaluate((el) => el.scrollTop);

    const item = page.getByTestId('reorder-bordered-viewport-item-one');
    const from = center(await boxOf(item));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    // A 100px border surrounds this container's 200px client (content) viewport, and the
    // autoscroll edge zone is 56px. This move lands the pointer 70px inside the container's own
    // border-box bottom edge — already past a border-box-measured 56px edge zone (so a regression
    // to measuring from the border box would see no autoscroll at all here) — but still 30px short
    // of the true client-viewport bottom edge, i.e. beyond it entirely once the border is
    // correctly excluded, which must autoscroll (downward, where scroll room actually exists)
    // at once.
    await page.mouse.move(
      containerBox.x + containerBox.width / 2,
      containerBox.y + containerBox.height - 70,
      { steps: 8 },
    );

    await expect
      .poll(() => container.evaluate((el) => el.scrollTop), { timeout: 3000 })
      .toBeGreaterThan(scrollTopBefore);

    await page.mouse.up();
  });
});
