import { expect, test } from '@playwright/test';
import { openStory } from '../../../../tests/e2e/visual/storybook';

test('MDCard visual states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdcard--visual-states');

  const surface = page.getByTestId('visual-md-card-states');

  await expect(surface).toHaveScreenshot('md-card-states.png');
});

test('MDCard interaction states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdcard--visual-interaction-states');

  const surface = page.getByTestId('visual-md-card-interaction-states');

  await expect(surface).toHaveScreenshot('md-card-interaction-states.png');
});
