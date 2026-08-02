import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildAndPublishBrokenManagedRelease,
  buildAndPublishManagedRelease,
  startManagedArtifactServer,
} from './fixtures/managedReleaseFixture.mjs';

// Full managed pinned application updates lifecycle for the stable channel:
// first install, Manual install-on-next-launch clean-launch activation,
// Automatic discovery+approval, boot rollback, crash recovery, and offline
// pin. See the managed pinned application updates feature. Every action is
// driven through the real private worker protocol via the page's own
// `navigator.serviceWorker.controller`, never a test-side reproduction of it.
//
// All tests in this file share one BrowserContext (created once below):
// IndexedDB, Cache Storage, and the service worker registration are scoped
// to that context's origin storage, so a fresh `browser.newContext()` per
// test would silently reset to a first-ever install every time. Only pages
// are opened and closed per test/step, exactly like real windows.

const BASE_PATH = '/';
const CONTROLLER_DB_NAME = 'mioframe-update-controller-stable';

type ControllerStateReadResult =
  | { status: 'absent' }
  | {
      status: 'valid';
      state: {
        mode: 'automatic' | 'manual';
        activeRelease: { releaseNumber: number };
        candidate?:
          | { phase: 'available' | 'ready' | 'failed'; release: { releaseNumber: number } }
          | {
              phase: 'activating';
              release: { releaseNumber: number };
              deadlineAt: string;
            };
      };
    }
  | { status: 'invalid' };

async function readControllerState(page: Page, dbName: string): Promise<ControllerStateReadResult> {
  return page.evaluate<ControllerStateReadResult, string>(
    (name) =>
      new Promise<ControllerStateReadResult>((resolve) => {
        const request = indexedDB.open(name);
        request.onerror = () => {
          resolve({ status: 'absent' });
        };
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('controllerState')) {
            db.close();
            resolve({ status: 'absent' });
            return;
          }
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
          getRequest.onerror = () => {
            db.close();
            resolve({ status: 'absent' });
          };
        };
      }),
    dbName,
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

async function waitForControllerState(
  page: Page,
  predicate: (result: ControllerStateReadResult) => boolean,
  timeoutMs = 20_000,
): Promise<ControllerStateReadResult> {
  let matched: ControllerStateReadResult | undefined;
  await expect
    .poll(
      async () => {
        const result = await readControllerState(page, CONTROLLER_DB_NAME);
        if (predicate(result)) matched = result;
        return matched !== undefined;
      },
      { timeout: timeoutMs },
    )
    .toBe(true);
  if (!matched) throw new Error('Controller state condition settled without a matching result');
  return matched;
}

async function waitForControlledPage(page: Page): Promise<void> {
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, {
    timeout: 20_000,
  });
}

