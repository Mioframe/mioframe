import { expect, test, type CDPSession, type Locator, type Page } from '@playwright/test';
import { openStory } from './storybook';

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

  test('a normal completed drag suppresses only its associated synthetic click', async ({
    page,
  }) => {
    const container = page.getByTestId('reorder-container');

    await container.evaluate((el) => {
      el.setAttribute('data-click-count', '0');
      el.addEventListener('click', () => {
        const current = Number(el.getAttribute('data-click-count') ?? '0');
        el.setAttribute('data-click-count', String(current + 1));
      });
    });
    const readClickCount = async () =>
      Number((await container.getAttribute('data-click-count')) ?? '0');

    const item = page.getByTestId('reorder-item-alpha');
    const box = await boxOf(item);
    const from = center(box);
    const target = page.getByTestId('reorder-item-bravo');
    const targetBox = await boxOf(target);

    await mouseDrag(page, from, center(targetBox));

    expect(await readClickCount()).toBe(0);

    // A genuinely new click afterward must still register normally.
    const alphaBoxAfter = await boxOf(page.getByTestId('reorder-item-alpha'));
    await page.mouse.click(center(alphaBoxAfter).x, center(alphaBoxAfter).y);

    expect(await readClickCount()).toBe(1);
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

  test('movement before the long-press delay remains native scrolling and does not activate reorder', async ({
    page,
  }) => {
    const item = page.getByTestId('reorder-item-alpha');
    const box = await boxOf(item);
    const point = touchGrabPoint(box);

    await dispatchTouch(page, 'touchStart', point);
    await dispatchTouch(page, 'touchMove', { x: point.x, y: point.y + 30 });
    await dispatchTouch(page, 'touchEnd');

    expect(await getCount(page, 'reorder-drag-start-count')).toBe(0);
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

  test('a pointer beyond the visible edge continues intuitive autoscroll and reorder', async ({
    page,
  }) => {
    const container = page.getByTestId('reorder-container');
    const containerBox = await boxOf(container);
    const scrollTopBefore = await container.evaluate((el) => el.scrollTop);

    const from = center(await boxOf(page.getByTestId('reorder-item-alpha')));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    // Move well past the container's bottom edge, outside its visible bounds.
    await page.mouse.move(from.x, containerBox.y + containerBox.height + 60, { steps: 6 });

    await expect
      .poll(() => container.evaluate((el) => el.scrollTop), { timeout: 3000 })
      .toBeGreaterThan(scrollTopBefore);

    expect(await getDraggingKey(page)).toBe('alpha');

    await page.mouse.up();
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
