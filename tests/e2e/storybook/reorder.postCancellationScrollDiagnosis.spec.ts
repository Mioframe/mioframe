import { expect, test, type Page } from '@playwright/test';
import { boxOf, center, getCount, getLastDragEnd, getOrder, STORY_ID } from './reorder.testUtils';
import { openStory } from './storybook.testUtils';

/**
 * Controlled diagnostics for the reorder container's `scrollTop` still appearing to move for a
 * handful of frames after `onDragEnd(cancelled: true)` becomes observable, first noticed by
 * `reorder.autoscroll.spec.ts`'s external-order-mutation autoscroll test. Three controls, all
 * driving that same autoscroll gesture, isolate the mechanism:
 *
 * - Control A: current behavior (default `overflow-anchor`, cancellation via an external DOM
 *   reorder).
 * - Control B: same gesture, with `overflow-anchor: none` applied test-locally to the reorder
 *   container — isolates CSS scroll anchoring specifically.
 * - Control C: cancellation via `Escape` instead of an external DOM reorder, so the controlled
 *   item order never changes — isolates whether a DOM reorder is required at all.
 *
 * All three controls prove the one invariant that actually matters for the library's contract,
 * using a timestamped in-page log rather than a before/after counter diff (a counter read racing
 * a Node-side `await` round trip can land after calls already happened, making a diff vacuously
 * zero regardless of what actually occurred): no library-issued `scrollBy` call is ever timestamped
 * after the cancellation is observed, in any of the three conditions. That rules out CSS scroll
 * anchoring as something the library itself would need to compensate for (Control C reproduces the
 * same zero-further-calls result with no DOM reorder at all) and rules out a literal CSS
 * `scroll-behavior: smooth` interaction (`getComputedStyle` stays `'auto'` in every control).
 *
 * What these controls do *not* establish is a specific cause for the residual visual `scrollTop`
 * movement itself: earlier attempts to attribute it to a named browser mechanism (compositor
 * "settling", continuing an already-issued operation) could not be distinguished from an artifact
 * of how this test observes "cancelled" — a Vue-rendered DOM text mutation, whose own scheduling
 * can lag the library's real synchronous stop under heavy same-frame work — from genuinely
 * continued scrolling. Per the project's diagnosis rules, an explanation that cannot be
 * distinguished from measurement lag is not claimed here. See `reorder.autoscroll.spec.ts` and this
 * module's `README.md`/`clickSuppression.ts` for the resulting documented contract.
 *
 * All diagnostics here are test-only: no production code, story, or harness style is changed by
 * this file.
 */

/** One native `scrollBy` call the library issued on the reorder container. */
interface LibraryScrollByLogEntry {
  timeMs: number;
  delta: number;
}

declare global {
  interface Window {
    testReorderCancelledAtMs?: number | null;
    testReorderLibraryScrollByLog?: LibraryScrollByLogEntry[];
  }
}

const AUTOSCROLL_MAX_SPEED_PX_PER_SEC = 900;

/**
 * A poll budget, in ms, generous enough for a real autoscroll covering `extentPx` to finish even
 * under heavy CI/single-worker CPU contention. Mirrors `reorder.autoscroll.spec.ts`'s own budget;
 * duplicated locally so this diagnostics file has no non-test-utility coupling to that spec.
 * @param extentPx - The scroll distance the phase must cover.
 * @returns The poll timeout, in ms, to use for that phase.
 */
const autoscrollBudgetMs = (extentPx: number): number =>
  Math.max(4000, Math.ceil((extentPx / AUTOSCROLL_MAX_SPEED_PX_PER_SEC) * 1000 * 6) + 2000);

/**
 * Installs test-only instrumentation: an optional test-local `overflow-anchor: none` override for
 * the reorder container (Control B), a timestamped native `scrollBy` call log, and the same
 * `onDragEnd(cancelled: true)` timestamp observer used by `reorder.autoscroll.spec.ts`. Installed
 * via `addInitScript` so every piece is registered before the story's own script runs.
 *
 * The `overflow-anchor` override is applied as an inline style directly on the container element
 * the first time that element resolves, rather than by appending a `<style>` element at the very
 * first `addInitScript` tick: `document.documentElement` is not reliably available that early, and
 * appending to it there silently aborted the rest of this script (losing every other piece of
 * instrumentation, including cancellation detection) the first time this was tried. Resolving
 * against the container element itself is still guaranteed to land well before the gesture starts
 * or any scroll offset changes.
 * @param page - The Playwright page to instrument.
 * @param options - `disableOverflowAnchor` installs the Control B style override.
 * @returns A promise that resolves once the instrumentation script is registered.
 */
