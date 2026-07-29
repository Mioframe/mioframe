import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildAndPublishBrokenManagedRelease,
  buildAndPublishManagedRelease,
  startManagedArtifactServer,
} from './fixtures/managedReleaseFixture.mjs';

// Narrow cross-engine lifecycle smoke: proves the browser-dependent parts of
// managed pinned application updates — uncontrolled-window blocking,
// clean-launch activation (including a reload of the only remaining
// same-channel window, a safe application restart), and boot-failure
// rollback — hold on every engine this repository targets, without
// duplicating the complete managed-update corpus. Chromium's full coverage
// lives in the sibling managedUpdates*.spec.ts files; this file is the only
// one also run under the `firefox`/`webkit` Playwright projects (see
// playwright.release.config.ts).
//
// One shared BrowserContext and one progressively-published release chain
// (A → B → C → D → broken E), exactly like managedUpdatesLifecycle.spec.ts:
// IndexedDB, Cache Storage, and the service worker registration are scoped
// to the context's origin storage, so a fresh context per scenario would
// silently reset to a first-ever install every time.

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
        failedActivationRelease?: { releaseId: string; releaseSequence: number };
      };
    };

async function readControllerState(page: Page): Promise<ControllerStateReadResult> {
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

async function waitForControlledPage(page: Page): Promise<void> {
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, {
    timeout: 30_000,
  });
}

/**
 * Asserts the app has finished booting, using a signal present regardless of
 * engine. "Browser Storage" (the OPFS-based onboarding entry most other e2e
 * specs wait on via `tests/e2e/helpers.ts`) never renders on WebKit: WebKit
 * lacks OPFS, so the home screen shows a capability-appropriate "Device
 * storage" region instead — an app-boot-readiness difference, not a boot
 * failure or a service-worker lifecycle difference (the worker already
 * controls the page by the time this is called). The "Settings" navigation
 * button is present on every engine regardless of which storage backend the
 * app offers, so it is the cross-engine-safe readiness signal this file uses.
 * @param page - The page to check.
 */
async function expectAppReady(page: Page): Promise<void> {
  await expect(page.getByRole('button', { name: /^settings$/i })).toBeVisible();
}

async function waitForActiveRelease(
  page: Page,
  releaseId: string,
  timeoutMs = 30_000,
): Promise<ControllerStateReadResult> {
  const start = Date.now();
  for (;;) {
    const result = await readControllerState(page);
    if (result.status === 'valid' && result.state.activeRelease.releaseId === releaseId) {
      return result;
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error(
        `Timed out waiting for active release ${releaseId}. Last: ${JSON.stringify(result)}`,
      );
    }
    // eslint-disable-next-line no-await-in-loop -- Sequential polling is the intent here.
    await page.waitForTimeout(250);
  }
}

