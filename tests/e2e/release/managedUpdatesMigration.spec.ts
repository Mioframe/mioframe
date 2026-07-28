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
// The new worker defers all release-file preparation past `install`
// (`decideInstallAction` returns `'defer-to-legacy-worker'` whenever no
// managed state exists yet and a previously-active worker is already
// controlling this channel — necessarily the legacy Workbox worker, since
// this code always persists managed state before any of its own instances
// reaches `active`). It does not call `skipWaiting()` either, so the still-
// active legacy worker's runtime-caching routes never race this worker's
// own install-time fetches. Preparation of the very first managed release
// only runs in `activate`, once the browser has promoted this worker on its
// own — which only happens after every legacy-controlled window closes.
// Wired into the `managed-updates` release-only verify label; a failure
// here fails `pnpm verify:release`.
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

      // The new controller worker must reach "waiting" — installed, but not
      // yet claiming anything — without ever calling `skipWaiting()` while
      // the legacy-controlled `legacyPage` is still open: the still-active
      // legacy worker's own runtime-caching routes would otherwise race its
      // install-time metadata/asset fetches.
      await freshPage.waitForFunction(
        () =>
          navigator.serviceWorker
            .getRegistration()
            .then((registration) => registration?.waiting != null),
        undefined,
        { timeout: 60_000 },
      );

      // The still-open legacy session remains controlled by the legacy
      // worker, completely undisturbed by the new worker reaching "waiting".
      await expect(legacyPage.getByText(/^browser storage$/i)).toBeVisible();
      const legacyControllerWhileWaiting = await legacyPage.evaluate(
        () => navigator.serviceWorker.controller?.scriptURL,
      );
      expect(legacyControllerWhileWaiting).toBe(legacyScriptUrl);
      expect(pageErrors).toEqual([]);

      // Only once every legacy-controlled window closes does ordinary
      // browser worker lifecycle promote the waiting managed worker; its
      // `activate` handler then fetches, validates, and fully prepares the
      // very first managed release before claiming any (now-new) clients.
      await legacyPage.close();
      await freshPage.close();

      const verifyPage = await context.newPage();
      await verifyPage.goto(server.url);
      await verifyPage.waitForFunction(
        () => navigator.serviceWorker.controller !== null,
        undefined,
        {
          timeout: 30_000,
        },
      );
      await expect(verifyPage.getByText(/^browser storage$/i)).toBeVisible();

      const controllerState = await verifyPage.evaluate(
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

      // The migrated managed release must also serve fully offline.
      await context.setOffline(true);
      await verifyPage.reload();
      await expect(verifyPage.getByText(/^browser storage$/i)).toBeVisible();
      await context.setOffline(false);

      await verifyPage.close();
      await context.close();
    } finally {
      await server.close();
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});