const installDiagnosticsInstrumentation = async (
  page: Page,
  options: { disableOverflowAnchor?: boolean } = {},
): Promise<void> => {
  const disableOverflowAnchor = options.disableOverflowAnchor ?? false;

  await page.addInitScript(
    ({ disableOverflowAnchor: shouldDisableAnchor }) => {
      window.testReorderCancelledAtMs = null;
      window.testReorderLibraryScrollByLog = [];

      // Captured before the prototype is patched below, so the wrapper can still call through to
      // real scrolling; `.call`/`.apply` only type-check against the last overload of an
      // overloaded function, so each call shape gets its own single-signature typed view — same
      // approach as `reorder.autoscroll.spec.ts`'s own `scrollBy` instrumentation.
      type NativeScrollByOptions = (this: Element, options?: ScrollToOptions) => void;
      type NativeScrollByXY = (this: Element, x: number, y: number) => void;
      // oxlint-disable-next-line unbound-method -- stored only to call via `.call(this, ...)`.
      const nativeScrollByOptions: NativeScrollByOptions = Element.prototype.scrollBy;
      // oxlint-disable-next-line unbound-method -- stored only to call via `.call(this, ...)`.
      const nativeScrollByXY: NativeScrollByXY = Element.prototype.scrollBy;

      function patchedScrollBy(this: Element, options?: ScrollToOptions): void;
      function patchedScrollBy(this: Element, x: number, y: number): void;
      function patchedScrollBy(
        this: Element,
        xOrOptions?: number | ScrollToOptions,
        y?: number,
      ): void {
        // Timestamped entirely in-page (the same clock `testReorderCancelledAtMs` uses), so
        // comparing this log against a cancellation timestamp later never depends on when a
        // Node-side `page.evaluate()` round trip happens to land.
        window.testReorderLibraryScrollByLog?.push({
          timeMs: performance.now(),
          delta: typeof xOrOptions === 'object' ? (xOrOptions.top ?? 0) : (y ?? 0),
        });
        if (typeof xOrOptions === 'object') {
          nativeScrollByOptions.call(this, xOrOptions);
        } else {
          nativeScrollByXY.call(this, xOrOptions ?? 0, y ?? 0);
        }
      }
      Element.prototype.scrollBy = patchedScrollBy;

      if (shouldDisableAnchor) {
        const applyAnchorOverride = (): void => {
          const el = document.querySelector<HTMLElement>('[data-testid="reorder-container"]');
          if (!el) {
            requestAnimationFrame(applyAnchorOverride);
            return;
          }
          el.style.setProperty('overflow-anchor', 'none');
        };
        requestAnimationFrame(applyAnchorOverride);
      }

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
    },
    { disableOverflowAnchor },
  );
};

/** One control run's captured diagnostic evidence. */
interface ControlResult {
  /** The container's computed `scroll-behavior` at the moment cancellation was observed. */
  scrollBehaviorAtCancellation: string;
  /** Every library-issued `scrollBy` call timestamped strictly after cancellation was observed. */
  scrollByCallsAfterCancellation: LibraryScrollByLogEntry[];
  /** Whether the controlled order at settle differs from its order before the gesture started. */
  orderChangedFromGestureStart: boolean;
}

/**
 * Drives the shared external-order-mutation autoscroll gesture used by
 * `reorder.autoscroll.spec.ts`, cancelling it either via an external DOM reorder or via `Escape`,
 * and returns the captured post-cancellation evidence.
 * @param page - The Playwright page to drive (must already have
 * {@link installDiagnosticsInstrumentation} installed).
 * @param cancelMethod - `'external-reorder'` clicks the story's reverse-order control (mutates the
 * controlled DOM order); `'escape'` presses Escape (no DOM order change).
 * @returns The captured control evidence.
 */
