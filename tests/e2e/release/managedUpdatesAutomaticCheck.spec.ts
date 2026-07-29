import { expect, test } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildAndPublishManagedRelease,
  startManagedArtifactServer,
} from './fixtures/managedReleaseFixture.mjs';

// Automatic mode must check for updates on its own, triggered only by
// ordinary application navigation — never because a test (or any other
// caller) explicitly sent the private `CHECK_FOR_UPDATES` protocol message.
// See the managed pinned application updates feature, correction 4.

const BASE_PATH = '/';
const CONTROLLER_DB_NAME = 'mioframe-update-controller-stable';

type ControllerStateReadResult =
  | { status: 'absent' }
  | {
      status: 'valid';
      state: {
        mode: 'automatic' | 'manual';
        activeRelease: { releaseId: string; releaseSequence: number };
        approvedRelease?: { releaseId: string; releaseSequence: number };
      };
    };

async function readControllerState(
  page: import('@playwright/test').Page,
): Promise<ControllerStateReadResult> {
  return page.evaluate<ControllerStateReadResult, string>(
    (dbName) =>
      new Promise<ControllerStateReadResult>((resolve) => {
        const request = indexedDB.open(dbName);
        request.onerror = () => {
          resolve({ status: 'absent' });
        };
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('controllerState', 'readonly');
          const getRequest = tx.objectStore('controllerState').get('controllerState');
          getRequest.onsuccess = () => {
            db.close();
            resolve(
              getRequest.result === undefined
                ? { status: 'absent' }
                : { status: 'valid', state: getRequest.result },
            );
          };
        };
      }),
    CONTROLLER_DB_NAME,
  );
}

test('Automatic mode discovers and schedules a newer release from ordinary navigation alone, with no explicit CHECK_FOR_UPDATES ever sent', async ({
  browser,
}, testInfo) => {
  testInfo.setTimeout(180_000);
  const workDir = mkdtempSync(join(tmpdir(), 'managed-release-automatic-check-work-'));

  try {
    const published = await buildAndPublishManagedRelease({
      channel: 'stable',
      basePath: BASE_PATH,
      appVersion: '1.0.0',
      buildId: 'automatic-check-release-a',
      workDir,
    });
    const server = await startManagedArtifactServer({ workDir, basePath: BASE_PATH });

    try {
      const context = await browser.newContext({ baseURL: server.url });

      // First launch: a genuinely fresh install defaults to Automatic mode.
      // Only `navigator.serviceWorker.ready` (the worker reaching "active")
      // is awaited here, not `.controller`: the managed worker never calls
      // `clients.claim()`, so this same page remains uncontrolled until its
      // next navigation — but `readControllerState` reads IndexedDB
      // directly and needs no control at all. Deliberately never reloads
      // this page: a reload is itself a `navigate` fetch event, and the
      // Automatic check is scheduled at most once per worker instance —
      // reloading here would consume that one attempt before release B
      // below even exists, starving the real assertion this test makes.
      const sessionA = await context.newPage();
      await sessionA.goto(server.url);
      await sessionA.evaluate(() => navigator.serviceWorker.ready);
      const initial = await readControllerState(sessionA);
      expect(initial.status).toBe('valid');
      if (initial.status === 'valid') {
        expect(initial.state.mode).toBe('automatic');
      }

      const releaseB = await buildAndPublishManagedRelease({
        channel: 'stable',
        basePath: BASE_PATH,
        appVersion: '1.1.0',
        buildId: 'automatic-check-release-b',
        workDir,
      });

      // A second, ordinary navigation — never a private-protocol message —
      // is the only trigger for the automatic check.
      const sessionAObserver = await context.newPage();
      await sessionAObserver.goto(server.url);
      await sessionAObserver.waitForFunction(
        () => navigator.serviceWorker.controller !== null,
        undefined,
        {
          timeout: 30_000,
        },
      );

      const start = Date.now();
      for (;;) {
        const result = await readControllerState(sessionAObserver);
        if (
          result.status === 'valid' &&
          result.state.approvedRelease?.releaseId === releaseB.releaseId
        ) {
          break;
        }
        if (Date.now() - start > 30_000) {
          throw new Error(
            `Timed out waiting for the automatic check to schedule release B. Last: ${JSON.stringify(result)}`,
          );
        }
        await sessionAObserver.waitForTimeout(250);
      }

      // The original session A must remain uninterrupted throughout.
      await expect(sessionA.getByText(/^browser storage$/i)).toBeVisible();
      const sessionAStillActive = await readControllerState(sessionA);
      expect(sessionAStillActive.status).toBe('valid');
      if (sessionAStillActive.status === 'valid') {
        expect(sessionAStillActive.state.activeRelease.releaseId).toBe(published.releaseId);
      }

      // Close every A session; the next clean launch must activate B.
      await sessionA.close();
      await sessionAObserver.close();

      const sessionB = await context.newPage();
      await sessionB.goto(server.url);
      await sessionB.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, {
        timeout: 30_000,
      });
      await expect(sessionB.getByText(/^browser storage$/i)).toBeVisible();

      const committed = await readControllerState(sessionB);
      expect(committed.status).toBe('valid');
      if (committed.status === 'valid') {
        expect(committed.state.activeRelease.releaseId).toBe(releaseB.releaseId);
        expect(committed.state.approvedRelease).toBeUndefined();
      }

      await sessionB.close();
      await context.close();
    } finally {
      await server.close();
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});
