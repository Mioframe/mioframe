import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildAndPublishBrokenManagedRelease,
  buildAndPublishManagedRelease,
  startManagedArtifactServer,
} from './fixtures/managedReleaseFixture.mjs';

// Narrow cross-engine lifecycle smoke: proves the portable clean-launch
// contract — activation starts on a navigation only when the worker can
// confirm no other same-channel window client is observable — holds on
// Firefox and WebKit (this file's own project entries in
// playwright.release.config.ts). Chromium's project excludes this file: the
// complete managedUpdates*.spec.ts corpus is Chromium's authoritative proof,
// including the one narrow "second live window blocks activation" case
// added to managedUpdatesLifecycle.spec.ts to keep that assertion present
// on Chromium too.
//
// A reload of the sole remaining window is deliberately NOT part of this
// portable contract: browsers differ in how promptly they retire a reloaded
// document's own prior client from `clients.matchAll()`, so a sole-window
// reload is not a guaranteed cross-browser activation trigger. The
// guaranteed user flow this file proves instead is "close every Mioframe
// window, then open Mioframe again" — consistent with the App updates
// pane's own "Close all Mioframe windows" wording.
//
// One shared work directory, artifact server, and BrowserContext for the
// whole file (the same stateful fixture model managedUpdatesLifecycle.spec.ts
// already uses), reused — never reset — across both tests: a sequential
// release chain (A → B → C → broken D) mirrors one continuous application
// lifetime. Every page a test opens is closed in that test's own `finally`;
// an `afterEach` guard also closes anything still left open in the shared
// context, so a failed assertion in one test can never leave a live client
// that affects the other test or a retry.

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
        navigator.serviceWorker.controller?.postMessage({ protocolVersion: 1, ...req }, [
          channel.port2,
        ]);
      }),
    request,
  );
}

async function waitForControlledPage(page: Page): Promise<void> {
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, {
    timeout: 30_000,
  });
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

/**
 * Closes every page in `pages` that is not already closed, tolerating a page
 * that failed to open or already errored. Used by each test's own `finally`
 * so a failed assertion never leaves a live client behind.
 * @param pages - Pages opened by the current test.
 */
async function closeAll(pages: readonly Page[]): Promise<void> {
  await Promise.all(
    pages.map((page) => (page.isClosed() ? Promise.resolve() : page.close().catch(() => {}))),
  );
}

