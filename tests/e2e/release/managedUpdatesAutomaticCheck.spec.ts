import { expect, test, type Page } from '@playwright/test';
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
        activeRelease: { releaseNumber: number };
        candidate?: { phase: string; release: { releaseNumber: number } };
      };
    };

async function sendProtocolRequest<T>(page: Page, request: Record<string, unknown>): Promise<T> {
  return page.evaluate<T, Record<string, unknown>>(
    (req) =>
      new Promise<T>((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          resolve(event.data);
        };
        navigator.serviceWorker.controller?.postMessage({ protocolVersion: 1, ...req }, [
          channel.port2,
        ]);
      }),
    request,
  );
}

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
      // directly and needs no control at all.
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

      await expect
        .poll(
          async () => {
            const result = await readControllerState(sessionAObserver);
            return (
              result.status === 'valid' &&
              result.state.candidate?.phase === 'ready' &&
              result.state.candidate.release.releaseNumber === releaseB.releaseNumber
            );
          },
          { timeout: 30_000 },
        )
        .toBe(true);

      // The original session A must remain uninterrupted throughout.
      await expect(sessionA.getByText(/^browser storage$/i)).toBeVisible();
      const sessionAStillActive = await readControllerState(sessionA);
      expect(sessionAStillActive.status).toBe('valid');
      if (sessionAStillActive.status === 'valid') {
        expect(sessionAStillActive.state.activeRelease.releaseNumber).toBe(published.releaseNumber);
      }

      // Stage 4 stops at a prepared candidate. Activation belongs to Stage 5.
      await sessionA.close();
      await sessionAObserver.close();
      await context.close();
    } finally {
      await server.close();
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test('Manual navigation rechecks without suppression and explicit Automatic Check returns ready', async ({
  browser,
}, testInfo) => {
  testInfo.setTimeout(180_000);
  const workDir = mkdtempSync(join(tmpdir(), 'managed-release-reconciliation-work-'));

  try {
    await buildAndPublishManagedRelease({
      channel: 'stable',
      basePath: BASE_PATH,
      appVersion: '1.0.0',
      buildId: 'reconciliation-release-a',
      workDir,
    });
    const server = await startManagedArtifactServer({ workDir, basePath: BASE_PATH });
    try {
      const context = await browser.newContext({ baseURL: server.url });
      const page = await context.newPage();
      await page.goto(server.url);
      await page.evaluate(() => navigator.serviceWorker.ready);
      await page.reload();
      await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
      await sendProtocolRequest(page, { type: 'SET_MODE', mode: 'manual' });

      // Synchronization barrier: SET_MODE returns before its deferred
      // reconciliation settles, so an explicit CHECK_FOR_UPDATES here joins
      // or starts that same reconciliation and returns only once the shared
      // promise has fully settled. This prevents the following navigation
      // from racing the mode-change reconciliation for release B.
      const settledAfterModeChange = await sendProtocolRequest<{
        snapshot: {
          mode: string;
          candidate?: { phase: string; release: { releaseNumber: number } };
        };
      }>(page, { type: 'CHECK_FOR_UPDATES' });
      expect(settledAfterModeChange.snapshot).toMatchObject({
        mode: 'manual',
      });
      expect(settledAfterModeChange.snapshot.candidate).toBeUndefined();

      const releaseB = await buildAndPublishManagedRelease({
        channel: 'stable',
        basePath: BASE_PATH,
        appVersion: '1.1.0',
        buildId: 'reconciliation-release-b',
        workDir,
      });
      await page.reload();
      await expect
        .poll(async () => readControllerState(page), { timeout: 30_000 })
        .toMatchObject({
          status: 'valid',
          state: {
            mode: 'manual',
            candidate: { phase: 'available', release: { releaseNumber: releaseB.releaseNumber } },
          },
        });

      // Synchronization barrier: prove the navigation-triggered B
      // reconciliation has fully settled before release C is published, so
      // the next navigation cannot race an in-flight pass for B.
      const settledAfterB = await sendProtocolRequest<{
        snapshot: {
          mode: string;
          candidate?: { phase: string; release: { releaseNumber: number } };
        };
      }>(page, { type: 'CHECK_FOR_UPDATES' });
      expect(settledAfterB.snapshot).toMatchObject({
        mode: 'manual',
        candidate: { phase: 'available', release: { releaseNumber: releaseB.releaseNumber } },
      });

      const releaseC = await buildAndPublishManagedRelease({
        channel: 'stable',
        basePath: BASE_PATH,
        appVersion: '1.2.0',
        buildId: 'reconciliation-release-c',
        workDir,
      });
      await page.reload();
      await expect
        .poll(async () => readControllerState(page), { timeout: 30_000 })
        .toMatchObject({
          status: 'valid',
          state: {
            mode: 'manual',
            candidate: { phase: 'available', release: { releaseNumber: releaseC.releaseNumber } },
          },
        });

      await sendProtocolRequest(page, { type: 'SET_MODE', mode: 'automatic' });
      const checked = await sendProtocolRequest<{
        snapshot: {
          mode: string;
          candidate?: { phase: string; release: { releaseNumber: number } };
        };
      }>(page, { type: 'CHECK_FOR_UPDATES' });
      expect(checked.snapshot).toMatchObject({
        mode: 'automatic',
        candidate: { phase: 'ready', release: { releaseNumber: releaseC.releaseNumber } },
      });

      await page.close();
      await context.close();
    } finally {
      await server.close();
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});
