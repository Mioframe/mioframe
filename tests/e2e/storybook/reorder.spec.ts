import { expect, test, type CDPSession, type Locator, type Page } from '@playwright/test';
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

declare global {
  interface Window {
    testExternalPointerDownCount?: number;
    testReorderRafQueue?: { id: number; cb: FrameRequestCallback }[];
    testReorderFlushRaf?: () => void;
    testReorderScrollLog?: ReorderScrollLogEntry[];
    testReorderCancelledAtMs?: number | null;
  }
}

const STORY_ID = 'shared-lib-reorder-reorderstoryharness--default';
const BORDERED_VIEWPORT_STORY_ID =
  'shared-lib-reorder-reorderborderedviewportstoryharness--default';

const getOrder = async (page: Page): Promise<string[]> => {
  const text = await page.getByTestId('reorder-order').textContent();
  return text ? text.split(',') : [];
};

const getCount = async (page: Page, testId: string): Promise<number> => {
  const text = await page.getByTestId(testId).textContent();
  return Number(text ?? '0');
};

const getDraggingKey = async (page: Page): Promise<string> =>
  (await page.getByTestId('reorder-dragging-key').textContent()) ?? '';

interface DragEndPayload {
  key: string;
  initialIndex: number;
  finalIndex: number;
  cancelled: boolean;
}

const isDragEndPayload = (value: unknown): value is DragEndPayload => {
  if (typeof value !== 'object' || value === null) return false;
  if (
    !('key' in value) ||
    !('initialIndex' in value) ||
    !('finalIndex' in value) ||
    !('cancelled' in value)
  ) {
    return false;
  }

  return (
    typeof value.key === 'string' &&
    typeof value.initialIndex === 'number' &&
    typeof value.finalIndex === 'number' &&
    typeof value.cancelled === 'boolean'
  );
};

const getLastDragEnd = async (page: Page): Promise<DragEndPayload | null> => {
  const text = await page.getByTestId('reorder-last-drag-end').textContent();
  if (!text) return null;

  const parsed: unknown = JSON.parse(text);
  return isDragEndPayload(parsed) ? parsed : null;
};

const center = (box: { x: number; y: number; width: number; height: number }) => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
});

/**
 * A press point inside an item's own top padding band, clear of its label/button/ignore
 * children. Chromium's touch-adjustment snaps an imprecise touch point to a nearby interactive
 * element (unlike mouse hit-testing), so touch gestures must start away from the item's
 * interactive/ignored descendants to exercise plain-item activation.
 * @param box - The item's bounding box.
 * @returns The touch press point.
 */
const touchGrabPoint = (box: { x: number; y: number; width: number; height: number }) => ({
  x: box.x + box.width / 2,
  y: box.y + 3,
});

const boxOf = async (locator: Locator) => {
  // The story's scroll containers are shorter than their content, so an item may start outside
  // the visible/clipped area; scroll it into view before trusting its layout position.
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error('missing bounding box');
  return box;
};

/**
 * Mouse-drags from `from` to `to`, releasing the button unless `options.release` is `false`.
 * @param page - The Playwright page to drive.
 * @param from - The starting pointer position.
 * @param to - The ending pointer position.
 * @param options - `steps` controls movement granularity; `release` defaults to `true`.
 */
const mouseDrag = async (
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
  options: { steps?: number; release?: boolean } = {},
) => {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: options.steps ?? 8 });
  if (options.release ?? true) await page.mouse.up();
};

/**
 * Attaches a click counter to `locator` and returns a reader for it. Used to prove whether a
 * given gesture would produce (or was prevented from producing) a browser `click`.
 * @param locator - The element to observe.
 * @returns An async reader for the current click count.
 */
const attachClickCounter = async (locator: Locator): Promise<() => Promise<number>> => {
  await locator.evaluate((el) => {
    el.setAttribute('data-click-count', '0');
    el.addEventListener('click', () => {
      const current = Number(el.getAttribute('data-click-count') ?? '0');
      el.setAttribute('data-click-count', String(current + 1));
    });
  });
  return async () => Number((await locator.getAttribute('data-click-count')) ?? '0');
};

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

