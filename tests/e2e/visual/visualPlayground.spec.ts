import { expect, test } from '@playwright/test';
import { getBaseURL } from '../helpers';

test.describe('visual playground runtime', () => {
  test('opens without product app shell', async ({ page }) => {
    await page.goto(`${getBaseURL()}/visual-playground.html#/playground`);

    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('link', { name: /^select$/i })).toBeVisible();
    await expect(page.getByText(/^browser storage$/i)).toHaveCount(0);
  });
});
