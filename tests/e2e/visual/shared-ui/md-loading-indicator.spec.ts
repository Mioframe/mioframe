import { expect, test } from '@playwright/test';
import { openStory } from '../storybook';

test('MDLoadingIndicator size matrix matches the canonical baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-loading-indicator-mdloadingindicator--size-matrix');
  const surface = page.getByTestId('visual-md-loading-indicator-sizes');

  await expect(surface).toHaveScreenshot('md-loading-indicator-sizes.png');
});

test('MDLoadingIndicator default and public color override match the canonical baseline', async ({
  page,
}) => {
  await openStory(
    page,
    'material-3-components-loading-indicator-mdloadingindicator--color-contract',
  );
  const surface = page.getByTestId('visual-md-loading-indicator-colors');

  await expect(surface).toHaveScreenshot('md-loading-indicator-colors.png');
});
