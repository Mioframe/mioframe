import { expect, test } from '@playwright/test';
import { openStory } from './storybook.testUtils';

test('Snackbar owns inverse surface, message, action, and close colors', async ({ page }) => {
  await openStory(page, 'shared-ui-snackbar-mdsnackbar--action-color-ownership');

  const snackbar = page.locator('.md-snackbar');
  const action = page.getByRole('button', { name: 'Undo' });
  const close = page.getByRole('button', { name: 'close' });

  await expect(snackbar).toHaveCSS('background-color', 'rgb(50, 47, 53)');
  await expect(snackbar.locator('.md-snackbar__text')).toHaveCSS('color', 'rgb(245, 239, 247)');
  await expect(action.locator('.md-button__label-text')).toHaveCSS('color', 'rgb(208, 188, 255)');
  await expect(close).toHaveCSS('color', 'rgb(245, 239, 247)');

  await action.focus();
  await expect(action).toBeFocused();
  await page.keyboard.press('Enter');
  await action.hover();
  await expect(action).toHaveCSS('--md-comp-button-text-hover-state-layer-color', '#d0bcff');

  const box = await action.boundingBox();
  if (!box) throw new Error('Missing Snackbar action geometry.');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
});
