import { expect, test } from '@playwright/test';
import { openStory } from '../../../../tests/e2e/visual/storybook';

test('Snackbar inverse color ownership matches the canonical context', async ({ page }) => {
  await openStory(page, 'shared-ui-snackbar-mdsnackbar--action-color-ownership');
  await expect(page.getByTestId('snackbar-color-ownership')).toHaveScreenshot(
    'md-snackbar-color-ownership.png',
    { animations: 'disabled' },
  );
});

test('Snackbar action renders inverse-primary hover feedback', async ({ page }) => {
  await openStory(page, 'shared-ui-snackbar-mdsnackbar--action-color-ownership');
  const snackbar = page.getByTestId('snackbar-color-ownership');
  await page.getByRole('button', { name: 'Undo' }).hover();
  await expect(snackbar).toHaveScreenshot('md-snackbar-action-hover.png', {
    animations: 'disabled',
  });
});

test('Snackbar action renders inverse-primary keyboard-focus feedback', async ({ page }) => {
  await openStory(page, 'shared-ui-snackbar-mdsnackbar--action-color-ownership');
  const snackbar = page.getByTestId('snackbar-color-ownership');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Undo' })).toBeFocused();
  await expect(snackbar).toHaveScreenshot('md-snackbar-action-focus.png', {
    animations: 'disabled',
  });
});

test('Snackbar action renders inverse-primary pressed feedback', async ({ page }) => {
  await openStory(page, 'shared-ui-snackbar-mdsnackbar--action-color-ownership');
  const snackbar = page.getByTestId('snackbar-color-ownership');
  const action = page.getByRole('button', { name: 'Undo' });
  const box = await action.boundingBox();
  if (!box) throw new Error('Missing Snackbar action geometry.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(snackbar).toHaveScreenshot('md-snackbar-action-pressed.png', {
    animations: 'disabled',
  });
  await page.mouse.up();
});
