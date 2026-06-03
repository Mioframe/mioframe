import { expect, test } from '@playwright/test';
import { launchApp, openOpfs } from './helpers';

declare global {
  interface Window {
    __persistCalled?: () => boolean;
  }
}

test('first app startup does not call navigator.storage.persist()', async ({ page }) => {
  await page.addInitScript(() => {
    let persistCalled = false;
    StorageManager.prototype.persist = function persist(this: StorageManager): Promise<boolean> {
      persistCalled = true;
      return Promise.resolve(false);
    };
    window.__persistCalled = () => persistCalled;
  });

  await launchApp(page);

  const persistCalled = await page.evaluate(() => window.__persistCalled?.() ?? false);
  expect(persistCalled).toBe(false);
});

test('home screen shows browser storage reliability status', async ({ page }) => {
  await launchApp(page);

  await expect(page.getByText(/^browser storage$/i)).toBeVisible();
  await expect(
    page
      .getByText(
        /standard browser storage|enable more reliable storage|more reliable storage enabled|more reliable storage unavailable/i,
      )
      .first(),
  ).toBeVisible();
});

test('settings contains a storage section with a checkbox-style item', async ({ page }) => {
  await launchApp(page);

  await page.getByRole('button', { name: /^settings$/i }).click();

  await expect(page.getByText(/^storage$/i)).toBeVisible();
  await expect(page.getByText(/more reliable browser storage/i).first()).toBeVisible();
});

test('denial keeps the app usable and browser storage visible', async ({ page }) => {
  await page.addInitScript(() => {
    StorageManager.prototype.persist = function persist(this: StorageManager): Promise<boolean> {
      return Promise.resolve(false);
    };
    StorageManager.prototype.persisted = function persisted(
      this: StorageManager,
    ): Promise<boolean> {
      return Promise.resolve(false);
    };
  });

  await launchApp(page);

  await expect(page.getByText(/^browser storage$/i)).toBeVisible();
  await expect(page.getByText(/enable more reliable storage/i)).toBeVisible();

  await page
    .getByText(/enable more reliable storage/i)
    .first()
    .click();

  await expect(page.getByText(/^browser storage$/i)).toBeVisible();
  await expect(page.getByText(/enable more reliable storage/i)).toBeVisible();

  await openOpfs(page);
});
