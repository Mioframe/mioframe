import { expect, test } from '@playwright/test';
import { openOpfs } from './helpers';

test('loads the app and opens the OPFS root through the UI', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Origin private file system', { exact: true })).toBeVisible();

  await openOpfs(page);
});