test.describe('managed pinned application updates: stable channel lifecycle', () => {
  let workDir = '';
  let server: Awaited<ReturnType<typeof startManagedArtifactServer>>;
  let context: BrowserContext;
  let scheduledReleaseNumber: number | undefined;

  test.beforeAll(async ({ browser }) => {
    workDir = mkdtempSync(join(tmpdir(), 'managed-release-work-'));
    await buildAndPublishManagedRelease({
      channel: 'stable',
      basePath: BASE_PATH,
      appVersion: '1.0.0',
      buildId: 'release-a',
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

  test('first install prepares and pins the active release before the controller activates', async () => {
    const page = await context.newPage();
    await page.goto(server.url);
    await expect(page.getByText(/^browser storage$/i)).toBeVisible();

    // The managed worker never calls `clients.claim()` (see the managed
    // pinned application updates feature): a page whose own registration
    // call triggers a genuinely fresh install remains uncontrolled by that
    // worker until its next navigation, even once the worker reaches
    // "active" — standard first-install behavior, not an error. Reload
    // once, exactly like a real user's first visit followed by a second
    // one, to observe this same page become controlled.
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await waitForControlledPage(page);

    const result = await waitForControllerState(page, (r) => r.status === 'valid');
    expect(result.status).toBe('valid');
    if (result.status === 'valid') {
      expect(result.state.mode).toBe('automatic');
      expect(result.state.candidate).toBeUndefined();
    }

    await page.close();
  });

  test('Manual install-on-next-launch schedules a newer release without reloading the open session', async () => {
    await buildAndPublishManagedRelease({
      channel: 'stable',
      basePath: BASE_PATH,
      appVersion: '1.1.0',
      buildId: 'release-b',
      workDir,
    });

    const openPage = await context.newPage();
    await openPage.goto(server.url);
    await waitForControlledPage(openPage);

    await sendProtocolRequest(openPage, { type: 'SET_MODE', mode: 'manual' });
    const checked = await sendProtocolRequest<{
      snapshot: { candidate?: { phase: string } };
    }>(openPage, { type: 'CHECK_FOR_UPDATES' });
    expect(checked.snapshot.candidate?.phase).toBe('available');

    const installed = await sendProtocolRequest<{
      snapshot: { candidate?: { phase: string } };
    }>(openPage, { type: 'INSTALL_ON_NEXT_LAUNCH' });
    expect(installed.snapshot.candidate?.phase).toBe('ready');

    const activeBeforeClose = await readControllerState(openPage, CONTROLLER_DB_NAME);
    expect(activeBeforeClose.status).toBe('valid');
    if (activeBeforeClose.status === 'valid') {
      expect(activeBeforeClose.state.activeRelease.releaseNumber).toBe(1);
    }

    // The open session must not be reloaded just because an update was scheduled.
    await expect(openPage.getByText(/^browser storage$/i)).toBeVisible();
    await openPage.close();
  });

  test('the next clean launch activates and commits the scheduled release', async () => {
    const page = await context.newPage();
    await page.goto(server.url);
    await waitForControlledPage(page);

    const committed = await waitForControllerState(
      page,
      (r) => r.status === 'valid' && r.state.activeRelease.releaseNumber === 2,
    );
    expect(committed.status).toBe('valid');
    if (committed.status === 'valid') {
      expect(committed.state.candidate).toBeUndefined();
    }

    await page.close();
  });

  test('Automatic mode discovers, prepares, and approves a newer release in the background', async () => {
    // Release C is deliberately built to fail on boot (see the next test):
    // a real hash-validated release whose entry script throws immediately,
    // exactly like a build that passed CI but has a runtime bug.
    await buildAndPublishBrokenManagedRelease({
      channel: 'stable',
      basePath: BASE_PATH,
      appVersion: '1.2.0',
      buildId: 'release-c',
      workDir,
    });

    const page = await context.newPage();
    await page.goto(server.url);
    await waitForControlledPage(page);

    await sendProtocolRequest(page, { type: 'SET_MODE', mode: 'automatic' });
    const checked = await sendProtocolRequest<{
      snapshot: { candidate?: { phase: string; release: { releaseNumber: number } } };
    }>(page, { type: 'CHECK_FOR_UPDATES' });

    // Explicit Check joins the complete reconciliation, including Automatic
    // preparation, and therefore returns its final ready snapshot.
    expect(checked.snapshot.candidate?.phase).toBe('ready');
    expect(checked.snapshot.candidate?.release.releaseNumber).toBe(3);

    // Confirm the same durable final state directly.
    const ready = await waitForControllerState(
      page,
      (r) =>
        r.status === 'valid' &&
        r.state.candidate?.phase === 'ready' &&
        r.state.candidate.release.releaseNumber === 3,
    );
    scheduledReleaseNumber =
      ready.status === 'valid' ? ready.state.candidate?.release.releaseNumber : undefined;

    await page.close();
  });

  test('a boot failure rolls back to the previous release and broadcasts reload', async () => {
    expect(scheduledReleaseNumber).toBeTruthy();
    const page = await context.newPage();

    // Release C's own entry script (published broken by the previous test)
    // throws immediately on evaluation. The archived release's own inline
    // boot watchdog — already embedded ahead of the main module script,
    // listening for `error`/`unhandledrejection` — is what detects this and
    // reports a real BOOT_FAILED: the production failure-detection path end
    // to end, not a test-side reproduction of the private protocol.
    await page.goto(server.url);
    await waitForControlledPage(page);

    const rolledBack = await waitForControllerState(
      page,
      (r) => r.status === 'valid' && r.state.activeRelease.releaseNumber === 2,
    );
    expect(rolledBack.status).toBe('valid');
    if (rolledBack.status === 'valid') {
      expect(rolledBack.state.candidate?.phase).toBe('failed');
      expect(rolledBack.state.candidate?.release.releaseNumber).toBe(scheduledReleaseNumber);
    }

    await page.close();
  });

  test('the failed release is not approved again automatically', async () => {
    const page = await context.newPage();
    await page.goto(server.url);
    await waitForControlledPage(page);

    const checked = await sendProtocolRequest<{
      snapshot: { candidate?: { phase: string; release: { releaseNumber: number } } };
    }>(page, { type: 'CHECK_FOR_UPDATES' });

    expect(checked.snapshot.candidate?.phase).toBe('failed');
    expect(checked.snapshot.candidate?.release.releaseNumber).toBe(scheduledReleaseNumber);

    await page.close();
  });

  test('after an Automatic rollback, switching to Manual mode and retrying schedules the failed release again', async () => {
    // Continues directly from the previous two tests' real rollback: mode is
    // still Automatic, and the worker's own persisted state already records
    // release C (`scheduledReleaseNumber`) as the single `failed` candidate —
    // exactly the "release B fails boot → rollback to A" precondition,
    // reusing that real boot failure rather than reproducing it.
    expect(scheduledReleaseNumber).toBeTruthy();
    const page = await context.newPage();
    await page.goto(server.url);
    await waitForControlledPage(page);

    // Switch to Manual mode.
    await sendProtocolRequest(page, { type: 'SET_MODE', mode: 'manual' });

    // Retry update: the real `INSTALL_ON_NEXT_LAUNCH` request the widget's
    // "Retry update" action sends.
    const retried = await sendProtocolRequest<{
      snapshot: { candidate?: { phase: string; release: { releaseNumber: number } } };
    }>(page, { type: 'INSTALL_ON_NEXT_LAUNCH' });

    expect(retried.snapshot.candidate?.phase).toBe('ready');
    expect(retried.snapshot.candidate?.release.releaseNumber).toBe(scheduledReleaseNumber);

    // Restore the schedule this test intentionally created, so later tests
    // in this shared lifecycle keep seeing the same pre-existing state this
    // suite otherwise relies on (see the equivalent defensive-cleanup
    // comments in managedUpdatesDevelop.spec.ts). This deliberately does not
    // need release C to boot successfully again.
    await sendProtocolRequest(page, { type: 'CANCEL_SCHEDULED_UPDATE' });
    await sendProtocolRequest(page, { type: 'SET_MODE', mode: 'automatic' });

    await page.close();
  });

  test('offline: a pinned release continues to serve the app without a network', async () => {
    const page = await context.newPage();
    await page.goto(server.url);
    await waitForControlledPage(page);
    await expect(page.getByText(/^browser storage$/i)).toBeVisible();

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText(/^browser storage$/i)).toBeVisible();

    await context.setOffline(false);
    await page.close();
  });

  test('crash recovery: an expired activation with no live window rolls back on the next clean launch', async () => {
    const setupPage = await context.newPage();
    await setupPage.goto(server.url);
    await waitForControlledPage(setupPage);

    const before = await readControllerState(setupPage, CONTROLLER_DB_NAME);
    expect(before.status).toBe('valid');
    const activeRelease = before.status === 'valid' ? before.state.activeRelease : undefined;
    expect(activeRelease).toBeTruthy();

    // Directly write an expired in-progress activation, simulating a browser
    // crash mid-activation on a prior launch. Direct IndexedDB mutation is
    // used here only because this is a dedicated crash-recovery test.
    //
    // The simulated target's release number is deliberately exactly
    // `activeRelease.releaseNumber + 1` — the persisted-state invariant
    // requires a candidate strictly newer than `activeRelease`, and, unlike
    // the replaced multi-reference model's opaque release id, this
    // architecture's candidate replacement is ordering-based: an
    // arbitrarily large simulated number would permanently block every real
    // release this shared lifecycle publishes afterward from ever being
    // discovered as newer.
    const simulatedTargetReleaseNumber =
      before.status === 'valid' ? before.state.activeRelease.releaseNumber + 1 : -1;
    await setupPage.evaluate(
      ({ dbName, active, targetReleaseNumber }) =>
        new Promise<void>((resolve, reject) => {
          const request = indexedDB.open(dbName);
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('controllerState', 'readwrite');
            tx.objectStore('controllerState').put(
              {
                schemaVersion: 1,
                mode: 'manual',
                activeRelease: active,
                candidate: {
                  phase: 'activating',
                  release: {
                    releaseNumber: targetReleaseNumber,
                    appVersion: '9.9.9',
                    buildId: 'crash-recovery-simulated-target',
                    buildDate: '2000-01-01T00:00:00.000Z',
                  },
                  deadlineAt: '2000-01-01T00:00:30.000Z',
                },
              },
              'controllerState',
            );
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onerror = () => {
              reject(new Error(tx.error?.message ?? 'IndexedDB transaction failed'));
            };
          };
          request.onerror = () => {
            reject(new Error(request.error?.message ?? 'IndexedDB request failed'));
          };
        }),
      {
        dbName: CONTROLLER_DB_NAME,
        active: activeRelease,
        targetReleaseNumber: simulatedTargetReleaseNumber,
      },
    );
    await setupPage.close();

    // No live window remains for the channel; the next clean launch must
    // detect the expired activation and roll back before serving a page.
    const page = await context.newPage();
    await page.goto(server.url);
    await waitForControlledPage(page);
    await expect(page.getByText(/^browser storage$/i)).toBeVisible();

    const recovered = await readControllerState(page, CONTROLLER_DB_NAME);
    expect(recovered.status).toBe('valid');
    if (recovered.status === 'valid') {
      expect(recovered.state.candidate?.phase).toBe('failed');
      expect(recovered.state.candidate?.release.releaseNumber).toBe(simulatedTargetReleaseNumber);
      expect(recovered.state.activeRelease).toEqual(activeRelease);
    }

    await page.close();
  });

  test('a second live same-channel window blocks the clean launch a lone navigation would otherwise start', async () => {
    const setupPage = await context.newPage();
    const secondWindow = await context.newPage();
    // Every later test in this shared lifecycle depends on no live window
    // surviving a failed assertion here — close both defensively even if an
    // assertion below throws.
    try {
      await setupPage.goto(server.url);
      await waitForControlledPage(setupPage);
      const before = await readControllerState(setupPage, CONTROLLER_DB_NAME);
      expect(before.status).toBe('valid');
      const activeReleaseNumber =
        before.status === 'valid' ? before.state.activeRelease.releaseNumber : undefined;
      expect(activeReleaseNumber).toBeTruthy();

      await secondWindow.goto(server.url);
      await waitForControlledPage(secondWindow);

      const releaseD = await buildAndPublishManagedRelease({
        channel: 'stable',
        basePath: BASE_PATH,
        appVersion: '1.4.0',
        buildId: 'second-window-blocks-release-d',
        workDir,
      });

      const checked = await sendProtocolRequest<{
        snapshot: { candidate?: { phase: string; release: { releaseNumber: number } } };
      }>(setupPage, { type: 'CHECK_FOR_UPDATES' });
      expect(checked.snapshot.candidate?.release.releaseNumber).toBe(releaseD.releaseNumber);
      const installed = await sendProtocolRequest<{
        snapshot: { candidate?: { phase: string; release: { releaseNumber: number } } };
      }>(setupPage, { type: 'INSTALL_ON_NEXT_LAUNCH' });
      expect(installed.snapshot.candidate?.phase).toBe('ready');
      expect(installed.snapshot.candidate?.release.releaseNumber).toBe(releaseD.releaseNumber);

      // secondWindow is still open and controlled: navigating setupPage must
      // not activate release D.
      await setupPage.reload();
      await waitForControlledPage(setupPage);
      await expect(setupPage.getByText(/^browser storage$/i)).toBeVisible();
      const afterNavigation = await readControllerState(setupPage, CONTROLLER_DB_NAME);
      expect(afterNavigation.status).toBe('valid');
      if (afterNavigation.status === 'valid') {
        expect(afterNavigation.state.activeRelease.releaseNumber).toBe(activeReleaseNumber);
        expect(afterNavigation.state.candidate?.phase).toBe('ready');
        expect(afterNavigation.state.candidate?.release.releaseNumber).toBe(releaseD.releaseNumber);
      }
    } finally {
      await setupPage.close();
      await secondWindow.close();
    }
  });

  test('a temporary Automatic preparation failure recovers on a later check of the same published release', async () => {
    // Publishes one more real release and injects exactly one aborted
    // network request for one of its ordinary files — a genuine, real
    // fetch/hash preparation failure inside the worker's own preparation
    // path, not a reproduction of the private protocol or an internal
    // Playwright/Cache-Storage mock. See the managed pinned application
    // updates feature, "Automatic preparation is not retried" correction.
    //
    // Runs last in this shared lifecycle: it schedules a real clean-launch
    // activation, and every earlier test here (in particular crash recovery,
    // which compares two raw persisted `activeRelease` reads for exact
    // shape equality) must keep seeing its own pre-existing state-write
    // timing undisturbed.
    const releaseRetry = await buildAndPublishManagedRelease({
      channel: 'stable',
      basePath: BASE_PATH,
      appVersion: '1.3.0',
      buildId: 'automatic-retry-release',
      workDir,
    });
    const [targetFile] = releaseRetry.files;
    const targetUrl = new URL(`${BASE_PATH}${targetFile.path}`, server.url).toString();

    const page = await context.newPage();
    await page.goto(server.url);
    await waitForControlledPage(page);
    await sendProtocolRequest(page, { type: 'SET_MODE', mode: 'automatic' });

    let abortedCount = 0;
    await context.route(targetUrl, async (route) => {
      const request = route.request();
      if (abortedCount === 0 && request.serviceWorker() !== null) {
        abortedCount += 1;
        await route.abort('failed');
        return;
      }
      await route.continue();
    });

    try {
      const failedCheck = await sendProtocolRequest<{
        snapshot: { candidate?: { phase: string; release: { releaseNumber: number } } };
      }>(page, { type: 'CHECK_FOR_UPDATES' });

      // Explicit Check waits for the preparation attempt; a transient
      // preparation failure leaves the candidate available in its final
      // response and persisted state.
      expect(failedCheck.snapshot.candidate?.phase).toBe('available');
      expect(failedCheck.snapshot.candidate?.release.releaseNumber).toBe(
        releaseRetry.releaseNumber,
      );

      await expect.poll(() => abortedCount, { timeout: 20_000 }).toBe(1);
      const stillAvailable = await readControllerState(page, CONTROLLER_DB_NAME);
      expect(stillAvailable.status).toBe('valid');
      if (stillAvailable.status === 'valid') {
        // The failed preparation attempt never persists or approves
        // anything: the candidate remains `available`, retryable by a later
        // eligible trigger.
        expect(stillAvailable.state.candidate?.phase).toBe('available');
      }
    } finally {
      await context.unroute(targetUrl);
    }

    // A later check of the same still-`available` candidate retries
    // preparation; this time nothing is aborted and it succeeds.
    await sendProtocolRequest(page, { type: 'CHECK_FOR_UPDATES' });
    const retried = await waitForControllerState(
      page,
      (r) =>
        r.status === 'valid' &&
        r.state.candidate?.phase === 'ready' &&
        r.state.candidate.release.releaseNumber === releaseRetry.releaseNumber,
    );
    expect(retried.status).toBe('valid');

    await page.close();

    const activationPage = await context.newPage();
    await activationPage.goto(server.url);
    await waitForControlledPage(activationPage);
    const committed = await waitForControllerState(
      activationPage,
      (r) =>
        r.status === 'valid' && r.state.activeRelease.releaseNumber === releaseRetry.releaseNumber,
    );
    expect(committed.status).toBe('valid');
    if (committed.status === 'valid') {
      expect(committed.state.candidate).toBeUndefined();
    }
    await activationPage.close();
  });
});
