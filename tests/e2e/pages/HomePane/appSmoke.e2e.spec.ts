import { expect, test } from '@playwright/test';
import { launchApp, openOpfs } from '../../helpers';

test('loads the app and opens the OPFS root without any startup dialog', async ({ page }) => {
  await launchApp(page);

  await expect(page.getByText(/^browser storage$/i)).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await openOpfs(page);
});