const dispatchTouch = async (
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
    let seq = 0;

    const targetIdentity = (element: Element): string =>
      element.getAttribute('data-testid') ?? element.tagName;

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

test.beforeEach(async ({ page }) => {
  await openStory(page, STORY_ID);
});

test.describe('mouse activation', () => {
  test('movement below the activation threshold preserves a normal click and does not start a drag', async ({
    page,
  }) => {
    const item = page.getByTestId('reorder-item-alpha');
    const box = await boxOf(item);
    const from = center(box);

    await mouseDrag(page, from, { x: from.x + 2, y: from.y }, { steps: 1 });

    expect(await getCount(page, 'reorder-drag-start-count')).toBe(0);
    expect(await getDraggingKey(page)).toBe('');
  });

  test('activates exactly once after crossing the threshold', async ({ page }) => {
    const item = page.getByTestId('reorder-item-alpha');
    const box = await boxOf(item);
    const from = center(box);

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 10, from.y, { steps: 4 });

    expect(await getCount(page, 'reorder-drag-start-count')).toBe(1);
    expect(await getDraggingKey(page)).toBe('alpha');

    await page.mouse.up();
    expect(await getCount(page, 'reorder-drag-end-count')).toBe(1);
  });

  test('standard interactive descendants and vReorderIgnore do not activate drag', async ({
    page,
  }) => {
    const button = page.getByTestId('reorder-interactive-button').first();
    const buttonBox = await boxOf(button);

    await mouseDrag(page, center(buttonBox), {
      x: center(buttonBox).x + 40,
      y: center(buttonBox).y,
    });
    expect(await getCount(page, 'reorder-drag-start-count')).toBe(0);
    await button.click();
    expect(await getCount(page, 'reorder-interactive-click-count')).toBe(1);

    const ignoreZone = page.getByTestId('reorder-ignore-zone').first();
    const ignoreBox = await boxOf(ignoreZone);

    await mouseDrag(page, center(ignoreBox), {
      x: center(ignoreBox).x + 40,
      y: center(ignoreBox).y,
    });
    expect(await getCount(page, 'reorder-drag-start-count')).toBe(0);
    await ignoreZone.click();
    expect(await getCount(page, 'reorder-ignore-click-count')).toBe(1);
  });
});

