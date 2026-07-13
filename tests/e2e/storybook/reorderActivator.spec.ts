import { expect, test } from '@playwright/test';
import {
  boxOf,
  center,
  dispatchTouch,
  getCount,
  getDraggingKey,
  mouseDrag,
  waitForDraggingKey,
} from './reorder.testUtils';
import { openStory } from './storybook.testUtils';

/** The compound-row activator story, shared by every test in this spec. */
const STORY_ID = 'shared-lib-reorder-reorderactivatorstoryharness--default';

test.beforeEach(async ({ page }) => {
  await openStory(page, STORY_ID);
});

test.describe('mouse activation', () => {
  test('starts a drag from the primary action inside the activator', async ({ page }) => {
    const primary = page.getByRole('button', { name: 'Alpha primary action' });
    const from = center(await boxOf(primary));

    await mouseDrag(page, from, { x: from.x + 40, y: from.y }, { release: false });

    expect(await getCount(page, 'Drag start count')).toBe(1);
    expect(await getDraggingKey(page)).toBe('alpha');

    await page.mouse.up();
  });

  test('a sub-threshold press on the primary action still clicks', async ({ page }) => {
    const primary = page.getByRole('button', { name: 'Alpha primary action' });
    const from = center(await boxOf(primary));

    // A press-and-release this small (below the 4px mouse activation threshold) both never
    // activates a drag and still lands as one native click on the button, the same way a real
    // user's imprecise click would; no separate explicit click is needed to observe it.
    await mouseDrag(page, from, { x: from.x + 2, y: from.y }, { steps: 1 });

    expect(await getCount(page, 'Drag start count')).toBe(0);
    expect(await getCount(page, 'Primary click count')).toBe(1);
  });

  test('the non-activator row area does not drag when the item has an activator', async ({
    page,
  }) => {
    const content = page.getByText('non-activator content').first();
    const from = center(await boxOf(content));

    await mouseDrag(page, from, { x: from.x + 40, y: from.y });

    expect(await getCount(page, 'Drag start count')).toBe(0);
    expect(await getDraggingKey(page)).toBe('');
  });

  test('the trailing action clicks and never drags', async ({ page }) => {
    const trailing = page.getByRole('button', { name: 'Alpha trailing action' });
    const from = center(await boxOf(trailing));

    await mouseDrag(page, from, { x: from.x + 40, y: from.y });
    expect(await getCount(page, 'Drag start count')).toBe(0);

    await trailing.click();
    expect(await getCount(page, 'Trailing click count')).toBe(1);
  });

  test('the ignored descendant nested inside the activator never drags', async ({ page }) => {
    const ignoreZone = page.getByRole('button', { name: 'Alpha activator ignore zone' });
    const from = center(await boxOf(ignoreZone));

    await mouseDrag(page, from, { x: from.x + 40, y: from.y });
    expect(await getCount(page, 'Drag start count')).toBe(0);

    await ignoreZone.click();
    expect(await getCount(page, 'Activator ignore click count')).toBe(1);
  });
});

test.describe('full-row activator', () => {
  test('starts a drag from the primary action on the row-level activator', async ({ page }) => {
    const primary = page.getByRole('button', { name: 'Charlie primary action' });
    const from = center(await boxOf(primary));

    await mouseDrag(page, from, { x: from.x + 40, y: from.y }, { release: false });

    expect(await getCount(page, 'Drag start count')).toBe(1);
    expect(await getDraggingKey(page)).toBe('charlie');

    await page.mouse.up();
  });

  test('the ignored settings control inside the row-level activator never drags and still clicks', async ({
    page,
  }) => {
    const settings = page.getByRole('button', { name: 'Charlie settings' });
    const from = center(await boxOf(settings));

    await mouseDrag(page, from, { x: from.x + 40, y: from.y });
    expect(await getCount(page, 'Drag start count')).toBe(0);
    expect(await getDraggingKey(page)).toBe('');

    await settings.click();
    expect(await getCount(page, 'Settings click count')).toBe(1);
  });
});

test.describe('touch activation', () => {
  test.use({ hasTouch: true });

  test('a long press on the activator starts a drag', async ({ page }) => {
    const primary = page.getByRole('button', { name: 'Alpha primary action' });
    const point = center(await boxOf(primary));

    await dispatchTouch(page, 'touchStart', point);
    await waitForDraggingKey(page, 'alpha');
    expect(await getCount(page, 'Drag start count')).toBe(1);

    await dispatchTouch(page, 'touchEnd');
  });

  test('touch on the trailing action does not start a drag', async ({ page }) => {
    const trailing = page.getByRole('button', { name: 'Alpha trailing action' });
    const point = center(await boxOf(trailing));

    await dispatchTouch(page, 'touchStart', point);
    // Held well past the configured long-press delay: still must never activate.
    await page.waitForTimeout(600);

    expect(await getCount(page, 'Drag start count')).toBe(0);
    expect(await getDraggingKey(page)).toBe('');

    await dispatchTouch(page, 'touchEnd');
  });
});
