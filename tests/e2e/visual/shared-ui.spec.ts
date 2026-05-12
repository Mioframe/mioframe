import { expect, test } from '@playwright/test';
import { disableAnimations, openStory } from './storybook';

test('MDCheckbox visual states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdcheckbox--visual-states');
  await disableAnimations(page);

  const surface = page.getByTestId('visual-md-checkbox-states');

  await expect(surface).toHaveScreenshot('md-checkbox-states.png');
});

test('MDCheckbox interaction states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdcheckbox--visual-interaction-states');
  await disableAnimations(page);

  await page.locator('label[for="storybook-md-checkbox-hover"]').hover();
  await page.locator('label[for="storybook-md-checkbox-focus"]').focus();

  const defaultSurface = page.getByTestId('visual-md-checkbox-interaction-states');

  await expect(defaultSurface).toHaveScreenshot('md-checkbox-interaction-states-default.png');

  await page.locator('label[for="storybook-md-checkbox-readonly-hover"]').hover();
  await page.locator('label[for="storybook-md-checkbox-readonly-focus"]').focus();

  await expect(defaultSurface).toHaveScreenshot('md-checkbox-interaction-states-readonly.png');
});

test('MDFab visual states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdfab--visual-states');
  await disableAnimations(page);

  const surface = page.getByTestId('visual-md-fab-states');

  await expect(surface).toHaveScreenshot('md-fab-states.png');
});

test('MDFab interaction states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdfab--visual-interaction-states');
  await disableAnimations(page);

  await page.getByRole('button', { name: 'Primary hover target' }).hover();
  await page.getByRole('button', { name: 'Focus target' }).focus();

  const surface = page.getByTestId('visual-md-fab-interaction-states');

  await expect(surface).toHaveScreenshot('md-fab-interaction-states.png');
});
