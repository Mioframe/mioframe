import { expect, test } from '@playwright/test';
import { launchApp, openOpfs } from '../../../../tests/e2e/helpers';
import { buildAndServeOrdinaryBranchArtifact } from '../../../../tests/e2e/release/fixtures/ordinaryBranchArtifactFixture.mjs';

declare global {
  interface Window {
    /** Test-only counter installed by `page.addInitScript` to prove `MessageChannel` was never constructed. */
    __messageChannelConstructions?: number;
  }
}

// Validates the published production artifact itself (base path, SPA
// fallback, critical assets, PWA manifest sanity), not internal build or
// Workbox implementation details. See docs/release.md#production-artifact-validation.
//
// The deterministic emitted-file/manifest/generated-artifact assertions
// (forbidden-pattern chunk scan, managed controller worker
// skipWaiting()/clients.claim() check) never load a page or a browser, so
// they run as static tooling proof instead: see
// scripts/release/productionArtifactStaticProof.ts. Everything remaining
// below is browser-integration proof.

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

// Deterministic manifest content/scope validation (JSON validity, `name`,
// `start_url`/`scope` base-path scoping) does not need a browser, so it runs
// as static tooling proof instead: see
// scripts/release/productionArtifactStaticProof.ts's
// validateProductionArtifactManifest. This spec proves only the truthful
// browser/runtime contract: the built page actually links a manifest, and
// that linked resource is fetchable from the running server.
test('links a fetchable PWA manifest', async ({ page, baseURL }) => {
  await launchApp(page);

  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).toBeTruthy();

  const manifestUrl = new URL(manifestHref ?? '', baseURL);
  const response = await page.request.get(manifestUrl.toString());
  expect(response.ok()).toBe(true);
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
