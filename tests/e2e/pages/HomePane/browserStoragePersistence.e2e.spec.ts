import { expect, test } from '@playwright/test';
import { launchApp, openOpfs } from '../../helpers';

test('home screen shows browser storage action or status item', async ({ page }) => {
  await launchApp(page);

  await expect(page.getByText(/^browser storage$/i)).toBeVisible();
  await expect(
    page
      .getByText(
        /standard browser storage|enable more reliable storage|more reliable storage unavailable/i,
      )
      .first(),
  ).toBeVisible();
});

test('home screen does not show a persistent enabled item when storage is already persistent', async ({
  page,
}) => {
  await page.addInitScript(() => {
    StorageManager.prototype.persisted = function persisted(
      this: StorageManager,
    ): Promise<boolean> {
      return Promise.resolve(true);
    };
  });

  await launchApp(page);

  await expect(page.getByText(/^browser storage$/i)).toBeVisible();
  // When persistent, no action item should be shown above the navigation item.
  await expect(page.getByText(/enable more reliable storage/i)).not.toBeVisible();
  await expect(page.getByText(/more reliable storage enabled/i)).not.toBeVisible();
});

test('persist() === false shows non-blocking user feedback', async ({ page }) => {
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

  await page
    .getByText(/enable more reliable storage/i)
    .first()
    .click();

  // Snackbar feedback for denial should appear.
  await expect(
    page.getByText(/did not enable more reliable storage|keep backups/i).first(),
  ).toBeVisible();
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

  const enableButton = page.getByRole('button', { name: /enable more reliable storage/i });
  await expect(page.getByText(/^browser storage$/i)).toBeVisible();
  await expect(enableButton).toBeVisible();

  await enableButton.click();

  // After denial the action button remains and the app is still usable.
  await expect(page.getByText(/^browser storage$/i)).toBeVisible();
  await expect(enableButton).toBeVisible();

  await openOpfs(page);
});
