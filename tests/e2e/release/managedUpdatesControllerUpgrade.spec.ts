import { expect, test, type Page } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildAndPublishManagedRelease,
  mutateControllerWorkerBytes,
  startManagedArtifactServer,
} from './fixtures/managedReleaseFixture.mjs';

// Proof that controller-code (worker script) updates and application-release
// updates are independent: the browser owns `sw.js` byte-diff versioning
// (install/waiting/activate) entirely on its own; the managed controller
// only owns which pinned application release is selected, and a controller
// upgrade must never read, discover, or change it. See the managed pinned
// application updates feature, correction 11.
//
// Wired into the `managed-updates` release-only verify label; a failure
// here fails `pnpm verify:release`.

const BASE_PATH = '/';
const CONTROLLER_STATE_DB_NAME = 'mioframe-update-controller-stable';

type Snapshot = {
  mode: 'automatic' | 'manual';
  activeRelease: { releaseId: string; releaseSequence: number };
  latestRelease?: { releaseId: string; releaseSequence: number };
  scheduledRelease?: { releaseId: string; releaseSequence: number };
};

async function sendProtocolRequest<T>(page: Page, request: Record<string, unknown>): Promise<T> {
  return page.evaluate<T, Record<string, unknown>>(
    (req) =>
      new Promise<T>((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          resolve(event.data);
        };
        navigator.serviceWorker.controller?.postMessage(req, [channel.port2]);
      }),
    request,
  );
}

async function readActiveReleaseId(page: Page): Promise<string | undefined> {
  return page.evaluate(
    (dbName) =>
      new Promise<string | undefined>((resolve) => {
        const request = indexedDB.open(dbName);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('controllerState', 'readonly');
          const getRequest = tx.objectStore('controllerState').get('controllerState');
          getRequest.onsuccess = () => {
            db.close();
            resolve(getRequest.result?.activeRelease?.releaseId);
          };
        };
      }),
    CONTROLLER_STATE_DB_NAME,
  );
}

test('a controller-code update leaves the pinned application release, and an unapproved newer release, both untouched', async ({
  browser,
}, testInfo) => {
  testInfo.setTimeout(180_000);
  const workDir = mkdtempSync(join(tmpdir(), 'managed-release-controller-upgrade-work-'));

  try {
    const releaseA = await buildAndPublishManagedRelease({
      channel: 'stable',
      basePath: BASE_PATH,
      appVersion: '1.0.0',
      buildId: 'controller-upgrade-release-a',
      workDir,
    });
    const server = await startManagedArtifactServer({ workDir, basePath: BASE_PATH });

    try {
      const context = await browser.newContext({ baseURL: server.url });
      const pageA = await context.newPage();
      await pageA.goto(server.url);
      await pageA.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, {
        timeout: 30_000,
      });
      await expect(pageA.getByText(/^browser storage$/i)).toBeVisible();

      const manualSnapshot = await sendProtocolRequest<{ snapshot: Snapshot }>(pageA, {
        type: 'SET_MODE',
        mode: 'manual',
      });
      expect(manualSnapshot.snapshot.mode).toBe('manual');

      // Release B is published but deliberately never checked for,
      // approved, or installed — it must remain a pure server-side fact the
      // controller-code upgrade below has no reason to ever touch.
      const releaseB = await buildAndPublishManagedRelease({
        channel: 'stable',
        basePath: BASE_PATH,
        appVersion: '1.1.0',
        buildId: 'controller-upgrade-release-b',
        workDir,
      });

      const originalWorkerBytes = await pageA.evaluate(() =>
        fetch('/sw.js', { cache: 'no-store' }).then((response) => response.text()),
      );

      // A byte-different controller `sw.js`, published under the exact same
      // URL and scope — never a new application release, never a change to
      // any release descriptor, `latest.json`, or persisted controller
      // state.
      mutateControllerWorkerBytes(workDir, 'stable');
      const mutatedWorkerBytes = await pageA.evaluate(() =>
        fetch('/sw.js', { cache: 'no-store' }).then((response) => response.text()),
      );
      expect(mutatedWorkerBytes).not.toBe(originalWorkerBytes);

      await pageA.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration?.update();
      });

      // The new controller-code worker reaches "waiting" without this
      // worker's own `install` ever discovering, fetching, or approving
      // anything: persisted state is already valid, so install preserves it
      // completely unchanged (see `runInstall`'s `'valid'` branch).
      await pageA.waitForFunction(
        () =>
          navigator.serviceWorker
            .getRegistration()
            .then((registration) => registration?.waiting != null),
        undefined,
        { timeout: 60_000 },
      );

      // Release A continues operating, completely undisturbed, while the
      // new controller code sits waiting.
      await expect(pageA.getByText(/^browser storage$/i)).toBeVisible();
      const snapshotWhileWaiting = await sendProtocolRequest<{ snapshot: Snapshot }>(pageA, {
        type: 'GET_SNAPSHOT',
      });
      expect(snapshotWhileWaiting.snapshot.activeRelease.releaseId).toBe(releaseA.releaseId);
      expect(snapshotWhileWaiting.snapshot.scheduledRelease).toBeUndefined();

      // Close every window the old controller code controls; ordinary
      // browser lifecycle promotes the waiting worker once none remain.
      await pageA.close();

      const pageAfterUpgrade = await context.newPage();
      await pageAfterUpgrade.goto(server.url);
      await pageAfterUpgrade.waitForFunction(
        () => navigator.serviceWorker.controller !== null,
        undefined,
        { timeout: 30_000 },
      );
      await pageAfterUpgrade.waitForFunction(
        () =>
          navigator.serviceWorker
            .getRegistration()
            .then(
              (registration) => registration?.waiting == null && registration?.installing == null,
            ),
        undefined,
        { timeout: 30_000 },
      );
      await expect(pageAfterUpgrade.getByText(/^browser storage$/i)).toBeVisible();

      // The next launch still serves release A: the controller-code upgrade
      // never changed, or needed to re-verify, the pinned application
      // release.
      expect(await readActiveReleaseId(pageAfterUpgrade)).toBe(releaseA.releaseId);

      // Release B remains available (discoverable) but still unapproved —
      // proven only now, through the upgraded controller code, confirming
      // it owns the exact same application-release state as before.
      const checked = await sendProtocolRequest<{ snapshot: Snapshot }>(pageAfterUpgrade, {
        type: 'CHECK_FOR_UPDATES',
      });
      expect(checked.snapshot.latestRelease?.releaseId).toBe(releaseB.releaseId);
      expect(checked.snapshot.scheduledRelease).toBeUndefined();

      // Offline launch still serves release A.
      await context.setOffline(true);
      await pageAfterUpgrade.reload();
      await expect(pageAfterUpgrade.getByText(/^browser storage$/i)).toBeVisible();
      expect(await readActiveReleaseId(pageAfterUpgrade)).toBe(releaseA.releaseId);
      await context.setOffline(false);

      await pageAfterUpgrade.close();
      await context.close();
    } finally {
      await server.close();
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});