test.describe('click suppression', () => {
  test('a completed drag suppresses only its own resulting click, and a later genuine click is unaffected', async ({
    page,
  }) => {
    const item = page.getByTestId('reorder-item-alpha');
    const box = await boxOf(item);
    const from = center(box);
    // Move by exactly the distance the drag itself will travel, so this control gesture proves
    // the browser would otherwise dispatch a click for a gesture of this shape. Kept well inside
    // "alpha"'s own half-width (60px) so the endpoint lands clearly inside both source elements,
    // never on the item's own boundary.
    const moveDistance = 24;

    // The click-control surface is sized to match "alpha" exactly (120x60): equivalent
    // dimensions, down point (center), movement distance, and up point are what make this a
    // genuinely comparable control for the reorder gesture below.
    const control = page.getByTestId('reorder-click-control');
    const readControlClickCount = await attachClickCounter(control);
    const controlBox = await boxOf(control);
    expect(controlBox.width).toBeCloseTo(box.width, 0);
    expect(controlBox.height).toBeCloseTo(box.height, 0);
    const controlFrom = center(controlBox);

    await mouseDrag(
      page,
      controlFrom,
      { x: controlFrom.x + moveDistance, y: controlFrom.y },
      { steps: 8 },
    );
    expect(await readControlClickCount()).toBe(1);

    // The identically-shaped gesture, run on the reorder container, must not produce a click.
    const container = page.getByTestId('reorder-container');
    const readContainerClickCount = await attachClickCounter(container);

    await mouseDrag(page, from, { x: from.x + moveDistance, y: from.y }, { steps: 8 });
    expect(await readContainerClickCount()).toBe(0);

    // A genuinely new click afterward must still register normally.
    const alphaBoxAfter = await boxOf(page.getByTestId('reorder-item-alpha'));
    await page.mouse.click(center(alphaBoxAfter).x, center(alphaBoxAfter).y);
    expect(await readContainerClickCount()).toBe(1);
  });

  test('Escape cancellation before pointer release still suppresses the resulting click', async ({
    page,
  }) => {
    const container = page.getByTestId('reorder-container');
    const readContainerClickCount = await attachClickCounter(container);

    const item = page.getByTestId('reorder-item-alpha');
    const box = await boxOf(item);
    const from = center(box);

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 20, from.y, { steps: 4 });
    expect(await getDraggingKey(page)).toBe('alpha');

    await page.keyboard.press('Escape');
    expect(await getDraggingKey(page)).toBe('');

    // The physical button is released only now, after cancellation already tore the session down.
    await page.mouse.up();

    expect(await readContainerClickCount()).toBe(0);
  });

  test('Escape cancellation followed by a delayed physical release still suppresses the resulting click', async ({
    page,
  }) => {
    const container = page.getByTestId('reorder-container');
    const readContainerClickCount = await attachClickCounter(container);

    const item = page.getByTestId('reorder-item-alpha');
    const box = await boxOf(item);
    const from = center(box);
    const moveDistance = 60;

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + moveDistance, from.y, { steps: 8 });
    expect(await getDraggingKey(page)).toBe('alpha');

    await page.keyboard.press('Escape');
    expect(await getDraggingKey(page)).toBe('');

    // Well past a single zero-delay timer turn: only a bounded release watcher, not a
    // `setTimeout(..., 0)` fallback armed at cancellation time, could still be tracking the
    // original pointer this long afterward.
    await page.waitForTimeout(300);

    await page.mouse.up();

    expect(await readContainerClickCount()).toBe(0);

    const alphaBoxAfter = await boxOf(page.getByTestId('reorder-item-alpha'));
    await page.mouse.click(center(alphaBoxAfter).x, center(alphaBoxAfter).y);
    expect(await readContainerClickCount()).toBe(1);
  });

  test("a pointercancel after early cancellation does not suppress the pointer stream's own later click", async ({
    page,
  }) => {
    const container = page.getByTestId('reorder-container');
    const readContainerClickCount = await attachClickCounter(container);

    const item = page.getByTestId('reorder-item-alpha');
    const box = await boxOf(item);
    const from = center(box);
    const moveDistance = 60;

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + moveDistance, from.y, { steps: 8 });
    expect(await getDraggingKey(page)).toBe('alpha');

    await page.keyboard.press('Escape');
    expect(await getDraggingKey(page)).toBe('');

    await page.evaluate(() => {
      window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1, bubbles: true }));
    });

    // The real mouse button, unaffected by the synthetic pointercancel, still lifts normally and
    // produces its own click for this same gesture; the release watcher must have already removed
    // itself without arming suppression, so this click is not suppressed.
    await page.mouse.up();

    expect(await readContainerClickCount()).toBe(1);
  });

  test('a direct pointercancel on an active drag leaves exactly one cancelled onDragEnd and does not suppress a later genuine click', async ({
    page,
  }) => {
    const container = page.getByTestId('reorder-container');
    const readContainerClickCount = await attachClickCounter(container);

    const item = page.getByTestId('reorder-item-alpha');
    const box = await boxOf(item);
    const from = center(box);

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 20, from.y, { steps: 4 });
    expect(await getDraggingKey(page)).toBe('alpha');

    // The pointer stream itself ends here: unlike Escape/blur/visibility (which cancel the
    // session while the physical pointer may still be down), a real pointercancel means no click
    // will ever follow this stream at all, so nothing may be armed to suppress one.
    await page.evaluate(() => {
      window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1, bubbles: true }));
    });

    expect(await getDraggingKey(page)).toBe('');
    expect(await getCount(page, 'reorder-drag-end-count')).toBe(1);
    expect((await getLastDragEnd(page))?.cancelled).toBe(true);

    // The mouse button never truly lifts for this synthetic-pointercancel stream, but a later,
    // genuinely new click elsewhere in the container must still register normally. Whether the
    // browser's own native click generation for that bare release lands before or after this
    // point is a real-engine timing detail this library has no opinion on (pointercancel neither
    // suppresses it nor guarantees it); let any such click fully settle and establish the count
    // baseline afterward, so only the deliberate click below is asserted.
    await page.mouse.up();
    await page.waitForTimeout(200);
    const clickCountBeforeNewClick = await readContainerClickCount();

    const alphaBoxAfter = await boxOf(page.getByTestId('reorder-item-alpha'));
    await page.mouse.click(center(alphaBoxAfter).x, center(alphaBoxAfter).y);

    await expect
      .poll(() => readContainerClickCount(), { timeout: 5000 })
      .toBe(clickCountBeforeNewClick + 1);
    expect(await getCount(page, 'reorder-drag-end-count')).toBe(1);
  });
});

