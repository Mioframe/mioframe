import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { launchApp, openOpfs } from '../helpers';
import { buildAndServeOrdinaryBranchArtifact } from './fixtures/ordinaryBranchArtifactFixture.mjs';

declare global {
  interface Window {
    /** Test-only counter installed by `page.addInitScript` to prove `MessageChannel` was never constructed. */
    __messageChannelConstructions?: number;
  }
}

function collectJsFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return collectJsFiles(full);
    return entry.isFile() && ['.js', '.mjs'].includes(extname(entry.name)) ? [full] : [];
  });
}

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

// Managed pinned application updates feature: prove the normal production
// artifact never embeds the release-test-only legacy migration fixture, and
// that the compiled controller worker never embeds application release
// identity. Scans every emitted JS chunk, not only the main entry — the
// legacy fixture must only ever be reachable via the release-test-only
// `RELEASE_TEST_LEGACY_PWA_FIXTURE` env var, never present in the artifact
// this spec's own `dist/` was built from.
test('no chunk embeds the release-test-only legacy migration fixture or application release identity', () => {
  const forbiddenPatterns = [
    'RELEASE_TEST_LEGACY_PWA_FIXTURE',
    'legacyGeneratedWorkboxPwaConfig',
    '__RELEASE_ID__',
    '__RELEASE_SEQUENCE__',
  ];

  const jsFiles = collectJsFiles('dist');
  expect(jsFiles.length).toBeGreaterThan(0);

  const offenders: string[] = [];
  for (const file of jsFiles) {
    const content = readFileSync(file, 'utf8');
    for (const pattern of forbiddenPatterns) {
      if (content.includes(pattern)) {
        offenders.push(`${file}: ${pattern}`);
      }
    }
  }

  expect(offenders).toEqual([]);
});

// Managed pinned application updates feature, Correction 3 (managed-controller
// capability): an ordinary branch build (not stable, not the develop managed
// channel) never gets a managed controller worker — only the ordinary
// generated (`generateSW`) Workbox worker — so its `__MANAGED_APP_UPDATE_CHANNEL__`
// build-time define is `undefined`. The client must report managed updates
// unavailable immediately from that build-time fact alone, without ever
// constructing a `MessageChannel` to probe whatever controller (if any)
// happens to be present. Builds and serves a real, separate production
// artifact for this one branch build (the shared release artifact this
// spec file otherwise exercises is the stable managed channel).
test('an ordinary non-develop branch build (generated Workbox) reports managed updates unavailable without sending a managed controller message', async ({
  page,
}, testInfo) => {
  testInfo.setTimeout(120_000);
  let server: Awaited<ReturnType<typeof buildAndServeOrdinaryBranchArtifact>> | undefined;
  const previousExternalBaseUrl = process.env.PLAYWRIGHT_EXTERNAL_BASE_URL;

  try {
    server = await buildAndServeOrdinaryBranchArtifact({ channelId: 'feature-x' });
    process.env.PLAYWRIGHT_EXTERNAL_BASE_URL = server.url;

    // Records every `MessageChannel` construction this page ever performs,
    // installed before any application script runs. The capability probe is
    // the app's only user of `MessageChannel`; zero constructions is direct
    // proof the controller was never accessed or messaged at all.
    await page.addInitScript(() => {
      window.__messageChannelConstructions = 0;
      const OriginalMessageChannel = window.MessageChannel;
      class TrackedMessageChannel extends OriginalMessageChannel {
        constructor() {
          super();
          window.__messageChannelConstructions = (window.__messageChannelConstructions ?? 0) + 1;
        }
      }
      window.MessageChannel = TrackedMessageChannel;
    });

    await launchApp(page);
    await page.getByRole('button', { name: /^settings$/i }).click();
    await page.getByRole('button', { name: /^app updates/i }).click();
    const pane = page.locator('.app-updates-pane');

    await expect(pane.getByText(/updates unavailable/i)).toBeVisible();
    await expect(pane.getByRole('button', { name: /^check for updates$/i })).toBeDisabled();

    const messageChannelConstructions = await page.evaluate(
      () => window.__messageChannelConstructions ?? 0,
    );
    expect(messageChannelConstructions).toBe(0);
  } finally {
    process.env.PLAYWRIGHT_EXTERNAL_BASE_URL = previousExternalBaseUrl;
    await server?.close();
  }
});
