import { expect, test } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildAndApplyLegacyStableDeploy,
  buildAndPublishManagedRelease,
  corruptPublishedReleaseFile,
  startManagedArtifactServer,
} from './fixtures/managedReleaseFixture.mjs';

const BASE_PATH = '/';
const CONTROLLER_STATE_DB_NAME = 'mioframe-update-controller-stable';

// Migration proof: a browser that already installed the exact previous
// generated (`generateSW`) Workbox worker must upgrade to the new managed
// `injectManifest` controller worker without unregistering or clearing
// storage, while the already-open old-worker session keeps working.
//
// The managed controller worker uses the browser's ordinary Service Worker
// lifecycle for its own code: it never inspects `registration.active`, never
// distinguishes a legacy Workbox worker from an older managed one, and never
// calls `skipWaiting()`. When persisted managed state is absent, `install`
// unconditionally fetches, validates, and fully prepares the channel's
// first managed release — including while a legacy Workbox worker still
// controls the page that triggered registration — then finishes; ordinary
// browser lifecycle promotes it to "waiting", and only promotes it further
// to "active" once every previously-controlled window closes. See the
// managed pinned application updates feature.
//
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

      // Direct evidence that install-time release preparation genuinely
      // completed — not merely that `install` was allowed to finish for
      // some other reason: the release's own Cache Storage entry, complete
      // with a descriptor marker matching the published release, must
      // exist. Cache Storage is origin-scoped, so this is visible from the
      // ordinary page context even before this worker ever controls
      // anything. If the still-active legacy Workbox worker's own
      // runtime-caching routes intercepted this installing worker's
      // install-time `fetch()` calls, this cache would never become
      // complete and this assertion would fail or time out — the concrete
      // evidence the required workflow calls for either way.
      await freshPage.waitForFunction(
        async (releaseId) => {
          const cache = await caches.open(`stable-release-${releaseId}`);
          const marker = await cache.match(
            'https://mioframe.internal/__release-descriptor-marker__',
          );
          if (!marker) return false;
          const descriptor = await marker.json();
          return descriptor?.releaseId === releaseId;
        },
        published.releaseId,
        { timeout: 60_000 },
      );

      // The new controller worker must reach "waiting" — installed, but not
      // yet claiming anything — without ever calling `skipWaiting()` while
      // the legacy-controlled `legacyPage` is still open.
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
      // browser worker lifecycle promote the waiting managed worker to
      // "active". It never claims those closed clients (there are none left
      // to claim) or any subsequent one via `clients.claim()`; a fresh
      // navigation becomes controlled only on its own next request cycle.
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

// Failure case: the very first managed release fails install-time
// preparation (a hash mismatch against the server's own published bytes —
// e.g. storage corruption in transit). Installation must be rejected
// outright, per the browser's ordinary lifecycle: the still-active legacy
// worker must remain untouched and fully operational, and a later publish
// of a genuinely valid release must still succeed.
test('a failed first managed install leaves the legacy worker active and operational, and a later valid publish still succeeds', async ({
  browser,
}, testInfo) => {
  testInfo.setTimeout(180_000);
  const workDir = mkdtempSync(join(tmpdir(), 'managed-release-migration-failure-work-'));

  try {
    await buildAndApplyLegacyStableDeploy({ workDir });
    const server = await startManagedArtifactServer({ workDir, basePath: BASE_PATH });

    try {
      const context = await browser.newContext({ baseURL: server.url });
      const legacyPage = await context.newPage();

      await legacyPage.goto(server.url);
      await legacyPage.evaluate(() => navigator.serviceWorker.ready);
      await legacyPage.reload();
      await legacyPage.waitForFunction(() => navigator.serviceWorker.controller !== null);
      const legacyScriptUrl = await legacyPage.evaluate(
        () => navigator.serviceWorker.controller?.scriptURL,
      );

      const broken = await buildAndPublishManagedRelease({
        channel: 'stable',
        basePath: BASE_PATH,
        appVersion: '2.0.0',
        buildId: 'managed-release-broken',
        workDir,
      });
      // Corrupt the published asset's on-disk bytes after publishing: the
      // retained descriptor still declares the original SHA-256, so
      // install-time preparation's own hash validation genuinely fails —
      // exactly like storage corruption between publish and this browser's
      // fetch, not a fabricated protocol-level rejection.
      const firstFile = broken.files[0];
      if (!firstFile) throw new Error('Expected the built release to have at least one file');
      corruptPublishedReleaseFile(workDir, 'stable', firstFile.path);

      const freshPage = await context.newPage();
      await freshPage.goto(server.url);
      await freshPage.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration?.update();
      });

      // Give the browser ample time to attempt (and fail) installation, then
      // confirm it never reaches "installing" or "waiting" — a failed
      // `install` event leaves the registration with no new worker at all.
      await freshPage.waitForTimeout(10_000);
      const registrationAfterFailedInstall = await freshPage.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        return {
          installing: registration?.installing != null,
          waiting: registration?.waiting != null,
          controllerScriptUrl: navigator.serviceWorker.controller?.scriptURL,
        };
      });
      expect(registrationAfterFailedInstall.installing).toBe(false);
      expect(registrationAfterFailedInstall.waiting).toBe(false);
      expect(registrationAfterFailedInstall.controllerScriptUrl).toBe(legacyScriptUrl);

      // The legacy worker remains fully operational and offline-capable,
      // completely unaffected by the rejected installation attempt.
      await expect(freshPage.getByText(/^browser storage$/i)).toBeVisible();
      await context.setOffline(true);
      await freshPage.reload();
      await expect(freshPage.getByText(/^browser storage$/i)).toBeVisible();
      await context.setOffline(false);
      await freshPage.close();
      await legacyPage.close();

      // A later, genuinely valid managed release must still install
      // successfully — the earlier failure leaves no lingering state that
      // blocks a subsequent correct attempt.
      const valid = await buildAndPublishManagedRelease({
        channel: 'stable',
        basePath: BASE_PATH,
        appVersion: '2.1.0',
        buildId: 'managed-release-valid',
        workDir,
      });

      const retryPage = await context.newPage();
      await retryPage.goto(server.url);
      await retryPage.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration?.update();
      });
      await retryPage.waitForFunction(
        () =>
          navigator.serviceWorker
            .getRegistration()
            .then((registration) => registration?.waiting != null),
        undefined,
        { timeout: 60_000 },
      );
      await retryPage.close();

      const verifyPage = await context.newPage();
      await verifyPage.goto(server.url);
      await verifyPage.waitForFunction(
        () => navigator.serviceWorker.controller !== null,
        undefined,
        { timeout: 30_000 },
      );
      const controllerState = await verifyPage.evaluate(
        (dbName) =>
          new Promise<{ activeRelease?: { releaseId: string } } | undefined>((resolve) => {
            const request = indexedDB.open(dbName);
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
        CONTROLLER_STATE_DB_NAME,
      );
      expect(controllerState?.activeRelease?.releaseId).toBe(valid.releaseId);

      await verifyPage.close();
      await context.close();
    } finally {
      await server.close();
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});
