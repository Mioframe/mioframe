import { expect, test } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildAndPublishManagedRelease,
  startManagedArtifactServer,
} from './fixtures/managedReleaseFixture.mjs';

// An intentionally uncontrolled same-channel window (the managed worker
// never calls `clients.claim()`, so a fresh install's first page stays
// uncontrolled) must still block a newer release's clean-launch activation,
// exactly like a controlled one. See the managed pinned application updates
// feature, clean-launch correction.

const BASE_PATH = '/';
const CONTROLLER_DB_NAME = 'mioframe-update-controller-stable';

type ControllerStateReadResult =
  | { status: 'absent' }
  | {
      status: 'valid';
      state: {
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

async function sendProtocolRequest<T>(
  page: import('@playwright/test').Page,
  request: Record<string, unknown>,
): Promise<T> {
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

async function waitForControlledPage(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, {
    timeout: 30_000,
  });
}

test('an uncontrolled same-channel window blocks activation until it closes', async ({
  browser,
}, testInfo) => {
  testInfo.setTimeout(180_000);
  const workDir = mkdtempSync(join(tmpdir(), 'managed-release-uncontrolled-window-work-'));

  try {
    const releaseA = await buildAndPublishManagedRelease({
      channel: 'stable',
      basePath: BASE_PATH,
      appVersion: '1.0.0',
      buildId: 'uncontrolled-window-release-a',
      workDir,
    });
    const server = await startManagedArtifactServer({ workDir, basePath: BASE_PATH });

    try {
      const context = await browser.newContext({ baseURL: server.url });

      // A fresh managed installation. Deliberately never reloaded: the
      // managed worker never calls `clients.claim()`, so this page stays
      // genuinely uncontrolled by it for its entire lifetime — exactly the
      // "first, intentionally uncontrolled same-channel page" this test
      // needs to keep open and live.
      const uncontrolledPageA = await context.newPage();
      await uncontrolledPageA.goto(server.url);
      await uncontrolledPageA.evaluate(() => navigator.serviceWorker.ready);
      expect(await uncontrolledPageA.evaluate(() => navigator.serviceWorker.controller)).toBeNull();

      // A second, ordinary navigation is controlled immediately by the
      // now-active worker.
      const controlledPage = await context.newPage();
      await controlledPage.goto(server.url);
      await waitForControlledPage(controlledPage);

      const releaseB = await buildAndPublishManagedRelease({
        channel: 'stable',
        basePath: BASE_PATH,
        appVersion: '1.1.0',
        buildId: 'uncontrolled-window-release-b',
        workDir,
      });

      await sendProtocolRequest(controlledPage, { type: 'SET_MODE', mode: 'manual' });
      const checked = await sendProtocolRequest<{
        snapshot: { latestRelease?: { releaseId: string } };
      }>(controlledPage, { type: 'CHECK_FOR_UPDATES' });
      expect(checked.snapshot.latestRelease?.releaseId).toBe(releaseB.releaseId);

      const installed = await sendProtocolRequest<{
        snapshot: { scheduledRelease?: { releaseId: string } };
      }>(controlledPage, { type: 'INSTALL_ON_NEXT_LAUNCH' });
      expect(installed.snapshot.scheduledRelease?.releaseId).toBe(releaseB.releaseId);

      // Close the controlled page while the original uncontrolled page A
      // remains open, then open another page: B must not start activation
      // while A is still live, even though A was never "controlled".
      await controlledPage.close();

      const stillBlockedPage = await context.newPage();
      await stillBlockedPage.goto(server.url);
      await waitForControlledPage(stillBlockedPage);
      await expect(stillBlockedPage.getByText(/^browser storage$/i)).toBeVisible();

      const stillBlocked = await readControllerState(stillBlockedPage);
      expect(stillBlocked.status).toBe('valid');
      if (stillBlocked.status === 'valid') {
        expect(stillBlocked.state.activeRelease.releaseId).toBe(releaseA.releaseId);
        expect(stillBlocked.state.approvedRelease?.releaseId).toBe(releaseB.releaseId);
      }
      await stillBlockedPage.close();

      // Close the uncontrolled page A: no same-channel window remains live.
      await uncontrolledPageA.close();

      const activatedPage = await context.newPage();
      await activatedPage.goto(server.url);
      await waitForControlledPage(activatedPage);
      await expect(activatedPage.getByText(/^browser storage$/i)).toBeVisible();

      const start = Date.now();
      for (;;) {
        const result = await readControllerState(activatedPage);
        if (
          result.status === 'valid' &&
          result.state.activeRelease.releaseId === releaseB.releaseId
        ) {
          break;
        }
        if (Date.now() - start > 30_000) {
          throw new Error(
            `Timed out waiting for release B to activate. Last: ${JSON.stringify(result)}`,
          );
        }
        await activatedPage.waitForTimeout(250);
      }

      await activatedPage.close();
      await context.close();
    } finally {
      await server.close();
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});
