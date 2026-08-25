import { expect, test } from '@playwright/test';
import { launchApp } from '../../helpers';

test('Settings shows one App updates entry and no inline update controls', async ({ page }) => {
  await launchApp(page);
  await page.getByRole('button', { name: /^settings$/i }).click();

  await expect(page.getByRole('button', { name: /^app updates/i })).toBeVisible();
  // The inline Automatic-updates switch and per-status action row no longer
  // live directly in Settings — only the one concise entry above.
  await expect(page.getByRole('switch', { name: /automatic updates/i })).toHaveCount(0);
});
