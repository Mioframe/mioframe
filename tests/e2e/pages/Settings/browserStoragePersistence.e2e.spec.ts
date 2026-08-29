import { expect, test } from '@playwright/test';
import { launchApp } from '../../helpers';

test('settings contains a storage section with a checkbox-style item', async ({ page }) => {
  await launchApp(page);

  await page.getByRole('button', { name: /^settings$/i }).click();

  await expect(page.getByText(/^storage$/i)).toBeVisible();
  await expect(page.getByText(/more reliable browser storage/i).first()).toBeVisible();
});

test('settings persistent state is not interactive (disabled)', async ({ page }) => {
  await page.addInitScript(() => {
    StorageManager.prototype.persisted = function persisted(
      this: StorageManager,
    ): Promise<boolean> {
      return Promise.resolve(true);
    };
  });

  await launchApp(page);
  await page.getByRole('button', { name: /^settings$/i }).click();

  await expect(page.getByText(/more reliable browser storage/i).first()).toBeVisible();

  // The row must be non-interactive (disabled) once persistence is already granted.
  const storageRow = page.getByRole('checkbox', { name: /more reliable browser storage/i });
  await expect(storageRow).toBeDisabled();
});
