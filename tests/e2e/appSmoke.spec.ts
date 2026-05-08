import { expect, test } from '@playwright/test';
import { dismissStorageOnboarding, launchApp, openOpfs } from './helpers';

test('loads the app, dismisses storage onboarding, and opens the OPFS root', async ({ page }) => {
  await launchApp(page);

  await dismissStorageOnboarding(page);
  await expect(page.getByText(/^browser storage$/i)).toBeVisible();

  await openOpfs(page);
});

test('toggles Starter examples in Settings with Space and Enter', async ({ page }) => {
  await launchApp(page);
  await dismissStorageOnboarding(page);

  await page.getByRole('button', { name: /^settings$/i }).click();

  const starterExamplesCheckbox = page.getByRole('checkbox', { name: /starter examples/i });
  await expect(starterExamplesCheckbox).toBeVisible();
  await expect(starterExamplesCheckbox).toHaveAttribute('aria-checked', 'true');

  await starterExamplesCheckbox.focus();
  await page.keyboard.press('Space');
  await expect(starterExamplesCheckbox).toHaveAttribute('aria-checked', 'false');

  await page.keyboard.press('Enter');
  await expect(starterExamplesCheckbox).toHaveAttribute('aria-checked', 'true');
});

test('toggles Error diagnostics in Settings with Space and Enter when available', async ({
  page,
}) => {
  await launchApp(page);
  await dismissStorageOnboarding(page);

  await page.getByRole('button', { name: /^settings$/i }).click();

  const diagnosticsCheckbox = page.getByRole('checkbox', { name: /error diagnostics/i });
  await expect(diagnosticsCheckbox).toBeVisible();

  const disabled = await diagnosticsCheckbox.getAttribute('aria-disabled');
  if (disabled === 'true') {
    await expect(diagnosticsCheckbox).toHaveAttribute('aria-checked', 'false');
    return;
  }

  await expect(diagnosticsCheckbox).toHaveAttribute('aria-checked', 'false');

  await diagnosticsCheckbox.focus();
  await page.keyboard.press('Space');
  await expect(diagnosticsCheckbox).toHaveAttribute('aria-checked', 'true');

  await page.keyboard.press('Enter');
  await expect(diagnosticsCheckbox).toHaveAttribute('aria-checked', 'false');
});
