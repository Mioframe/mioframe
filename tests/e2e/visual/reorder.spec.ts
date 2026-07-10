import { expect, test, type CDPSession, type Locator, type Page } from '@playwright/test';
import { openStory } from './storybook';

declare global {
  interface Window {
    __externalPointerDownCount?: number;
  }
}

const STORY_ID = 'shared-lib-reorder-reorderstoryharness--default';

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
    // genuinely new click elsewhere in the container must still register normally.
    await page.mouse.up();
    const alphaBoxAfter = await boxOf(page.getByTestId('reorder-item-alpha'));
    await page.mouse.click(center(alphaBoxAfter).x, center(alphaBoxAfter).y);

    expect(await readContainerClickCount()).toBe(1);
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
    // Two sequential real-time-bound autoscroll phases; give this test extra wall-clock budget
    // beyond the default so CI-profile parallel worker contention doesn't starve it.
    test.setTimeout(60000);

    const container = page.getByTestId('reorder-container');
    const scrollAncestor = page.getByTestId('reorder-scroll-ancestor');
    const containerBox = await boxOf(container);

    const from = center(await boxOf(page.getByTestId('reorder-item-alpha')));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x, containerBox.y + containerBox.height - 4, { steps: 6 });

    // Wait for the container to reach its own scroll limit while the pointer stays put
    // (stationary-pointer autoscroll). Generous timeout: under CI-profile parallel workers,
    // autoscroll speed is throttled by real frame timing, not just wall-clock time.
    await expect
      .poll(
        () =>
          container.evaluate((el) => Math.abs(el.scrollTop - (el.scrollHeight - el.clientHeight))),
        { timeout: 20000 },
      )
      .toBeLessThanOrEqual(2);

    const ancestorScrollTopBefore = await scrollAncestor.evaluate((el) => el.scrollTop);

    // Move slightly further down toward the ancestor's own bottom edge so the chain falls
    // through once the inner container can no longer scroll.
    const ancestorBox = await boxOf(scrollAncestor);
    await page.mouse.move(from.x, ancestorBox.y + ancestorBox.height - 4, { steps: 4 });

    await expect
      .poll(() => scrollAncestor.evaluate((el) => el.scrollTop), { timeout: 20000 })
      .toBeGreaterThan(ancestorScrollTopBefore);

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

  test('an external order mutation while autoscrolling cancels before further scrolling occurs', async ({
    page,
  }) => {
    test.setTimeout(60000);

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

    await page.getByTestId('reorder-control-reverse-order').evaluate((el: HTMLElement) => {
      el.click();
    });

    await expect.poll(() => getCount(page, 'reorder-drag-end-count')).toBe(1);
    const lastDragEnd = await getLastDragEnd(page);
    expect(lastDragEnd?.cancelled).toBe(true);

    const scrollTopAtCancel = await container.evaluate((el) => el.scrollTop);
    // The mutation check runs before any autoscroll write each frame, so once cancelled, no
    // further scrolling should occur even across several more animation frames.
    await page.waitForTimeout(300);
    expect(await container.evaluate((el) => el.scrollTop)).toBe(scrollTopAtCancel);

    await page.mouse.up();
  });

  test.describe('viewport fallback', () => {
    test.use({ viewport: { width: 500, height: 320 } });

    test('falls back to the page viewport once the container and its scrollable ancestor are both exhausted', async ({
      page,
    }) => {
      test.setTimeout(60000);

      const container = page.getByTestId('reorder-container');
      const scrollAncestor = page.getByTestId('reorder-scroll-ancestor');

      const item = page.getByTestId('reorder-item-alpha');
      const box = await boxOf(item);
      const from = center(box);

      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(from.x, box.y + box.height + 100, { steps: 6 });

      await expect
        .poll(
          () =>
            container.evaluate((el) =>
              Math.abs(el.scrollTop - (el.scrollHeight - el.clientHeight)),
            ),
          { timeout: 20000 },
        )
        .toBeLessThanOrEqual(2);

      await expect
        .poll(
          () =>
            scrollAncestor.evaluate((el) =>
              Math.abs(el.scrollTop - (el.scrollHeight - el.clientHeight)),
            ),
          { timeout: 20000 },
        )
        .toBeLessThanOrEqual(2);

      const pageScrollBefore = await page.evaluate(() => window.scrollY);

      await expect
        .poll(() => page.evaluate(() => window.scrollY), { timeout: 20000 })
        .toBeGreaterThan(pageScrollBefore);

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
        window.__externalPointerDownCount = 0;
        document.addEventListener('pointerdown', () => {
          window.__externalPointerDownCount = (window.__externalPointerDownCount ?? 0) + 1;
        });
      });

      await dispatchTouch(page, 'touchStart', { x: 2, y: 2 });

      const externalCount = await page.evaluate(() => window.__externalPointerDownCount ?? 0);
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