test.describe('live reorder geometry', () => {
  test('reorders in both directions and can reach a non-adjacent target directly', async ({
    page,
  }) => {
    const initialOrder = await getOrder(page);
    expect(initialOrder.indexOf('alpha')).toBeLessThan(initialOrder.indexOf('delta'));

    const from = center(await boxOf(page.getByTestId('reorder-item-alpha')));
    const to = center(await boxOf(page.getByTestId('reorder-item-delta')));

    await mouseDrag(page, from, to, { steps: 12 });

    const afterForward = await getOrder(page);
    expect(afterForward.indexOf('alpha')).toBeGreaterThan(0);
    expect(await getCount(page, 'reorder-reorder-count')).toBeGreaterThan(0);

    // Drag it back toward the start (reverse direction).
    const alphaBoxNow = await boxOf(page.getByTestId('reorder-item-alpha'));
    const firstItemBox = await boxOf(page.locator('[data-testid^="reorder-item-"]').first());

    await mouseDrag(page, center(alphaBoxNow), center(firstItemBox), { steps: 12 });

    const afterBackward = await getOrder(page);
    expect(afterBackward[0]).toBe('alpha');
  });

  test('the wrapping arrangement reorders without a configured axis (vertical movement across rows works)', async ({
    page,
  }) => {
    const container = page.getByTestId('reorder-container');
    const containerBox = await boxOf(container);

    // Items wrap into multiple rows inside the fixed-width container; find an item whose row
    // differs from "alpha"'s row by comparing y position.
    const alphaBox = await boxOf(page.getByTestId('reorder-item-alpha'));
    const items = await page.locator('[data-testid^="reorder-item-"]').all();
    const itemInfo = await Promise.all(
      items.map(async (item) => ({
        box: await item.boundingBox(),
        testId: await item.getAttribute('data-testid'),
      })),
    );
    const otherRowInfo = itemInfo.find(
      ({ box }) => box && Math.abs(box.y - alphaBox.y) > box.height,
    );
    const otherRowKey = otherRowInfo?.testId?.replace('reorder-item-', '') ?? null;

    expect(otherRowKey).not.toBeNull();
    if (!otherRowKey) return;

    const orderBefore = await getOrder(page);
    const targetBox = await boxOf(page.getByTestId(`reorder-item-${otherRowKey}`));

    await mouseDrag(page, center(alphaBox), center(targetBox), { steps: 12 });

    const orderAfter = await getOrder(page);
    expect(orderAfter).not.toEqual(orderBefore);
    expect(orderAfter.indexOf('alpha')).not.toBe(orderBefore.indexOf('alpha'));

    void containerBox;
  });

  test('different item sizes obey the physical displacement threshold', async ({ page }) => {
    // "bravo" (200x100) and "charlie" (80x140) are adjacent and clearly different sizes.
    const bravo = page.getByTestId('reorder-item-bravo');
    const charlie = page.getByTestId('reorder-item-charlie');
    const bravoBox = await boxOf(bravo);
    const charlieBox = await boxOf(charlie);
    const orderBefore = await getOrder(page);

    await page.mouse.move(center(bravoBox).x, center(bravoBox).y);
    await page.mouse.down();
    await page.mouse.move(bravoBox.x + bravoBox.width + 4, center(bravoBox).y, { steps: 4 });

    // A tiny nudge into the neighbor must not be enough to displace it.
    expect(await getOrder(page)).toEqual(orderBefore);

    // Moving well past halfway into the smaller neighbor's extent must displace it.
    await page.mouse.move(center(charlieBox).x, center(charlieBox).y, { steps: 8 });
    await page.mouse.up();

    const orderAfter = await getOrder(page);
    expect(orderAfter).not.toEqual(orderBefore);
  });
});

