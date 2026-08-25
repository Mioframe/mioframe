import { expect, test } from '@playwright/test';
import { openStory } from '../../../../tests/e2e/storybook/storybook.testUtils';

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
  await expect(action.locator('.md-button__label-text')).toHaveCSS('color', 'rgb(208, 188, 255)');
  await expect(action).toHaveCSS('--md-comp-button-text-focused-label-text-color', '#d0bcff');
  await expect(action).toHaveCSS('--md-comp-button-text-focused-state-layer-color', '#d0bcff');

  await page.keyboard.press('Enter');
  await action.hover();
  await expect(action.locator('.md-button__label-text')).toHaveCSS('color', 'rgb(208, 188, 255)');
  await expect(action).toHaveCSS('--md-comp-button-text-hovered-label-text-color', '#d0bcff');
  await expect(action).toHaveCSS('--md-comp-button-text-hovered-state-layer-color', '#d0bcff');

  const box = await action.boundingBox();
  if (!box) throw new Error('Missing Snackbar action geometry.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(action.locator('.md-button__label-text')).toHaveCSS('color', 'rgb(208, 188, 255)');
  await expect(action).toHaveCSS('--md-comp-button-text-pressed-label-text-color', '#d0bcff');
  await expect(action).toHaveCSS('--md-comp-button-text-pressed-state-layer-color', '#d0bcff');
  await page.mouse.up();
});
