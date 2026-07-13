import { expect, test } from '@playwright/test';
import { boxOf, center, getDraggingKey, mouseDrag } from './reorder.testUtils';
import { openStory } from './storybook.testUtils';

/** The nested registered-item activator-ownership story. */
const STORY_ID = 'shared-lib-reorder-reordernesteditemsstoryharness--default';

test.beforeEach(async ({ page }) => {
  await openStory(page, STORY_ID);
});

test('a nested child activator activates the child, never the enclosing parent', async ({
  page,
}) => {
  const handle = page.getByRole('button', { name: 'child handle' });
  const from = center(await boxOf(handle));

  await mouseDrag(page, from, { x: from.x + 40, y: from.y }, { release: false });

  expect(await getDraggingKey(page)).toBe('child');
  await expect(page.getByLabel('Last drag start key')).toHaveText('child');

  await page.mouse.up();
});

test('non-interactive parent content still activates the parent by default, unaffected by the nested child activator', async ({
  page,
}) => {
  const content = page.getByRole('button', { name: 'parent content' });
  const from = center(await boxOf(content));

  await mouseDrag(page, from, { x: from.x + 40, y: from.y }, { release: false });

  expect(await getDraggingKey(page)).toBe('parent');
  await expect(page.getByLabel('Last drag start key')).toHaveText('parent');

  await page.mouse.up();
});

test('a native parent control remains blocked from activation when the parent owns no activator', async ({
  page,
}) => {
  const button = page.getByRole('button', { name: 'parent button' });
  const from = center(await boxOf(button));

  // Release well clear of the button's own box so this gesture's own mouseup cannot itself
  // register as a click; only the explicit `.click()` below should count.
  await mouseDrag(page, from, { x: from.x + 40, y: from.y + 80 });

  expect(await getDraggingKey(page)).toBe('');

  await button.click();
  await expect(page.getByLabel('Parent button click count')).toHaveText('1');
});
