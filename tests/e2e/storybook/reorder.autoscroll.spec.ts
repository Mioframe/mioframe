import { expect, test } from '@playwright/test';
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

const BORDERED_VIEWPORT_STORY_ID =
  'shared-lib-reorder-reorderborderedviewportstoryharness--default';
const VIEWPORT_SCROLL_STORY_ID = 'shared-lib-reorder-reorderviewportscrollstoryharness--default';

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

test.beforeEach(async ({ page }) => {
  await openStory(page, STORY_ID);
});

test.describe('autoscroll', () => {
  test('scrolls the reorder container itself near its edge', async ({ page }) => {
    const container = page.getByRole('list', { name: 'Reorder items' });
    const containerBox = await boxOf(container);
    const scrollTopBefore = await container.evaluate((el) => el.scrollTop);

    const from = center(await boxOf(getItem(page, 'alpha')));

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
    const container = page.getByRole('list', { name: 'Reorder items' });
    const scrollAncestor = page.getByRole('region', { name: 'Reorder scroll ancestor' });
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

    const from = center(await boxOf(getItem(page, 'alpha')));
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
    const container = page.getByRole('list', { name: 'Reorder items' });
    const containerBox = await boxOf(container);
    const scrollTopBefore = await container.evaluate((el) => el.scrollTop);
    const orderBefore = await getOrder(page);

    const containerExtent = await container.evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(containerExtent).toBeGreaterThan(0);

    const from = center(await boxOf(getItem(page, 'alpha')));

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
    await expect
      .poll(() => getOrder(page), { timeout: autoscrollBudgetMs(containerExtent) })
      .not.toEqual(orderBefore);

    await page.mouse.up();
  });

  test('an external order mutation while autoscrolling cancels before any further scroll movement, and the container stays stable', async ({
    page,
  }) => {
    const container = page.getByRole('list', { name: 'Reorder items' });
    const containerBox = await boxOf(container);
    const scrollTopBefore = await container.evaluate((el) => el.scrollTop);

    // Precondition: real scroll room must exist, otherwise "scrolling has begun" below would be
    // vacuously satisfied.
    const containerExtent = await container.evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(containerExtent).toBeGreaterThan(0);

    const from = center(await boxOf(getItem(page, 'alpha')));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x, containerBox.y + containerBox.height - 4, { steps: 6 });

    // 1. Confirm autoscroll has actually begun before triggering the external mutation.
    await expect
      .poll(() => container.evaluate((el) => el.scrollTop), {
        timeout: autoscrollBudgetMs(containerExtent),
      })
      .toBeGreaterThan(scrollTopBefore);

    // 2. Trigger the external, non-library-issued order mutation. Focused only now, after the
    // drag is already active: focusing a non-focusable drag item's own mousedown would otherwise
    // blur a control focused beforehand (the browser's own mousedown focus-fixup). A real click
    // on this control would itself be a second pointer, cancelling the drag for an unrelated
    // reason before the mutation path under test ever runs, so it is activated via keyboard
    // instead.
    await page.getByRole('button', { name: 'reverse order externally' }).focus();
    await page.keyboard.press('Enter');
    const orderAfterMutation = await getOrder(page);

    // 3. Exactly one cancelled onDragEnd.
    await expect.poll(() => getCount(page, 'Drag end count'), { timeout: 10000 }).toBe(1);
    const lastDragEnd = await getLastDragEnd(page);
    expect(lastDragEnd?.cancelled).toBe(true);
    const reorderCountAtCancellation = await getCount(page, 'Reorder count');

    // 4. `draggingKey` is cleared.
    expect(await getDraggingKey(page)).toBe('');

    // 5. The library never rolls back or overwrites the externally supplied order: the order read
    // back now still matches the externally mutated order from step 2.
    expect(await getOrder(page)).toEqual(orderAfterMutation);

    // 6. No later `onReorder` callback occurs, immediately after cancellation.
    expect(await getCount(page, 'Reorder count')).toBe(reorderCountAtCancellation);

    // 7. The container's scroll position stays stable through a bounded observation window. The
    // exact "no library scroll write after synchronous cancellation" guarantee is covered at the
    // unit/orchestration layer (see `PointerSession.test.ts`); this proves the resulting
    // browser-visible outcome instead.
    const scrollTopAtCancellation = await container.evaluate((el) => el.scrollTop);
    await page.waitForTimeout(300);
    expect(await container.evaluate((el) => el.scrollTop)).toBe(scrollTopAtCancellation);

    // Still no late `onReorder` callback after the observation window.
    expect(await getCount(page, 'Reorder count')).toBe(reorderCountAtCancellation);

    // 8. Releasing the still-held physical pointer afterward does not fire another onDragEnd or
    // a late `onReorder` callback.
    await page.mouse.up();
    expect(await getCount(page, 'Drag end count')).toBe(1);
    expect(await getCount(page, 'Reorder count')).toBe(reorderCountAtCancellation);
  });

  test.describe('viewport fallback', () => {
    test.use({ viewport: { width: 500, height: 320 } });

    test('falls back to the page viewport once the container and its scrollable ancestor are both exhausted', async ({
      page,
    }) => {
      await openStory(page, VIEWPORT_SCROLL_STORY_ID);

      const container = page.getByRole('list', { name: 'Reorder items' });
      const scrollAncestor = page.getByRole('region', { name: 'Reorder scroll ancestor' });

      const containerExtent = await container.evaluate((el) => el.scrollHeight - el.clientHeight);
      const ancestorExtent = await scrollAncestor.evaluate(
        (el) => el.scrollHeight - el.clientHeight,
      );
      const documentExtent = await page.evaluate(() => {
        const scrollingElement = document.scrollingElement ?? document.documentElement;
        return scrollingElement.scrollHeight - window.innerHeight;
      });

      // Preconditions: this dedicated fixture must actually produce a genuinely scrollable
      // viewport, on top of a scrollable inner container and ancestor; otherwise
      // "window.scrollY increases" below would be structurally unreachable regardless of
      // production behavior.
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

      const item = page.getByRole('listitem', { name: 'one' });
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

    const container = page.getByRole('list', { name: 'Bordered viewport reorder items' });
    const containerBox = await boxOf(container);
    const scrollTopBefore = await container.evaluate((el) => el.scrollTop);

    const item = page.getByRole('listitem', { name: 'one' });
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
