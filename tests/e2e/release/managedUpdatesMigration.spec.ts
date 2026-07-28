import { expect, test } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildAndApplyLegacyStableDeploy,
  buildAndPublishManagedRelease,
  startManagedArtifactServer,
} from './fixtures/managedReleaseFixture.mjs';

const BASE_PATH = '/';

// Migration proof: a browser that already installed the exact previous
// generated (`generateSW`) Workbox worker must upgrade to the new managed
// `injectManifest` controller worker without unregistering or clearing
// storage, while the already-open old-worker session keeps working and the
// new controller initializes and pins a release for the next clean launch.
// See the managed pinned application updates feature, "Worker migration".
//
// KNOWN GAP (see docs/release.md#managed pinned application updates): while
// the legacy worker is still active, its Workbox runtime-caching routes
// intercept the new controller's own install-time fetches (`updates/
// latest.json`, release descriptors, and release asset files), breaking
// `runInstallPrerequisites` and causing the new worker's install to be
// discarded without ever activating. Proven via elimination: a trivial
// install (bypassing `runInstallPrerequisites` entirely) does activate and
// claim the still-open legacy page successfully in this exact scenario, so
// worker replacement itself is not the problem — install-time asset
// preparation racing another active worker's fetch interception is. Fixing
// this requires an explicit architecture decision (most likely: deferring
// release-file preparation to after activation, when this worker is the
// sole active controller and no longer competing for interception) — not a
// quick patch. This spec is intentionally NOT wired into `scripts/verify.mjs`
// until that decision is made and implemented; see the remaining Pass 8 item.
// Deliberately not `test.skip`/`.fixme`: this is a genuine, currently-failing
// proof of an unresolved architectural gap, not a test to silently ignore.
test('migrates from the frozen legacy generated Workbox worker to the managed controller worker', async ({
  browser,
}, testInfo) => {
  // Builds two real production artifacts via `vite build` in sequence,
  // which comfortably exceeds Playwright's default 30s test timeout.
  testInfo.setTimeout(180_000);
  const workDir = mkdtempSync(join(tmpdir(), 'managed-release-migration-work-'));

  try {
    await buildAndApplyLegacyStableDeploy({ workDir });
    const server = await startManagedArtifactServer({ workDir, basePath: BASE_PATH });

    try {
      const context = await browser.newContext({ baseURL: server.url });
      const legacyPage = await context.newPage();

      await legacyPage.goto(server.url);
      await expect(legacyPage.getByText(/^browser storage$/i)).toBeVisible();

      // The frozen legacy config never sets Workbox's `clientsClaim`, so
      // (per spec) a worker's very first activation never takes control of
      // the page that triggered its own registration — only a subsequent
      // navigation does. Wait for the worker to become active, then reload
      // once to become genuinely controlled, exactly like a real user's
      // first visit (online bootstrap) followed by a second visit
      // (offline-capable), before publishing the managed release on top.
      await legacyPage.evaluate(() => navigator.serviceWorker.ready);
      await legacyPage.reload();
      await expect(legacyPage.getByText(/^browser storage$/i)).toBeVisible();
      await legacyPage.waitForFunction(() => navigator.serviceWorker.controller !== null);
      const legacyScriptUrl = await legacyPage.evaluate(
        () => navigator.serviceWorker.controller?.scriptURL,
      );
      expect(legacyScriptUrl).toBeTruthy();

      // Prove the legacy worker actually caches the app for offline use,
      // establishing a real baseline before migration (not an approximation).
      await context.setOffline(true);
      await legacyPage.reload();
      await expect(legacyPage.getByText(/^browser storage$/i)).toBeVisible();
      await context.setOffline(false);

      // Publish the managed release on top of the same work directory —
      // no unregister, no storage clearing — matching a real stable rollout.
      const published = await buildAndPublishManagedRelease({
        channel: 'stable',
        basePath: BASE_PATH,
        appVersion: '2.0.0',
        buildId: 'managed-release-a',
        workDir,
      });

      // The already-open legacy session must not be force-reloaded or broken
      // just because a new controller worker was published.
      await expect(legacyPage.getByText(/^browser storage$/i)).toBeVisible();
      const pageErrors: string[] = [];
      legacyPage.on('pageerror', (error) => pageErrors.push(error.message));

      // A fresh navigation's own bootstrap calls `navigator.serviceWorker
      // .register()` with the same scriptURL again, which triggers the
      // browser's real byte-diff update check — this app never calls
      // `registration.update()` itself, so an explicit call here exercises
      // the same real mechanism deterministically rather than depending on
      // browser-internal scheduling, without reproducing the private
      // protocol (which this never touches).
      const freshPage = await context.newPage();
      await freshPage.goto(server.url);
      await expect(freshPage.getByText(/^browser storage$/i)).toBeVisible();
      await freshPage.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration?.update();
      });

      // The new controller worker claims clients — including the still-open
      // legacy page — only once its install prerequisites (fetch the new
      // worker script, then fetch and hash-validate every file in the first
      // managed release) succeed, a genuinely slower multi-step pipeline
      // than a bare byte-diff update check.
      await legacyPage.waitForFunction(
        (previousScriptUrl) => navigator.serviceWorker.controller?.scriptURL !== previousScriptUrl,
        legacyScriptUrl,
        { timeout: 60_000 },
      );
      await freshPage.waitForFunction(
        () => navigator.serviceWorker.controller !== null,
        undefined,
        {
          timeout: 30_000,
        },
      );

      expect(pageErrors).toEqual([]);

      const controllerState = await freshPage.evaluate(
        () =>
          new Promise<{ activeRelease?: { releaseId: string } } | undefined>((resolve) => {
            const request = indexedDB.open('mioframe-update-controller-stable');
            request.onsuccess = () => {
              const db = request.result;
              const tx = db.transaction('controllerState', 'readonly');
              const getRequest = tx.objectStore('controllerState').get('controllerState');
              getRequest.onsuccess = () => {
                db.close();
                resolve(getRequest.result);
              };
            };
          }),
      );
      expect(controllerState?.activeRelease?.releaseId).toBe(published.releaseId);

      await freshPage.close();
      await context.close();
    } finally {
      await server.close();
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});
