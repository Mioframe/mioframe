import { expect, test } from '@playwright/test';
import { openStory } from './storybook.testUtils';

const STORY_ID = 'shared-ui-mdmenubase--lifecycle-regression';

test('reopens a persistent menu after close without a stale interaction closing it, keeping nested teleported content inside', async ({
  page,
}) => {
  await openStory(page, STORY_ID);

  const openButton = page.getByRole('button', { name: 'Open menu' });
  const menu = page.getByRole('group', { name: 'Lifecycle regression menu' });
  const selectAButton = page.getByRole('button', { name: 'Select A' });
  const openNestedButton = page.getByRole('button', { name: 'Open nested menu' });
  const nestedMenu = page.getByRole('group', { name: 'Nested lifecycle menu' });
  const pickNestedButton = page.getByRole('button', { name: 'Pick nested action' });

  // 1. open a menu
  await openButton.click();
  await expect(menu).toBeVisible();

  // an internal interaction (opening the nested menu) does not close the overlay
  await openNestedButton.click();
  await expect(nestedMenu).toBeVisible();
  await expect(menu).toBeVisible();

  // interaction inside a registered child teleport does not close the parent overlay
  await pickNestedButton.click();
  await expect(page.getByText('Nested pick activated 1 time(s)')).toBeVisible();
  await expect(menu).toBeVisible();
  await expect(
    page.getByText('Menu closed by outside interaction 0 time(s)', { exact: true }),
  ).toBeVisible();

  // 3. close it through the existing user action
  await selectAButton.click();
  await expect(menu).toHaveCount(0);
  await expect(page.getByText('Select A activated 1 time(s)')).toBeVisible();

  // 4. immediately reopen the same persistent menu instance
  await openButton.click();
  await expect(menu).toBeVisible();

  // 5/6/7: no event from the previous opening or close closes the reopened menu,
  // and clicking an item in it performs the intended action exactly once
  await selectAButton.click();
  await expect(menu).toHaveCount(0);
  await expect(page.getByText('Select A activated 2 time(s)')).toBeVisible();
});

test('an outside click closes the menu and still performs the outside control own action', async ({
  page,
}) => {
  await openStory(page, STORY_ID);

  const openButton = page.getByRole('button', { name: 'Open menu' });
  const menu = page.getByRole('group', { name: 'Lifecycle regression menu' });
  const outsideButton = page.getByRole('button', { name: 'Outside action' });

  await openButton.click();
  await expect(menu).toBeVisible();

  await outsideButton.click();
  await expect(menu).toHaveCount(0);
  await expect(page.getByText('Outside action activated 1 time(s)')).toBeVisible();
  await expect(
    page.getByText('Menu closed by outside interaction 1 time(s)', { exact: true }),
  ).toBeVisible();
});

test('repeated wheel and keydown events after closing do not emit duplicate closing side effects', async ({
  page,
}) => {
  await openStory(page, STORY_ID);

  const openButton = page.getByRole('button', { name: 'Open menu' });
  const menu = page.getByRole('group', { name: 'Lifecycle regression menu' });
  const outsideButton = page.getByRole('button', { name: 'Outside action' });

  await openButton.click();
  await expect(menu).toBeVisible();

  await outsideButton.click();
  await expect(menu).toHaveCount(0);
  await expect(
    page.getByText('Menu closed by outside interaction 1 time(s)', { exact: true }),
  ).toBeVisible();

  await page.mouse.wheel(0, 100);
  await page.mouse.wheel(0, 100);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');

  await expect(
    page.getByText('Menu closed by outside interaction 1 time(s)', { exact: true }),
  ).toBeVisible();
});

test('a touch tap outside does not emit a duplicate closing side effect for the synthesized click', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'touchstart-then-click compatibility clicks only happen on touch devices');

  await openStory(page, STORY_ID);

  const openButton = page.getByRole('button', { name: 'Open menu' });
  const menu = page.getByRole('group', { name: 'Lifecycle regression menu' });
  const outsideButton = page.getByRole('button', { name: 'Outside action' });

  await openButton.tap();
  await expect(menu).toBeVisible();

  await outsideButton.tap();
  await expect(menu).toHaveCount(0);
  await expect(
    page.getByText('Menu closed by outside interaction 1 time(s)', { exact: true }),
  ).toBeVisible();
});