const runCancellationControl = async (
  page: Page,
  cancelMethod: 'external-reorder' | 'escape',
): Promise<ControlResult> => {
  await openStory(page, STORY_ID);
  const orderBeforeGesture = await getOrder(page);

  const container = page.getByTestId('reorder-container');
  const containerBox = await boxOf(container);
  const scrollTopBefore = await container.evaluate((el) => el.scrollTop);
  const containerExtent = await container.evaluate((el) => el.scrollHeight - el.clientHeight);
  expect(containerExtent).toBeGreaterThan(0);

  const from = center(await boxOf(page.getByTestId('reorder-item-alpha')));

  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x, containerBox.y + containerBox.height - 4, { steps: 6 });

  await expect
    .poll(() => container.evaluate((el) => el.scrollTop), {
      timeout: autoscrollBudgetMs(containerExtent),
    })
    .toBeGreaterThan(scrollTopBefore);

  if (cancelMethod === 'external-reorder') {
    await page.getByTestId('reorder-control-reverse-order').evaluate((el: HTMLElement) => {
      el.click();
    });
  } else {
    await page.keyboard.press('Escape');
  }

  await expect.poll(() => getCount(page, 'reorder-drag-end-count'), { timeout: 10000 }).toBe(1);
  const lastDragEnd = await getLastDragEnd(page);
  expect(lastDragEnd?.cancelled).toBe(true);

  const cancelledAtMs = await page.evaluate(() => window.testReorderCancelledAtMs ?? null);
  expect(cancelledAtMs).not.toBeNull();
  if (cancelledAtMs === null) throw new Error('unreachable: asserted not null above');

  const scrollBehaviorAtCancellation = await container.evaluate(
    (el) => getComputedStyle(el).scrollBehavior,
  );

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

  // Keep observing for a further real-time window, well past settling, before releasing.
  await page.waitForTimeout(300);

  const orderAfterSettle = await getOrder(page);

  // Fetched once, at the end, as a single timestamped log rather than a before/after counter
  // diff: a counter read racing an `await` round trip can land after calls already happened,
  // making a diff read vacuously zero regardless of whether calls actually occurred after
  // cancellation. Comparing already-recorded in-page timestamps against `cancelledAtMs` (the same
  // in-page clock) is immune to when this fetch itself happens to execute.
  const scrollByLog = await page.evaluate(() => window.testReorderLibraryScrollByLog ?? []);
  const scrollByCallsAfterCancellation = scrollByLog.filter(
    (entry) => entry.timeMs > cancelledAtMs,
  );

  await page.mouse.up();

  return {
    scrollBehaviorAtCancellation,
    scrollByCallsAfterCancellation,
    orderChangedFromGestureStart:
      JSON.stringify(orderBeforeGesture) !== JSON.stringify(orderAfterSettle),
  };
};

test.describe('post-cancellation scroll diagnosis', () => {
  test('control A: default overflow-anchor, cancellation via an external DOM reorder issues no library scrollBy after cancellation', async ({
    page,
  }) => {
    await installDiagnosticsInstrumentation(page);
    const result = await runCancellationControl(page, 'external-reorder');

    expect(result.orderChangedFromGestureStart).toBe(true);
    expect(result.scrollBehaviorAtCancellation).toBe('auto');
    expect(result.scrollByCallsAfterCancellation).toEqual([]);
  });

  test('control B: overflow-anchor disabled, cancellation via an external DOM reorder issues no library scrollBy after cancellation', async ({
    page,
  }) => {
    await installDiagnosticsInstrumentation(page, { disableOverflowAnchor: true });
    const result = await runCancellationControl(page, 'external-reorder');

    // Precondition: the external DOM reorder this control shares with Control A still happens —
    // otherwise this control would not actually be isolating overflow-anchor's effect.
    expect(result.orderChangedFromGestureStart).toBe(true);
    expect(result.scrollByCallsAfterCancellation).toEqual([]);
  });

  test('control C: cancellation via Escape without any DOM reorder issues no library scrollBy after cancellation', async ({
    page,
  }) => {
    await installDiagnosticsInstrumentation(page);
    const result = await runCancellationControl(page, 'escape');

    // Precondition: this control's whole point is that the controlled order never changes.
    expect(result.orderChangedFromGestureStart).toBe(false);
    expect(result.scrollBehaviorAtCancellation).toBe('auto');
    expect(result.scrollByCallsAfterCancellation).toEqual([]);
  });
});
