import { expect, test } from '@playwright/test';
import { launchApp } from '../../../tests/e2e/helpers';

declare global {
  interface Window {
    persistCalledForTest?: () => boolean;
  }
}

test('first app startup does not call navigator.storage.persist()', async ({ page }) => {
  await page.addInitScript(() => {
    let persistCalled = false;
    StorageManager.prototype.persist = function persist(this: StorageManager): Promise<boolean> {
      persistCalled = true;
      return Promise.resolve(false);
    };
    window.persistCalledForTest = () => persistCalled;
  });

  await launchApp(page);

  const persistCalled = await page.evaluate(() => window.persistCalledForTest?.() ?? false);
  expect(persistCalled).toBe(false);
});

test('home widget action click calls navigator.storage.persist()', async ({ page }) => {
  await page.addInitScript(() => {
    let persistCalled = false;
    StorageManager.prototype.persist = function persist(this: StorageManager): Promise<boolean> {
      persistCalled = true;
      return Promise.resolve(false);
    };
    StorageManager.prototype.persisted = function persisted(
      this: StorageManager,
    ): Promise<boolean> {
      return Promise.resolve(false);
    };
    window.persistCalledForTest = () => persistCalled;
  });

  await launchApp(page);
  await expect(page.getByText(/enable more reliable storage/i)).toBeVisible();

  await page
    .getByText(/enable more reliable storage/i)
    .first()
    .click();

  const persistCalled = await page.evaluate(() => window.persistCalledForTest?.() ?? false);
  expect(persistCalled).toBe(true);
});
