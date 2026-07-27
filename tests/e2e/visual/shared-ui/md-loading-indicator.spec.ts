import { expect, test } from '@playwright/test';
import { openStory } from '../storybook';

test('MDLoadingIndicator size matrix matches the canonical baseline', async ({ page }) => {
  await openStory(page, 'material-3-components-loading-indicator-mdloadingindicator--size-matrix');
  const surface = page.getByTestId('visual-md-loading-indicator-sizes');

  await expect(surface).toHaveScreenshot('md-loading-indicator-sizes.png');
});

test('MDLoadingIndicator inherited color matches the canonical baseline', async ({ page }) => {
  await openStory(
    page,
    'material-3-components-loading-indicator-mdloadingindicator--inherited-color-on-colored-surfaces',
  );
  const surface = page.getByTestId('visual-md-loading-indicator-inherited-color');

  await expect(surface).toHaveScreenshot('md-loading-indicator-inherited-color.png');
});
