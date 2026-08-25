import { expect, test } from '@playwright/test';
import { openStory } from '../../../../tests/e2e/visual/storybook';

test('Rich Tooltip anatomy and Material action color ownership match the canonical context', async ({
  page,
}) => {
  await openStory(page, 'shared-ui-overlay--lifecycle-regression');
  await page.getByRole('button', { name: 'Open rich tooltip' }).click();
  await expect(page.locator('.md-rich-tooltip')).toHaveScreenshot(
    'md-rich-tooltip-color-ownership.png',
    { animations: 'disabled' },
  );
});
