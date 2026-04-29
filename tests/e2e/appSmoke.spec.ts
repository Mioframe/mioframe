import { expect, test } from '@playwright/test';
import { dismissStorageOnboarding, launchApp, openOpfs } from './helpers';

test('loads the app, dismisses storage onboarding, and opens the OPFS root', async ({ page }) => {
  await launchApp(page);

  await dismissStorageOnboarding(page);
  await expect(page.getByText(/^browser storage$/i)).toBeVisible();

  await openOpfs(page);
});
