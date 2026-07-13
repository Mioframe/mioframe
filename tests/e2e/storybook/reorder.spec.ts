import { expect, test, type CDPSession, type Page } from '@playwright/test';
import {
  boxOf,
  center,
  getCount,
  getDraggingKey,
  getItem,
  getLastDragEnd,
  getOrder,
  STORY_ID,
} from './reorder.testUtils';
import { openStory } from './storybook.testUtils';

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

/**
 * Polls the harness's `Dragging key` output until it equals `key`.
 * @param page - The Playwright page to read from.
 * @param key - The expected controlled key, or `''` for no active session.
 */
const waitForDraggingKey = async (page: Page, key: string): Promise<void> => {
  await expect.poll(() => getDraggingKey(page), { timeout: 2_000 }).toBe(key);
};

test.beforeEach(async ({ page }) => {
  await openStory(page, STORY_ID);
});

test.describe('mouse activation', () => {
  test('movement below the activation threshold preserves a normal click and does not start a drag', async ({
    page,
  }) => {
    const item = getItem(page, 'alpha');
    const box = await boxOf(item);
    const from = center(box);

    await mouseDrag(page, from, { x: from.x + 2, y: from.y }, { steps: 1 });

    expect(await getCount(page, 'Drag start count')).toBe(0);
    expect(await getDraggingKey(page)).toBe('');
  });

  test('activates exactly once after crossing the threshold', async ({ page }) => {
    const item = getItem(page, 'alpha');
    const box = await boxOf(item);
    const from = center(box);

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 10, from.y, { steps: 4 });

    expect(await getCount(page, 'Drag start count')).toBe(1);
    expect(await getDraggingKey(page)).toBe('alpha');

    await page.mouse.up();
    expect(await getCount(page, 'Drag end count')).toBe(1);
  });

  test('standard interactive descendants and vReorderIgnore do not activate drag', async ({
    page,
  }) => {
    const alphaItem = getItem(page, 'alpha');
    const button = alphaItem.getByRole('button', { name: 'Alpha action' });
    const buttonBox = await boxOf(button);

    await mouseDrag(page, center(buttonBox), {
      x: center(buttonBox).x + 40,
      y: center(buttonBox).y,
    });
    expect(await getCount(page, 'Drag start count')).toBe(0);
    await button.click();
    expect(await getCount(page, 'Interactive click count')).toBe(1);

    const ignoreZone = alphaItem.getByRole('button', { name: 'Alpha ignore zone' });
    const ignoreBox = await boxOf(ignoreZone);

    await mouseDrag(page, center(ignoreBox), {
      x: center(ignoreBox).x + 40,
      y: center(ignoreBox).y,
    });
    expect(await getCount(page, 'Drag start count')).toBe(0);
    await ignoreZone.click();
    expect(await getCount(page, 'Ignored click count')).toBe(1);
  });
});

test.describe('click suppression', () => {
  test('a completed drag suppresses only its own resulting click, and a later genuine click is unaffected', async ({
    page,
  }) => {
    const item = getItem(page, 'alpha');
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
    const control = page.getByRole('button', { name: 'Click control' });
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
    expect(await getCount(page, 'Click control click count')).toBe(1);

    // The identically-shaped gesture, run on the reorder container, must not produce a click.
    await mouseDrag(page, from, { x: from.x + moveDistance, y: from.y }, { steps: 8 });
    expect(await getCount(page, 'Container click count')).toBe(0);

    // A genuinely new click afterward must still register normally.
    const alphaBoxAfter = await boxOf(getItem(page, 'alpha'));
    await page.mouse.click(center(alphaBoxAfter).x, center(alphaBoxAfter).y);
    expect(await getCount(page, 'Container click count')).toBe(1);
  });

  test('Escape cancellation before pointer release still suppresses the resulting click', async ({
    page,
  }) => {
    const item = getItem(page, 'alpha');
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

    expect(await getCount(page, 'Container click count')).toBe(0);
  });

  test('Escape cancellation followed by a delayed physical release still suppresses the resulting click', async ({
    page,
  }) => {
    const item = getItem(page, 'alpha');
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
    // original pointer this long afterward. The delayed release is itself the scenario under
    // test, not a stabilization wait.
    await page.waitForTimeout(300);

    await page.mouse.up();

    expect(await getCount(page, 'Container click count')).toBe(0);

    const alphaBoxAfter = await boxOf(getItem(page, 'alpha'));
    await page.mouse.click(center(alphaBoxAfter).x, center(alphaBoxAfter).y);
    expect(await getCount(page, 'Container click count')).toBe(1);
  });
});