test.describe('managed pinned application updates: narrow cross-engine lifecycle smoke', () => {
  test.setTimeout(180_000);

  let workDir = '';
  let server: Awaited<ReturnType<typeof startManagedArtifactServer>>;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    workDir = mkdtempSync(join(tmpdir(), 'managed-release-cross-engine-work-'));
    await buildAndPublishManagedRelease({
      channel: 'stable',
      basePath: BASE_PATH,
      appVersion: '1.0.0',
      buildId: 'cross-engine-release-a',
      workDir,
    });
    server = await startManagedArtifactServer({ workDir, basePath: BASE_PATH });
    context = await browser.newContext({ baseURL: server.url });
  });

  test.afterAll(async () => {
    await context.close();
    await server.close();
    rmSync(workDir, { recursive: true, force: true });
  });

  test('an uncontrolled same-channel window blocks activation until it closes', async () => {
    // A fresh managed installation. Deliberately never reloaded: the
    // managed worker never calls `clients.claim()`, so this page stays
    // genuinely uncontrolled by it for its entire lifetime.
    const uncontrolledPage = await context.newPage();
    await uncontrolledPage.goto(server.url);
    await uncontrolledPage.evaluate(() => navigator.serviceWorker.ready);
    expect(await uncontrolledPage.evaluate(() => navigator.serviceWorker.controller)).toBeNull();

    const controlledPage = await context.newPage();
    await controlledPage.goto(server.url);
    await waitForControlledPage(controlledPage);

    const releaseB = await buildAndPublishManagedRelease({
      channel: 'stable',
      basePath: BASE_PATH,
      appVersion: '1.1.0',
      buildId: 'cross-engine-release-b',
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

    // Close the controlled page while the uncontrolled page remains open:
    // release B must not activate while the uncontrolled page is still live.
    await controlledPage.close();
    const stillBlockedPage = await context.newPage();
    await stillBlockedPage.goto(server.url);
    await waitForControlledPage(stillBlockedPage);
    await expectAppReady(stillBlockedPage);
    const stillBlocked = await readControllerState(stillBlockedPage);
    expect(stillBlocked.status).toBe('valid');
    if (stillBlocked.status === 'valid') {
      expect(stillBlocked.state.activeRelease.releaseId).not.toBe(releaseB.releaseId);
      expect(stillBlocked.state.approvedRelease?.releaseId).toBe(releaseB.releaseId);
    }
    await stillBlockedPage.close();

    // Closing the uncontrolled page too leaves no live same-channel window:
    // the next clean launch must activate release B.
    await uncontrolledPage.close();
    const activatedPage = await context.newPage();
    await activatedPage.goto(server.url);
    await waitForControlledPage(activatedPage);
    await expectAppReady(activatedPage);
    await waitForActiveRelease(activatedPage, releaseB.releaseId);
    await activatedPage.close();
  });

  test('a reload of the only open window activates the scheduled release', async () => {
    // A reload of the sole remaining same-channel window is a safe
    // application restart — indistinguishable in product terms from closing
    // the final window and opening the application again — so it may
    // activate exactly like any other qualifying navigation once no other
    // window is live. See stateTransitions.ts's shouldStartActivation.
    const openPage = await context.newPage();
    await openPage.goto(server.url);
    await waitForControlledPage(openPage);

    const releaseC = await buildAndPublishManagedRelease({
      channel: 'stable',
      basePath: BASE_PATH,
      appVersion: '1.2.0',
      buildId: 'cross-engine-release-c',
      workDir,
    });

    const checked = await sendProtocolRequest<{
      snapshot: { latestRelease?: { releaseId: string } };
    }>(openPage, { type: 'CHECK_FOR_UPDATES' });
    expect(checked.snapshot.latestRelease?.releaseId).toBe(releaseC.releaseId);
    const installed = await sendProtocolRequest<{
      snapshot: { scheduledRelease?: { releaseId: string } };
    }>(openPage, { type: 'INSTALL_ON_NEXT_LAUNCH' });
    expect(installed.snapshot.scheduledRelease?.releaseId).toBe(releaseC.releaseId);

    await openPage.reload();
    await waitForControlledPage(openPage);
    await expectAppReady(openPage);
    const afterReload = await waitForActiveRelease(openPage, releaseC.releaseId);
    if (afterReload.status === 'valid') {
      expect(afterReload.state.approvedRelease).toBeUndefined();
    }
    await openPage.close();
  });

  test('a reload does not activate while another same-channel window remains open', async () => {
    const firstWindow = await context.newPage();
    await firstWindow.goto(server.url);
    await waitForControlledPage(firstWindow);
    const secondWindow = await context.newPage();
    await secondWindow.goto(server.url);
    await waitForControlledPage(secondWindow);

    const beforeSchedule = await readControllerState(firstWindow);
    expect(beforeSchedule.status).toBe('valid');
    const activeReleaseId =
      beforeSchedule.status === 'valid' ? beforeSchedule.state.activeRelease.releaseId : undefined;
    expect(activeReleaseId).toBeTruthy();

    const releaseD = await buildAndPublishManagedRelease({
      channel: 'stable',
      basePath: BASE_PATH,
      appVersion: '1.3.0',
      buildId: 'cross-engine-release-d',
      workDir,
    });

    const checked = await sendProtocolRequest<{
      snapshot: { latestRelease?: { releaseId: string } };
    }>(firstWindow, { type: 'CHECK_FOR_UPDATES' });
    expect(checked.snapshot.latestRelease?.releaseId).toBe(releaseD.releaseId);
    const installed = await sendProtocolRequest<{
      snapshot: { scheduledRelease?: { releaseId: string } };
    }>(firstWindow, { type: 'INSTALL_ON_NEXT_LAUNCH' });
    expect(installed.snapshot.scheduledRelease?.releaseId).toBe(releaseD.releaseId);

    // The second window is still open: reloading the first must not
    // activate release D.
    await firstWindow.reload();
    await waitForControlledPage(firstWindow);
    await expectAppReady(firstWindow);
    const afterReloadWithSecondOpen = await readControllerState(firstWindow);
    expect(afterReloadWithSecondOpen.status).toBe('valid');
    if (afterReloadWithSecondOpen.status === 'valid') {
      expect(afterReloadWithSecondOpen.state.activeRelease.releaseId).toBe(activeReleaseId);
      expect(afterReloadWithSecondOpen.state.approvedRelease?.releaseId).toBe(releaseD.releaseId);
    }

    // Closing the other window and reloading again now qualifies: no other
    // same-channel window remains live.
    await secondWindow.close();
    await firstWindow.reload();
    await waitForControlledPage(firstWindow);
    await expectAppReady(firstWindow);
    await waitForActiveRelease(firstWindow, releaseD.releaseId);
    await firstWindow.close();
  });

  test('a boot failure rolls back to the previous release', async () => {
    // A real hash-validated release whose entry script throws immediately,
    // exactly like a build that passed CI but has a runtime bug.
    const releaseE = await buildAndPublishBrokenManagedRelease({
      channel: 'stable',
      basePath: BASE_PATH,
      appVersion: '1.4.0',
      buildId: 'cross-engine-release-e-broken',
      workDir,
    });

    const openPage = await context.newPage();
    await openPage.goto(server.url);
    await waitForControlledPage(openPage);
    const beforeSchedule = await readControllerState(openPage);
    expect(beforeSchedule.status).toBe('valid');
    const previousActiveReleaseId =
      beforeSchedule.status === 'valid' ? beforeSchedule.state.activeRelease.releaseId : undefined;
    expect(previousActiveReleaseId).toBeTruthy();

    const checked = await sendProtocolRequest<{
      snapshot: { latestRelease?: { releaseId: string } };
    }>(openPage, { type: 'CHECK_FOR_UPDATES' });
    expect(checked.snapshot.latestRelease?.releaseId).toBe(releaseE.releaseId);
    const installed = await sendProtocolRequest<{
      snapshot: { scheduledRelease?: { releaseId: string } };
    }>(openPage, { type: 'INSTALL_ON_NEXT_LAUNCH' });
    expect(installed.snapshot.scheduledRelease?.releaseId).toBe(releaseE.releaseId);
    await openPage.close();

    // Opening a genuinely new window starts activation of the broken
    // release. Its own archived boot watchdog — already embedded ahead of
    // the main module script — detects the immediate throw and reports a
    // real BOOT_FAILED: the production failure-detection path end to end,
    // not a test-side reproduction of the private protocol.
    const failingPage = await context.newPage();
    await failingPage.goto(server.url);
    await waitForControlledPage(failingPage);

    const rolledBack = await waitForActiveRelease(failingPage, previousActiveReleaseId ?? '');
    if (rolledBack.status === 'valid') {
      expect(rolledBack.state.failedActivationRelease?.releaseId).toBe(releaseE.releaseId);
    }
    await failingPage.close();
  });
});