test.describe('managed pinned application updates: narrow cross-engine lifecycle smoke', () => {
  test.setTimeout(240_000);

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

  test.afterEach(async () => {
    // Safety net beyond each test's own finally-block cleanup: nothing must
    // carry a live client into the next test or a retry.
    await Promise.all(context.pages().map((page) => page.close().catch(() => {})));
  });

  test.afterAll(async () => {
    await context.close();
    await server.close();
    rmSync(workDir, { recursive: true, force: true });
  });

  test('an uncontrolled window and a second controlled window both block activation; closing every window activates', async () => {
    const openPages: Page[] = [];

    try {
      // 1. An uncontrolled window blocks activation of a scheduled release.
      // A fresh managed installation is deliberately never reloaded: the
      // managed worker never calls `clients.claim()`, so this page stays
      // genuinely uncontrolled by it for its entire lifetime.
      const uncontrolledPage = await context.newPage();
      openPages.push(uncontrolledPage);
      await uncontrolledPage.goto(server.url);
      await uncontrolledPage.evaluate(() => navigator.serviceWorker.ready);
      expect(await uncontrolledPage.evaluate(() => navigator.serviceWorker.controller)).toBeNull();

      const controlledPage = await context.newPage();
      openPages.push(controlledPage);
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
      const checkedB = await sendProtocolRequest<{
        snapshot: { latestRelease?: { releaseId: string } };
      }>(controlledPage, { type: 'CHECK_FOR_UPDATES' });
      expect(checkedB.snapshot.latestRelease?.releaseId).toBe(releaseB.releaseId);
      const installedB = await sendProtocolRequest<{
        snapshot: { scheduledRelease?: { releaseId: string } };
      }>(controlledPage, { type: 'INSTALL_ON_NEXT_LAUNCH' });
      expect(installedB.snapshot.scheduledRelease?.releaseId).toBe(releaseB.releaseId);

      await controlledPage.close();
      const stillBlockedPage = await context.newPage();
      openPages.push(stillBlockedPage);
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

      // 2. Closing every window (including the uncontrolled one) leaves no
      // live same-channel window: the next clean launch activates B.
      await uncontrolledPage.close();
      const windowOne = await context.newPage();
      openPages.push(windowOne);
      await windowOne.goto(server.url);
      await waitForControlledPage(windowOne);
      await expectAppReady(windowOne);
      const committedB = await waitForActiveRelease(windowOne, releaseB.releaseId);
      if (committedB.status === 'valid') {
        expect(committedB.state.approvedRelease).toBeUndefined();
      }

      // 3. Two controlled windows open: scheduling C and navigating one must
      // not activate it while the other remains open.
      const windowTwo = await context.newPage();
      openPages.push(windowTwo);
      await windowTwo.goto(server.url);
      await waitForControlledPage(windowTwo);

      const releaseC = await buildAndPublishManagedRelease({
        channel: 'stable',
        basePath: BASE_PATH,
        appVersion: '1.2.0',
        buildId: 'cross-engine-release-c',
        workDir,
      });

      const checkedC = await sendProtocolRequest<{
        snapshot: { latestRelease?: { releaseId: string } };
      }>(windowOne, { type: 'CHECK_FOR_UPDATES' });
      expect(checkedC.snapshot.latestRelease?.releaseId).toBe(releaseC.releaseId);
      const installedC = await sendProtocolRequest<{
        snapshot: { scheduledRelease?: { releaseId: string } };
      }>(windowOne, { type: 'INSTALL_ON_NEXT_LAUNCH' });
      expect(installedC.snapshot.scheduledRelease?.releaseId).toBe(releaseC.releaseId);

      await windowOne.reload();
      await waitForControlledPage(windowOne);
      await expectAppReady(windowOne);
      const blockedC = await readControllerState(windowOne);
      expect(blockedC.status).toBe('valid');
      if (blockedC.status === 'valid') {
        expect(blockedC.state.activeRelease.releaseId).toBe(releaseB.releaseId);
        expect(blockedC.state.approvedRelease?.releaseId).toBe(releaseC.releaseId);
      }

      // 4. Closing every window activates C.
      await windowOne.close();
      await windowTwo.close();
      const windowThree = await context.newPage();
      openPages.push(windowThree);
      await windowThree.goto(server.url);
      await waitForControlledPage(windowThree);
      await expectAppReady(windowThree);
      const committedC = await waitForActiveRelease(windowThree, releaseC.releaseId);
      if (committedC.status === 'valid') {
        expect(committedC.state.approvedRelease).toBeUndefined();
      }
    } finally {
      await closeAll(openPages);
    }
  });

  test('a boot failure rolls back to the previous release', async () => {
    // Continues from the previous test's final state (release C active) —
    // the shared context and worker state are never reset between tests.
    const openPages: Page[] = [];

    try {
      const openPage = await context.newPage();
      openPages.push(openPage);
      await openPage.goto(server.url);
      await waitForControlledPage(openPage);
      const beforeSchedule = await readControllerState(openPage);
      expect(beforeSchedule.status).toBe('valid');
      const previousActiveReleaseId =
        beforeSchedule.status === 'valid'
          ? beforeSchedule.state.activeRelease.releaseId
          : undefined;
      expect(previousActiveReleaseId).toBeTruthy();

      // A real hash-validated release whose entry script throws
      // immediately, exactly like a build that passed CI but has a runtime
      // bug.
      const releaseD = await buildAndPublishBrokenManagedRelease({
        channel: 'stable',
        basePath: BASE_PATH,
        appVersion: '1.3.0',
        buildId: 'cross-engine-release-d-broken',
        workDir,
      });

      const checked = await sendProtocolRequest<{
        snapshot: { latestRelease?: { releaseId: string } };
      }>(openPage, { type: 'CHECK_FOR_UPDATES' });
      expect(checked.snapshot.latestRelease?.releaseId).toBe(releaseD.releaseId);
      const installed = await sendProtocolRequest<{
        snapshot: { scheduledRelease?: { releaseId: string } };
      }>(openPage, { type: 'INSTALL_ON_NEXT_LAUNCH' });
      expect(installed.snapshot.scheduledRelease?.releaseId).toBe(releaseD.releaseId);
      await openPage.close();

      // Closing every window and opening a genuinely new one starts
      // activation of the broken release. Its own archived boot watchdog —
      // already embedded ahead of the main module script — detects the
      // immediate throw and reports a real BOOT_FAILED: the production
      // failure-detection path end to end, not a test-side reproduction of
      // the private protocol.
      const failingPage = await context.newPage();
      openPages.push(failingPage);
      await failingPage.goto(server.url);
      await waitForControlledPage(failingPage);

      const rolledBack = await waitForActiveRelease(failingPage, previousActiveReleaseId ?? '');
      if (rolledBack.status === 'valid') {
        expect(rolledBack.state.failedActivationRelease?.releaseId).toBe(releaseD.releaseId);
      }
    } finally {
      await closeAll(openPages);
    }
  });
});