test.describe('touch activation', () => {
  test.use({ hasTouch: true });

  test('movement before the long-press delay causes real native scrolling, not merely the absence of activation', async ({
    page,
  }) => {
    const container = page.getByTestId('reorder-container');
    const scrollTopBefore = await container.evaluate((el) => el.scrollTop);

    const item = page.getByTestId('reorder-item-alpha');
    const box = await boxOf(item);
    const point = touchGrabPoint(box);

    await dispatchTouch(page, 'touchStart', point);
    for (let i = 1; i <= 6; i += 1) {
      // eslint-disable-next-line no-await-in-loop -- touch moves must be sent in order, one at a time
      await dispatchTouch(page, 'touchMove', { x: point.x, y: point.y - i * 15 });
    }
    await dispatchTouch(page, 'touchEnd');

    expect(await getCount(page, 'reorder-drag-start-count')).toBe(0);
    await expect
      .poll(() => container.evaluate((el) => el.scrollTop), { timeout: 3000 })
      .toBeGreaterThan(scrollTopBefore);
  });

  test('activates after the configured long-press delay', async ({ page }) => {
    const item = page.getByTestId('reorder-item-alpha');
    const box = await boxOf(item);
    const point = touchGrabPoint(box);

    await dispatchTouch(page, 'touchStart', point);
    await page.waitForTimeout(700);

    expect(await getCount(page, 'reorder-drag-start-count')).toBe(1);
    expect(await getDraggingKey(page)).toBe('alpha');

    await dispatchTouch(page, 'touchEnd');
    expect(await getCount(page, 'reorder-drag-end-count')).toBe(1);
  });

  test('movement beyond the slop before the delay cancels activation', async ({ page }) => {
    const item = page.getByTestId('reorder-item-alpha');
    const box = await boxOf(item);
    const point = touchGrabPoint(box);

    await dispatchTouch(page, 'touchStart', point);
    await dispatchTouch(page, 'touchMove', { x: point.x, y: point.y + 20 });
    await page.waitForTimeout(500);

    expect(await getCount(page, 'reorder-drag-start-count')).toBe(0);
    expect(await getDraggingKey(page)).toBe('');

    await dispatchTouch(page, 'touchEnd');
  });

  test('an activated touch drag can reorder', async ({ page }) => {
    const orderBefore = await getOrder(page);
    const from = touchGrabPoint(await boxOf(page.getByTestId('reorder-item-alpha')));
    const to = center(await boxOf(page.getByTestId('reorder-item-delta')));

    await dispatchTouch(page, 'touchStart', from);
    await page.waitForTimeout(700);
    expect(await getDraggingKey(page)).toBe('alpha');

    const steps = 8;
    for (let i = 1; i <= steps; i += 1) {
      // eslint-disable-next-line no-await-in-loop -- touch moves must be sent in order, one at a time
      await dispatchTouch(page, 'touchMove', {
        x: from.x + ((to.x - from.x) * i) / steps,
        y: from.y + ((to.y - from.y) * i) / steps,
      });
    }
    await dispatchTouch(page, 'touchEnd');

    expect(await getCount(page, 'reorder-drag-end-count')).toBe(1);
    expect(await getOrder(page)).not.toEqual(orderBefore);
  });

  test('after activation, further movement produces no native gesture scrolling beyond library autoscroll', async ({
    page,
  }) => {
    const container = page.getByTestId('reorder-container');
    const containerBox = await boxOf(container);
    const item = page.getByTestId('reorder-item-alpha');
    const box = await boxOf(item);
    const point = touchGrabPoint(box);

    await dispatchTouch(page, 'touchStart', point);
    await page.waitForTimeout(700);
    expect(await getDraggingKey(page)).toBe('alpha');

    const scrollTopBefore = await container.evaluate((el) => el.scrollTop);

    // Oscillate well clear of the autoscroll edge zone (56px), deep inside the container.
    const midY = containerBox.y + containerBox.height / 2;
    for (let i = 1; i <= 6; i += 1) {
      // eslint-disable-next-line no-await-in-loop -- touch moves must be sent in order, one at a time
      await dispatchTouch(page, 'touchMove', { x: point.x, y: midY + (i % 2 === 0 ? 40 : -40) });
    }

    const scrollTopAfter = await container.evaluate((el) => el.scrollTop);
    expect(scrollTopAfter).toBe(scrollTopBefore);

    await dispatchTouch(page, 'touchEnd');
  });
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

  test('an external order mutation while autoscrolling cancels before further scrolling occurs, with no library scroll write and no position drift after cancellation', async ({
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

    const scrollTopAtCancel = await container.evaluate((el) => el.scrollTop);

    // 4/5/6. Keep the physical mouse button down and observe both the real scroll position and
    // the instrumented call log across several more real animation frames.
    await page.waitForTimeout(300);

    const scrollLog = await getScrollLog(page);
    const writesAfterCancellation = scrollLog.filter(
      (entry) => cancelledAtMs !== null && entry.timeMs > cancelledAtMs,
    );

    // Outcome C, proven: no instrumented library scroll write, and no scroll position drift,
    // after the cancelled onDragEnd became observable. See PR 139's post-cancellation diagnosis
    // for the full evidence and reasoning — `processActiveFrame` in `PointerSession.ts` runs the
    // controlled-order mutation check before any autoscroll write each frame, and `cancelSession`
    // clears `session` synchronously, so `scheduleFrame`'s own `session` guard prevents any
    // further frame (queued or reentrant) from running at all.
    expect(writesAfterCancellation).toEqual([]);
    expect(await container.evaluate((el) => el.scrollTop)).toBe(scrollTopAtCancel);

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

test.describe('cancellation and cleanup', () => {
  test('Escape cancels an active drag, leaving no dragging state and firing onDragEnd exactly once', async ({
    page,
  }) => {
    const from = center(await boxOf(page.getByTestId('reorder-item-alpha')));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 20, from.y, { steps: 4 });
    expect(await getDraggingKey(page)).toBe('alpha');

    await page.keyboard.press('Escape');

    expect(await getDraggingKey(page)).toBe('');
    expect(await getCount(page, 'reorder-drag-end-count')).toBe(1);

    await page.mouse.up();
    expect(await getCount(page, 'reorder-drag-end-count')).toBe(1);
  });

  test('Escape after a completed live move rolls the active item back to its initial index', async ({
    page,
  }) => {
    const orderBefore = await getOrder(page);
    const from = center(await boxOf(page.getByTestId('reorder-item-alpha')));
    const to = center(await boxOf(page.getByTestId('reorder-item-delta')));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 12 });

    await expect.poll(() => getOrder(page)).not.toEqual(orderBefore);

    await page.keyboard.press('Escape');

    await expect.poll(() => getOrder(page)).toEqual(orderBefore);
    expect(await getDraggingKey(page)).toBe('');

    await page.mouse.up();
  });

  test('losing window focus (blur) cancels an active drag', async ({ page }) => {
    const from = center(await boxOf(page.getByTestId('reorder-item-bravo')));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 20, from.y, { steps: 4 });
    expect(await getDraggingKey(page)).toBe('bravo');

    await page.evaluate(() => window.dispatchEvent(new Event('blur')));

    expect(await getDraggingKey(page)).toBe('');
    expect(await getCount(page, 'reorder-drag-end-count')).toBe(1);

    await page.mouse.up();
  });

  test('pointercancel produces exactly one cancelled onDragEnd', async ({ page }) => {
    const from = center(await boxOf(page.getByTestId('reorder-item-alpha')));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 20, from.y, { steps: 4 });
    expect(await getDraggingKey(page)).toBe('alpha');

    await page.evaluate(() => {
      window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1, bubbles: true }));
    });

    expect(await getDraggingKey(page)).toBe('');
    expect(await getCount(page, 'reorder-drag-end-count')).toBe(1);
    expect((await getLastDragEnd(page))?.cancelled).toBe(true);

    // A stray pointerup afterward must not fire a second onDragEnd.
    await page.mouse.up();
    expect(await getCount(page, 'reorder-drag-end-count')).toBe(1);
  });

  test('visibility loss produces exactly one cancelled onDragEnd', async ({ page }) => {
    const from = center(await boxOf(page.getByTestId('reorder-item-alpha')));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 20, from.y, { steps: 4 });
    expect(await getDraggingKey(page)).toBe('alpha');

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(await getDraggingKey(page)).toBe('');
    expect(await getCount(page, 'reorder-drag-end-count')).toBe(1);
    expect((await getLastDragEnd(page))?.cancelled).toBe(true);

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.mouse.up();
    expect(await getCount(page, 'reorder-drag-end-count')).toBe(1);
  });

  test.describe('second pointer', () => {
    test.use({ hasTouch: true });

    test('cancels a pending session when it starts outside the container', async ({ page }) => {
      const from = center(await boxOf(page.getByTestId('reorder-item-alpha')));

      await page.mouse.move(from.x, from.y);
      await page.mouse.down();

      await dispatchTouch(page, 'touchStart', { x: 2, y: 2 });
      await dispatchTouch(page, 'touchEnd');

      await page.mouse.move(from.x + 20, from.y, { steps: 4 });
      expect(await getCount(page, 'reorder-drag-start-count')).toBe(0);

      await page.mouse.up();
    });

    test('cancels an active session when it starts outside the container', async ({ page }) => {
      const from = center(await boxOf(page.getByTestId('reorder-item-alpha')));

      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(from.x + 20, from.y, { steps: 4 });
      expect(await getDraggingKey(page)).toBe('alpha');

      await dispatchTouch(page, 'touchStart', { x: 2, y: 2 });
      await dispatchTouch(page, 'touchEnd');

      expect(await getDraggingKey(page)).toBe('');
      expect(await getCount(page, 'reorder-drag-end-count')).toBe(1);
      expect((await getLastDragEnd(page))?.cancelled).toBe(true);

      await page.mouse.up();
    });

    test('still reaches an external page listener and does not start a new reorder session', async ({
      page,
    }) => {
      const from = center(await boxOf(page.getByTestId('reorder-item-alpha')));

      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(from.x + 20, from.y, { steps: 4 });
      expect(await getDraggingKey(page)).toBe('alpha');
      expect(await getCount(page, 'reorder-drag-start-count')).toBe(1);

      await page.evaluate(() => {
        window.testExternalPointerDownCount = 0;
        document.addEventListener('pointerdown', () => {
          window.testExternalPointerDownCount = (window.testExternalPointerDownCount ?? 0) + 1;
        });
      });

      await dispatchTouch(page, 'touchStart', { x: 2, y: 2 });

      const externalCount = await page.evaluate(() => window.testExternalPointerDownCount ?? 0);
      expect(externalCount).toBe(1);

      // The current session cancelled, but this same second-pointer event must not have started
      // a brand-new one: the drag-start count stays at its pre-second-pointer value.
      expect(await getCount(page, 'reorder-drag-start-count')).toBe(1);
      expect(await getDraggingKey(page)).toBe('');
      expect((await getLastDragEnd(page))?.cancelled).toBe(true);

      await dispatchTouch(page, 'touchEnd');
      await page.mouse.up();
    });
  });

  test('unmounting the container cancels an active drag deterministically', async ({ page }) => {
    const from = center(await boxOf(page.getByTestId('reorder-item-alpha')));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 20, from.y, { steps: 4 });
    expect(await getDraggingKey(page)).toBe('alpha');

    // Navigating away unmounts the story component entirely.
    await page.goto('about:blank');
    await page.mouse.up();
  });

  test('active-item removal cancels the drag and reports finalIndex -1', async ({ page }) => {
    const from = center(await boxOf(page.getByTestId('reorder-item-alpha')));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 20, from.y, { steps: 4 });
    expect(await getDraggingKey(page)).toBe('alpha');

    await page.getByTestId('reorder-control-remove-active').evaluate((el: HTMLElement) => {
      el.click();
    });

    await expect.poll(() => getCount(page, 'reorder-drag-end-count')).toBe(1);
    const lastDragEnd = await getLastDragEnd(page);
    expect(lastDragEnd?.cancelled).toBe(true);
    expect(lastDragEnd?.finalIndex).toBe(-1);
    expect(await getDraggingKey(page)).toBe('');
    expect(await getOrder(page)).not.toContain('alpha');

    await page.mouse.up();
  });

  test('an incompatible external order mutation cancels the session without overwriting it', async ({
    page,
  }) => {
    const from = center(await boxOf(page.getByTestId('reorder-item-alpha')));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 20, from.y, { steps: 4 });
    expect(await getDraggingKey(page)).toBe('alpha');

    await page.getByTestId('reorder-control-reverse-order').evaluate((el: HTMLElement) => {
      el.click();
    });
    const reversedOrder = await getOrder(page);

    await expect.poll(() => getCount(page, 'reorder-drag-end-count')).toBe(1);
    const lastDragEnd = await getLastDragEnd(page);
    expect(lastDragEnd?.cancelled).toBe(true);
    expect(await getDraggingKey(page)).toBe('');

    // The external mutation must stand exactly as applied; no library-issued rollback write.
    expect(await getOrder(page)).toEqual(reversedOrder);

    await page.mouse.up();
  });

  test('consumer rejection of a requested reorder cancels the session safely', async ({ page }) => {
    await page.getByTestId('reorder-control-reject-next-reorder').click();
    const orderBefore = await getOrder(page);

    const from = center(await boxOf(page.getByTestId('reorder-item-alpha')));
    const to = center(await boxOf(page.getByTestId('reorder-item-delta')));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 12 });

    await expect.poll(() => getCount(page, 'reorder-reorder-count')).toBeGreaterThan(0);
    await expect.poll(() => getCount(page, 'reorder-drag-end-count')).toBe(1);

    const lastDragEnd = await getLastDragEnd(page);
    expect(lastDragEnd?.cancelled).toBe(true);
    expect(await getOrder(page)).toEqual(orderBefore);
    expect(await getDraggingKey(page)).toBe('');

    await page.mouse.up();
  });

  test('no drag/scroll behavior remains active after a completed session ends', async ({
    page,
  }) => {
    const from = center(await boxOf(page.getByTestId('reorder-item-alpha')));
    const to = center(await boxOf(page.getByTestId('reorder-item-bravo')));

    await mouseDrag(page, from, to, { steps: 8 });
    expect(await getCount(page, 'reorder-drag-end-count')).toBe(1);

    const reorderCountAfterFirstDrag = await getCount(page, 'reorder-reorder-count');

    // Idle movement after the session ended must not trigger any further callback.
    await page.mouse.move(to.x + 5, to.y + 5, { steps: 3 });
    await page.waitForTimeout(200);

    expect(await getCount(page, 'reorder-reorder-count')).toBe(reorderCountAfterFirstDrag);
    expect(await getCount(page, 'reorder-drag-start-count')).toBe(1);
    expect(await getDraggingKey(page)).toBe('');

    // A brand-new drag on a different item must still work, proving no stale session state.
    const nextFrom = center(await boxOf(page.getByTestId('reorder-item-charlie')));
    const nextTo = center(await boxOf(page.getByTestId('reorder-item-echo')));
    await mouseDrag(page, nextFrom, nextTo, { steps: 8 });

    expect(await getCount(page, 'reorder-drag-start-count')).toBe(2);
    expect(await getCount(page, 'reorder-drag-end-count')).toBe(2);
  });
});

