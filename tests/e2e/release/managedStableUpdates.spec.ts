import { expect, test } from '@playwright/test';
import { launchApp } from '../helpers';

const openAppUpdates = async (page: import('@playwright/test').Page) => {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.getByRole('button', { name: /^settings$/i }).click();
  await page.getByRole('button', { name: /app updates/i }).click();
  await expect(page.getByText('App updates', { exact: true }).last()).toBeVisible();
};

test('stable exposes factual managed-update status and Manual survives a full window reopen', async ({
  page,
  context,
}) => {
  await launchApp(page);
  await openAppUpdates(page);

  const automatic = page.getByRole('switch', { name: /automatic updates/i });
  await expect(automatic).toHaveAttribute('aria-checked', 'true');
  await automatic.click();
  await expect(automatic).toHaveAttribute('aria-checked', 'false');

  await page.close();
  const reopened = await context.newPage();
  await launchApp(reopened);
  await openAppUpdates(reopened);
  await expect(reopened.getByRole('switch', { name: /automatic updates/i })).toHaveAttribute(
    'aria-checked',
    'false',
  );
  await expect(reopened.getByText(/current version:/i)).toBeVisible();
});

test('a failed metadata check is never reported as Up to date', async ({ page, context }) => {
  await launchApp(page);
  await openAppUpdates(page);
  const checkForUpdates = page.getByRole('button', { name: /check for updates/i });
  await expect(checkForUpdates).toBeEnabled();
  await context.setOffline(true);
  await checkForUpdates.click();
  await expect(page.getByRole('heading', { name: /could not check for updates/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /up to date/i })).toHaveCount(0);
  await context.setOffline(false);
});

test('the stable controller does not provide navigation fallback for branch or PR paths', async ({
  page,
  baseURL,
}) => {
  await launchApp(page);
  // One page must navigate serially so each foreign-path response is observed before the next.
  for (const path of ['/branch/missing/', '/pr/999999/']) {
    const target = new URL(path, baseURL).toString();
    const responsePromise = page.waitForResponse((response) => response.url() === target);
    // eslint-disable-next-line no-await-in-loop -- One page must finish each foreign navigation before the next.
    await page.goto(target, { waitUntil: 'commit' }).catch(() => undefined);
    // eslint-disable-next-line no-await-in-loop -- The matching response belongs to this navigation.
    expect((await responsePromise).status()).toBe(404);
  }
});
