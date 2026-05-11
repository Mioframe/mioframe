import { expect, test } from '@playwright/test';
import { disableAnimations, openStory } from './storybook';

test('MDCheckbox visual states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdcheckbox--visual-states');
  await disableAnimations(page);

  const surface = page.getByTestId('visual-md-checkbox-states');

  await expect(surface).toHaveScreenshot('md-checkbox-states.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
});

test('MDFab visual states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdfab--visual-states');
  await disableAnimations(page);

  const surface = page.getByTestId('visual-md-fab-states');

  await expect(surface).toHaveScreenshot('md-fab-states.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
});
