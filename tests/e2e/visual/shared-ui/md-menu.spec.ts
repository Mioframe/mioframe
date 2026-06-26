import { expect, test } from '@playwright/test';
import { openStory } from '../storybook';

test('MDMenu renders the surface, leading icon, label, and submenu trailing icon', async ({
  page,
}) => {
  await openStory(page, 'shared-ui-mdmenu--with-submenu');

  await page.getByRole('button', { name: 'Open menu' }).click();

  const surface = page.locator('.md-menu');
  await expect(surface).toBeVisible();

  const items = surface.locator('.md-menu-item-base');
  await expect(items).toHaveCount(3);

  await expect(items.nth(1).locator('.md-menu-item-base__leading')).toBeVisible();
  await expect(items.nth(2).locator('.md-menu-item-base__trailing')).toBeVisible();
  await expect(items.nth(0).locator('.md-menu-item-base__trailing')).toHaveCount(0);

  // No List-owned DOM (MDListContainer was removed; Menu must not depend on it).
  await expect(page.locator('.md-list, .md-list-item')).toHaveCount(0);
});

test('MDMenu submenu opens to the right of its parent item and traps focus inside itself', async ({
  page,
}) => {
  await openStory(page, 'shared-ui-mdmenu--with-submenu');

  await page.getByRole('button', { name: 'Open menu' }).click();

  const parentItem = page.getByRole('menuitem', { name: 'Has submenu' });
  await parentItem.click();

  const submenu = page.locator('.md-menu').nth(1);
  await expect(submenu).toBeVisible();

  const parentBox = await parentItem.boundingBox();
  const submenuBox = await submenu.boundingBox();

  expect(parentBox).not.toBeNull();
  expect(submenuBox).not.toBeNull();

  if (!parentBox || !submenuBox) {
    throw new Error('Missing bounding boxes for MDMenu submenu positioning test.');
  }

  // placement="right-start": the submenu surface starts at or after the parent
  // item's right edge.
  expect(submenuBox.x).toBeGreaterThanOrEqual(parentBox.x + parentBox.width - 1);

  // The submenu's own focus trap owns keyboard navigation: ArrowDown must move focus
  // between the submenu's own items, not bubble out to the parent menu.
  const submenuItems = submenu.locator('.md-menu-item-base');
  await expect(submenuItems).toHaveCount(2);
  await submenuItems.first().focus();
  await page.keyboard.press('ArrowDown');
  await expect(submenuItems.nth(1)).toBeFocused();
});