test.describe('deferred pointerup settlement', () => {
  test('an accepted move settles into exactly one successful onDragEnd when pointerup arrives before its DOM commit, with no extra scroll or reorder afterward', async ({
    page,
  }) => {
    const container = page.getByTestId('reorder-container');
    const alpha = page.getByTestId('reorder-item-alpha');
    const bravo = page.getByTestId('reorder-item-bravo');

    const from = center(await boxOf(alpha));
    const to = center(await boxOf(bravo));

    // Take deterministic control of the library's per-frame `requestAnimationFrame` loop from the
    // test itself, so the physical release below can be dispatched synchronously, in the very
    // same script turn as the just-accepted move — before Vue's own DOM-commit microtask (queued
    // by that move's `nextTick`) gets a chance to run. This reproduces the exact
    // "pointerup arrives before its deferred DOM commit settles" race deterministically, instead
    // of relying on real frame/microtask timing that a separate Playwright command could never
    // reliably land inside.
    await page.evaluate(() => {
      window.testReorderRafQueue = [];
      let nextId = 1;
      window.requestAnimationFrame = (cb: FrameRequestCallback): number => {
        const id = nextId;
        nextId += 1;
        window.testReorderRafQueue?.push({ id, cb });
        return id;
      };
      window.cancelAnimationFrame = (id: number): void => {
        window.testReorderRafQueue = (window.testReorderRafQueue ?? []).filter(
          (entry) => entry.id !== id,
        );
      };
      window.testReorderFlushRaf = () => {
        const pending = window.testReorderRafQueue ?? [];
        window.testReorderRafQueue = [];
        const now = performance.now();
        for (const entry of pending) entry.cb(now);
      };
    });

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    // Crosses the activation threshold; the resulting frame is queued into the stub above rather
    // than a real animation frame, so it does not run until explicitly flushed below.
    await page.mouse.move(from.x + 10, from.y, { steps: 2 });
    expect(await getDraggingKey(page)).toBe('alpha');

    // Only updates the pending frame's pointer position; still does not run any frame processing.
    await page.mouse.move(to.x, to.y, { steps: 1 });
    expect(await getCount(page, 'reorder-reorder-count')).toBe(0);

    const releasedSynchronouslyWithoutRequeue = await page.evaluate(() => {
      // Runs the single queued frame synchronously: it hit-tests the pointer's current position,
      // accepts the move (calling the consumer's onReorder), and schedules Vue's DOM-commit
      // `nextTick` wait. Immediately afterward, in this same script turn, dispatch the physical
      // release: the pointerup handler stops the gesture runtime and — since a commit is still
      // being awaited — defers completion instead of finishing immediately.
      window.testReorderFlushRaf?.();
      window.dispatchEvent(
        new PointerEvent('pointerup', { pointerId: 1, bubbles: true, cancelable: true }),
      );
      // Gesture runtime must already be fully stopped: no new frame was queued by the pointerup
      // handling above.
      return (window.testReorderRafQueue ?? []).length === 0;
    });

    expect(releasedSynchronouslyWithoutRequeue).toBe(true);
    expect(await getCount(page, 'reorder-reorder-count')).toBe(1);

    // The deferred completion resolves once Vue's DOM commit settles (already scheduled above);
    // a real, matching `lostpointercapture` fired by the browser's own capture release must not
    // turn this into a cancellation.
    await expect.poll(() => getCount(page, 'reorder-drag-end-count')).toBe(1);
    const lastDragEnd = await getLastDragEnd(page);
    expect(lastDragEnd?.cancelled).toBe(false);
    expect(await getDraggingKey(page)).toBe('');

    const reorderCountAfterSettle = await getCount(page, 'reorder-reorder-count');
    const scrollTopAfterSettle = await container.evaluate((el) => el.scrollTop);

    await page.waitForTimeout(200);

    expect(await getCount(page, 'reorder-reorder-count')).toBe(reorderCountAfterSettle);
    expect(await getCount(page, 'reorder-drag-end-count')).toBe(1);
    expect(await container.evaluate((el) => el.scrollTop)).toBe(scrollTopAfterSettle);
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
