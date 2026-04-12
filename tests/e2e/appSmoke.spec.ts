import { expect, test } from '@playwright/test';
import { completeStorageOnboarding, openOpfs } from './helpers';

test('loads the app and opens the OPFS root through the UI', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('dialog', { name: /protect your stored files from deletion/i }),
  ).toBeVisible();
  await completeStorageOnboarding(page);
  await expect(page.getByText(/origin private file system/i)).toBeVisible();

  await openOpfs(page);
});