test.describe('live reorder geometry', () => {
  test('reorders in both directions and can reach a non-adjacent target directly', async ({
    page,
  }) => {
    const initialOrder = await getOrder(page);
    expect(initialOrder.indexOf('alpha')).toBeLessThan(initialOrder.indexOf('delta'));

    const from = center(await boxOf(getItem(page, 'alpha')));
    const to = center(await boxOf(getItem(page, 'delta')));

    await mouseDrag(page, from, to, { steps: 12 });

    const afterForward = await getOrder(page);
    expect(afterForward.indexOf('alpha')).toBeGreaterThan(0);
    expect(await getCount(page, 'Reorder count')).toBeGreaterThan(0);

    // Drag it back toward the start (reverse direction).
    const alphaBoxNow = await boxOf(getItem(page, 'alpha'));
    const firstItemBox = await boxOf(page.getByRole('listitem').first());

    await mouseDrag(page, center(alphaBoxNow), center(firstItemBox), { steps: 12 });

    const afterBackward = await getOrder(page);
    expect(afterBackward[0]).toBe('alpha');
  });

  test('the wrapping arrangement reorders without a configured axis (vertical movement across rows works)', async ({
    page,
  }) => {
    // Items wrap into multiple rows inside the fixed-width container; find an item whose row
    // differs from "alpha"'s row by comparing y position.
    const alphaBox = await boxOf(getItem(page, 'alpha'));
    const items = await page.getByRole('listitem').all();
    const itemInfo = await Promise.all(
      items.map(async (item) => ({
        box: await item.boundingBox(),
        label: await item.getAttribute('aria-label'),
      })),
    );
    const otherRowInfo = itemInfo.find(
      ({ box }) => box && Math.abs(box.y - alphaBox.y) > box.height,
    );
    const otherRowKey = otherRowInfo?.label?.toLowerCase() ?? null;

    expect(otherRowKey).not.toBeNull();
    if (!otherRowKey) return;

    const orderBefore = await getOrder(page);
    const targetBox = await boxOf(getItem(page, otherRowKey));

    await mouseDrag(page, center(alphaBox), center(targetBox), { steps: 12 });

    const orderAfter = await getOrder(page);
    expect(orderAfter).not.toEqual(orderBefore);
    expect(orderAfter.indexOf('alpha')).not.toBe(orderBefore.indexOf('alpha'));
  });

  test('different item sizes obey the physical displacement threshold', async ({ page }) => {
    // "bravo" (200x100) and "charlie" (80x140) are adjacent and clearly different sizes.
    const bravo = getItem(page, 'bravo');
    const charlie = getItem(page, 'charlie');
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
    const container = page.getByRole('list', { name: 'Reorder items' });
    const scrollTopBefore = await container.evaluate((el) => el.scrollTop);

    const item = getItem(page, 'alpha');
    const box = await boxOf(item);
    const point = touchGrabPoint(box);

    await dispatchTouch(page, 'touchStart', point);
    for (let i = 1; i <= 6; i += 1) {
      // eslint-disable-next-line no-await-in-loop -- touch moves must be sent in order, one at a time
      await dispatchTouch(page, 'touchMove', { x: point.x, y: point.y - i * 15 });
    }
    await dispatchTouch(page, 'touchEnd');

    expect(await getCount(page, 'Drag start count')).toBe(0);
    await expect
      .poll(() => container.evaluate((el) => el.scrollTop), { timeout: 3000 })
      .toBeGreaterThan(scrollTopBefore);
  });

  test('activates after the configured long-press delay', async ({ page }) => {
    const item = getItem(page, 'alpha');
    const box = await boxOf(item);
    const point = touchGrabPoint(box);

    await dispatchTouch(page, 'touchStart', point);
    await waitForDraggingKey(page, 'alpha');
    expect(await getCount(page, 'Drag start count')).toBe(1);

    await dispatchTouch(page, 'touchEnd');
    expect(await getCount(page, 'Drag end count')).toBe(1);
  });

  test('movement beyond the slop before the delay cancels activation', async ({ page }) => {
    const item = getItem(page, 'alpha');
    const box = await boxOf(item);
    const point = touchGrabPoint(box);

    await dispatchTouch(page, 'touchStart', point);
    await dispatchTouch(page, 'touchMove', { x: point.x, y: point.y + 20 });
    await page.waitForTimeout(500);

    expect(await getCount(page, 'Drag start count')).toBe(0);
    expect(await getDraggingKey(page)).toBe('');

    await dispatchTouch(page, 'touchEnd');
  });

  test('an activated touch drag can reorder', async ({ page }) => {
    const orderBefore = await getOrder(page);
    const from = touchGrabPoint(await boxOf(getItem(page, 'alpha')));
    const to = center(await boxOf(getItem(page, 'delta')));

    await dispatchTouch(page, 'touchStart', from);
    await waitForDraggingKey(page, 'alpha');

    const steps = 8;
    for (let i = 1; i <= steps; i += 1) {
      // eslint-disable-next-line no-await-in-loop -- touch moves must be sent in order, one at a time
      await dispatchTouch(page, 'touchMove', {
        x: from.x + ((to.x - from.x) * i) / steps,
        y: from.y + ((to.y - from.y) * i) / steps,
      });
    }
    await dispatchTouch(page, 'touchEnd');

    expect(await getCount(page, 'Drag end count')).toBe(1);
    expect(await getOrder(page)).not.toEqual(orderBefore);
  });

  test('after activation, further movement produces no native gesture scrolling beyond library autoscroll', async ({
    page,
  }) => {
    const container = page.getByRole('list', { name: 'Reorder items' });
    const containerBox = await boxOf(container);
    const item = getItem(page, 'alpha');
    const box = await boxOf(item);
    const point = touchGrabPoint(box);

    await dispatchTouch(page, 'touchStart', point);
    await waitForDraggingKey(page, 'alpha');

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

test.describe('cancellation and cleanup', () => {
  test('Escape cancels an active drag, leaving no dragging state and firing onDragEnd exactly once', async ({
    page,
  }) => {
    const from = center(await boxOf(getItem(page, 'alpha')));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 20, from.y, { steps: 4 });
    expect(await getDraggingKey(page)).toBe('alpha');

    await page.keyboard.press('Escape');

    expect(await getDraggingKey(page)).toBe('');
    expect(await getCount(page, 'Drag end count')).toBe(1);

    await page.mouse.up();
    expect(await getCount(page, 'Drag end count')).toBe(1);
  });

  test('Escape after a completed live move rolls the active item back to its initial index', async ({
    page,
  }) => {
    const orderBefore = await getOrder(page);
    const from = center(await boxOf(getItem(page, 'alpha')));
    const to = center(await boxOf(getItem(page, 'delta')));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 12 });

    await expect.poll(() => getOrder(page)).not.toEqual(orderBefore);

    await page.keyboard.press('Escape');

    await expect.poll(() => getOrder(page)).toEqual(orderBefore);
    expect(await getDraggingKey(page)).toBe('');

    await page.mouse.up();
  });

  test.describe('second pointer', () => {
    test.use({ hasTouch: true });

    test('cancels a pending session when it starts outside the container', async ({ page }) => {
      const from = center(await boxOf(getItem(page, 'alpha')));

      await page.mouse.move(from.x, from.y);
      await page.mouse.down();

      await dispatchTouch(page, 'touchStart', { x: 2, y: 2 });
      await dispatchTouch(page, 'touchEnd');

      await page.mouse.move(from.x + 20, from.y, { steps: 4 });
      expect(await getCount(page, 'Drag start count')).toBe(0);

      await page.mouse.up();
    });

    test('cancels an active session when it starts outside the container', async ({ page }) => {
      const from = center(await boxOf(getItem(page, 'alpha')));

      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(from.x + 20, from.y, { steps: 4 });
      expect(await getDraggingKey(page)).toBe('alpha');

      await dispatchTouch(page, 'touchStart', { x: 2, y: 2 });
      await dispatchTouch(page, 'touchEnd');

      expect(await getDraggingKey(page)).toBe('');
      expect(await getCount(page, 'Drag end count')).toBe(1);
      expect((await getLastDragEnd(page))?.cancelled).toBe(true);

      await page.mouse.up();
    });
  });

  test('unmounting the container cancels an active drag deterministically and tears down every guard', async ({
    page,
  }) => {
    const from = center(await boxOf(getItem(page, 'alpha')));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 20, from.y, { steps: 4 });
    expect(await getDraggingKey(page)).toBe('alpha');

    // Unmounts only the reorder container while the Storybook page stays alive. Activated via
    // keyboard, not a pointer click: a real pointer click on this control would itself dispatch a
    // pointerdown observed as a second pointer, cancelling the drag for an unrelated reason before
    // the container ever unmounts. Keyboard activation of a button dispatches only a `click`, with
    // no preceding pointer event, isolating the container-removal cancellation path under test.
    await page.getByRole('button', { name: 'unmount container' }).focus();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('status', { name: 'container unmounted' })).toBeVisible();
    expect(await getDraggingKey(page)).toBe('');
    expect(await getCount(page, 'Drag end count')).toBe(1);
    expect((await getLastDragEnd(page))?.cancelled).toBe(true);

    // The physical pointer release that follows produces no further reorder callback: no release
    // watcher or click suppression remains attached to the removed container.
    await page.mouse.up();
    expect(await getCount(page, 'Drag end count')).toBe(1);
    expect(await getCount(page, 'Reorder count')).toBe(0);
  });

  test('active-item removal cancels the drag and reports finalIndex -1', async ({ page }) => {
    const from = center(await boxOf(getItem(page, 'alpha')));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 20, from.y, { steps: 4 });
    expect(await getDraggingKey(page)).toBe('alpha');

    // Focused only now, after the drag is already active: focusing a non-focusable drag item's
    // own mousedown would otherwise blur a control focused beforehand (the browser's own
    // mousedown focus-fixup). A real click on this control would itself be a second pointer,
    // cancelling the drag for an unrelated reason before the removal path under test ever runs,
    // so it is activated via keyboard instead.
    await page.getByRole('button', { name: 'remove active key' }).focus();
    await page.keyboard.press('Enter');

    await expect.poll(() => getCount(page, 'Drag end count')).toBe(1);
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
    const from = center(await boxOf(getItem(page, 'alpha')));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 20, from.y, { steps: 4 });
    expect(await getDraggingKey(page)).toBe('alpha');

    // Same held-pointer/keyboard-activation shape as the active-item-removal case above:
    // focused only after the drag is already active.
    await page.getByRole('button', { name: 'reverse order externally' }).focus();
    await page.keyboard.press('Enter');
    const reversedOrder = await getOrder(page);

    await expect.poll(() => getCount(page, 'Drag end count')).toBe(1);
    const lastDragEnd = await getLastDragEnd(page);
    expect(lastDragEnd?.cancelled).toBe(true);
    expect(await getDraggingKey(page)).toBe('');

    // The external mutation must stand exactly as applied; no library-issued rollback write.
    expect(await getOrder(page)).toEqual(reversedOrder);

    await page.mouse.up();
  });

  test('consumer rejection of a requested reorder cancels the session safely', async ({ page }) => {
    await page.getByRole('button', { name: 'reject next reorder' }).click();
    const orderBefore = await getOrder(page);

    const from = center(await boxOf(getItem(page, 'alpha')));
    const to = center(await boxOf(getItem(page, 'delta')));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 12 });

    await expect.poll(() => getCount(page, 'Reorder count')).toBeGreaterThan(0);
    await expect.poll(() => getCount(page, 'Drag end count')).toBe(1);

    const lastDragEnd = await getLastDragEnd(page);
    expect(lastDragEnd?.cancelled).toBe(true);
    expect(await getOrder(page)).toEqual(orderBefore);
    expect(await getDraggingKey(page)).toBe('');

    await page.mouse.up();
  });

  test('no drag/scroll behavior remains active after a completed session ends', async ({
    page,
  }) => {
    const from = center(await boxOf(getItem(page, 'alpha')));
    const to = center(await boxOf(getItem(page, 'bravo')));

    await mouseDrag(page, from, to, { steps: 8 });
    expect(await getCount(page, 'Drag end count')).toBe(1);

    const reorderCountAfterFirstDrag = await getCount(page, 'Reorder count');

    // Idle movement after the session ended must not trigger any further callback.
    await page.mouse.move(to.x + 5, to.y + 5, { steps: 3 });
    await page.waitForTimeout(200);

    expect(await getCount(page, 'Reorder count')).toBe(reorderCountAfterFirstDrag);
    expect(await getCount(page, 'Drag start count')).toBe(1);
    expect(await getDraggingKey(page)).toBe('');

    // A brand-new drag on a different item must still work, proving no stale session state.
    const nextFrom = center(await boxOf(getItem(page, 'charlie')));
    const nextTo = center(await boxOf(getItem(page, 'echo')));
    await mouseDrag(page, nextFrom, nextTo, { steps: 8 });

    expect(await getCount(page, 'Drag start count')).toBe(2);
    expect(await getCount(page, 'Drag end count')).toBe(2);
  });
});

test.describe('rapid drag and release', () => {
  test('a rapid drag-and-release completes as a single successful drag with no extra reorder afterward', async ({
    page,
  }) => {
    const orderBefore = await getOrder(page);
    const from = center(await boxOf(getItem(page, 'alpha')));
    const to = center(await boxOf(getItem(page, 'bravo')));

    await mouseDrag(page, from, to, { steps: 3 });

    await expect.poll(() => getCount(page, 'Drag end count')).toBe(1);
    const lastDragEnd = await getLastDragEnd(page);
    expect(lastDragEnd?.cancelled).toBe(false);
    expect(await getDraggingKey(page)).toBe('');
    expect(await getOrder(page)).not.toEqual(orderBefore);

    const reorderCountAfterSettle = await getCount(page, 'Reorder count');
    await page.waitForTimeout(200);

    expect(await getCount(page, 'Reorder count')).toBe(reorderCountAfterSettle);
    expect(await getCount(page, 'Drag end count')).toBe(1);
  });
});
