import { expect, test } from '@playwright/test';
import { launchApp } from './helpers';

const openAppUpdatesPane = async (page: Parameters<typeof launchApp>[0]) => {
  await launchApp(page);
  await page.getByRole('button', { name: /^settings$/i }).click();
  await page.getByRole('button', { name: /^app updates/i }).click();
  await expect(page.locator('.md-app-bar__headline', { hasText: /^app updates$/i })).toBeVisible();
};

test('Settings shows one App updates entry and no inline update controls', async ({ page }) => {
  await launchApp(page);
  await page.getByRole('button', { name: /^settings$/i }).click();

  await expect(page.getByRole('button', { name: /^app updates/i })).toBeVisible();
  // The inline Automatic-updates switch and per-status action row no longer
  // live directly in Settings — only the one concise entry above.
  await expect(page.getByRole('switch', { name: /automatic updates/i })).toHaveCount(0);
});

test('selecting the App updates entry opens the dedicated pane', async ({ page }) => {
  await openAppUpdatesPane(page);
});

test('back navigation from App updates returns to Settings', async ({ page }) => {
  await openAppUpdatesPane(page);

  await page
    .getByRole('button', { name: /^back$/i })
    .last()
    .click();

  await expect(page.locator('.md-app-bar__headline', { hasText: /^settings$/i })).toBeVisible();
});

test('shows the running version and disables update actions before any managed controller takes over the page', async ({
  page,
}) => {
  // No managed service worker has taken control of this very first
  // navigation yet (the controller worker never calls `clients.claim()`),
  // so the pane must show the capability-unavailable state and never claim
  // "Up to date" without ever having checked.
  await openAppUpdatesPane(page);
  const pane = page.locator('.app-updates-pane');

  await expect(pane.getByText(/updates unavailable/i)).toBeVisible();
  await expect(pane.getByText(/up to date/i)).toHaveCount(0);
  await expect(pane.getByText(/running version:/i)).toBeVisible();
  await expect(pane.getByRole('button', { name: /^check for updates$/i })).toBeDisabled();
});
