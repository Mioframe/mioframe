import { expect, test } from '@playwright/test';
import { launchApp, openOpfs } from '../helpers';

// Validates the published production artifact itself (base path, SPA
// fallback, critical assets, PWA manifest sanity), not internal build or
// Workbox implementation details. See docs/release.md#production-artifact-validation.

test('opens under the configured GitHub Pages base path with no broken critical assets', async ({
  page,
  baseURL,
}) => {
  const failedResponses: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400 && response.url().startsWith(baseURL ?? '')) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  await launchApp(page);

  expect(page.url()).toContain(new URL(baseURL ?? '').pathname);
  expect(failedResponses).toEqual([]);
});

test('links a fetchable PWA manifest scoped to the base path', async ({ page, baseURL }) => {
  await launchApp(page);

  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).toBeTruthy();

  const manifestUrl = new URL(manifestHref ?? '', baseURL);
  const response = await page.request.get(manifestUrl.toString());
  expect(response.ok()).toBe(true);

  const manifest = await response.json();
  expect(typeof manifest.name).toBe('string');
  expect(String(manifest.start_url ?? manifest.scope ?? '')).toContain(
    new URL(baseURL ?? '').pathname,
  );
});

test('does not throw a page error on first launch with the service worker registered', async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await launchApp(page);
  await openOpfs(page);

  expect(pageErrors).toEqual([]);
});

test('reloading after a deep client route falls back to the app instead of a broken page', async ({
  page,
  baseURL,
}) => {
  await launchApp(page);
  await openOpfs(page);

  const deepUrl = page.url();
  expect(deepUrl).not.toBe(baseURL);

  // A real navigation (not client-side routing) hits the artifact server
  // directly, which has no physical file for this deep route and returns
  // the site-wide SPA fallback with a 404 status.
  await page.goto(deepUrl);

  await expect(page.getByRole('button', { name: /^add$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /not found|404/i })).toHaveCount(0);
});
