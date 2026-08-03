import { expect, test, type Page } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildAndPublishManagedRelease,
  startManagedArtifactServer,
} from './fixtures/managedReleaseFixture.mjs';
import {
  addDatabaseItem,
  closeDocumentPane,
  createDatabaseDocument,
  createStringProperty,
  createUniqueName,
  findDatabaseRow,
  openDocumentFromExplorer,
  openOpfs,
} from '../helpers';

// Proves the activation read model end to end through the real production
// UI (see the managed pinned application updates feature, "Activation read
// model"): release A active, release B scheduled (Manual), every Mioframe
// window closed, B starts activating on reopen, the App updates pane
// reports "activating" without a false "Mioframe update available"
// Snackbar, and the pane refreshes once the real boot watchdog's BOOT_OK
// durably commits B. Reuses the same managed-release fixture and
// close-and-reopen clean-launch mechanism as every other managedUpdates*
// spec — no second test harness.

const BASE_PATH = '/';

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

const CONTROLLER_STATE_DB_NAME = 'mioframe-update-controller-stable';

type ControllerStateReadResult =
  | { status: 'absent' }
  | {
      status: 'valid';
      state: {
        activeRelease: { releaseNumber: number };
        candidate?: {
          phase: 'available' | 'ready' | 'activating' | 'failed';
          release: { releaseNumber: number };
        };
      };
    };

/**
 * Reads the full persisted controller-state record directly from IndexedDB —
 * the same durable source of truth the worker itself reads and writes —
 * needed to prove `activeRelease` and candidate phase independently of the
 * private protocol's own snapshot projection.
 * @param page - The page to read persisted controller state from.
 * @returns The current persisted controller-state read result.
 */
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
        };
      }),
    CONTROLLER_STATE_DB_NAME,
  );
}

declare global {
  interface Window {
    /** Resolves once the test explicitly releases the gated `BOOT_OK` message; see {@link gateBootOk}. */
    releaseBootOkGate?: () => void;
  }
}

/**
 * Delays the archived boot watchdog's `BOOT_OK` request to the controller
 * until the test explicitly releases it, so the reopened page's
 * `activating` state can be observed in the real App updates UI before the
 * production boot-confirmation path commits it. Every other private
 * protocol message (including the watchdog's own `GET_ACTIVATION_STATUS`)
 * passes through unaffected — only the exact `BOOT_OK` postMessage call is
 * held.
 * @param page - The page to install the gate on, before its first navigation.
 */
async function gateBootOk(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const isBootOkMessage = (message: unknown): boolean =>
      typeof message === 'object' &&
      message !== null &&
      'type' in message &&
      message.type === 'BOOT_OK';

    const released = new Promise<void>((resolve) => {
      window.releaseBootOkGate = resolve;
    });

    let patched = false;
    const patch = () => {
      const controller = navigator.serviceWorker.controller;
      if (!controller || patched) return;
      patched = true;
      const original = controller.postMessage.bind(controller);
      // `PropertyDescriptor.value` is untyped (`any`), unlike a direct
      // assignment to `controller.postMessage` — which cannot satisfy
      // `ServiceWorker.postMessage`'s overloaded type with one plain
      // function value without a type assertion.
      Object.defineProperty(controller, 'postMessage', {
        configurable: true,
        value: (message: unknown, transfer: Transferable[]) => {
          if (isBootOkMessage(message)) {
            void released.then(() => {
              original(message, transfer);
            });
            return;
          }
          original(message, transfer);
        },
      });
    };
    patch();
    navigator.serviceWorker.addEventListener('controllerchange', patch);
  });
}

async function releaseBootOk(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.releaseBootOkGate?.();
  });
}

test('activation is represented in the App updates UI, without a false update-available Snackbar, and refreshes to the committed release on BOOT_OK', async ({
  browser,
}, testInfo) => {
  testInfo.setTimeout(120_000);
  const workDir = mkdtempSync(join(tmpdir(), 'managed-release-activation-ui-work-'));

  try {
    await buildAndPublishManagedRelease({
      channel: 'stable',
      basePath: BASE_PATH,
      appVersion: '1.0.0',
      buildId: 'activation-ui-release-a',
      workDir,
    });
    const server = await startManagedArtifactServer({ workDir, basePath: BASE_PATH });

    try {
      const context = await browser.newContext({ baseURL: server.url });

      // Fresh install: the managed worker never calls `clients.claim()`, so
      // the first page's own registration call stays uncontrolled until its
      // next navigation — reload once, exactly like every other managed
      // update spec's first-install step.
      const firstPage = await context.newPage();
      await firstPage.goto(server.url);
      await firstPage.evaluate(() => navigator.serviceWorker.ready);
      await firstPage.reload();
      await waitForControlledPage(firstPage);

      // Release A is active. Publish and schedule release B for Manual
      // install on next launch — the real INSTALL_ON_NEXT_LAUNCH request the
      // App updates pane's "Install on next launch" action sends.
      await buildAndPublishManagedRelease({
        channel: 'stable',
        basePath: BASE_PATH,
        appVersion: '1.1.0',
        buildId: 'activation-ui-release-b',
        workDir,
      });
      await sendProtocolRequest(firstPage, { type: 'SET_MODE', mode: 'manual' });
      const checked = await sendProtocolRequest<{
        snapshot: { candidate?: { phase: string; release: { releaseNumber: number } } };
      }>(firstPage, { type: 'CHECK_FOR_UPDATES' });
      expect(checked.snapshot.candidate?.phase).toBe('available');
      const installed = await sendProtocolRequest<{
        snapshot: { candidate?: { phase: string; release: { releaseNumber: number } } };
      }>(firstPage, { type: 'INSTALL_ON_NEXT_LAUNCH' });
      expect(installed.snapshot.candidate?.phase).toBe('ready');

      // Close every Mioframe window: no same-channel window remains live.
      await firstPage.close();

      // Reopen: this navigation qualifies as the clean launch that starts
      // activation. The BOOT_OK gate is installed before the first
      // navigation so the activating state is observable before it commits.
      const reopenedPage = await context.newPage();
      await gateBootOk(reopenedPage);
      await reopenedPage.goto(server.url);
      await waitForControlledPage(reopenedPage);
      await expect(reopenedPage.getByText(/^browser storage$/i)).toBeVisible();

      await reopenedPage.getByRole('button', { name: /^settings$/i }).click();
      await reopenedPage.getByRole('button', { name: /^app updates/i }).click();
      await expect(
        reopenedPage.locator('.md-app-bar__headline', { hasText: /^app updates$/i }),
      ).toBeVisible();

      const pane = reopenedPage.locator('.app-updates-pane');
      const statusHeadline = pane.locator('.app-update-settings__status-headline');
      await expect(statusHeadline).toHaveText(/activating update/i);
      await expect(pane.getByText(/activating version:\s*1\.1\.0/i)).toBeVisible();
      // The activating release is never shown as an ordinary available
      // update while activation is in progress.
      await expect(pane.getByText(/available version:\s*1\.1\.0/i)).toHaveCount(0);
      // No update-available Snackbar while activation exists.
      await expect(reopenedPage.getByText(/mioframe update available/i)).toHaveCount(0);
      // No Retry/Update-now action for the activating release.
      await expect(pane.getByRole('button', { name: /^update now$/i })).toHaveCount(0);
      await expect(pane.getByRole('button', { name: /^retry update$/i })).toHaveCount(0);

      await releaseBootOk(reopenedPage);

      // The durable BOOT_OK commit schedules a same-channel invalidation
      // broadcast; this same pane refreshes from it without a reload.
      await expect(statusHeadline).toHaveText(/up to date/i, { timeout: 20_000 });
      await expect(reopenedPage.getByText(/mioframe update available/i)).toHaveCount(0);

      await reopenedPage.close();
      await context.close();
    } finally {
      await server.close();
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

// Data compatibility across an actual worker rollback transition (see the
// managed pinned application updates feature, "Data compatibility"): while
// release B is `activating` (its own real `BOOT_OK` deliberately gated, so it
// never durably commits), the real product UI writes a database document,
// property, and item — genuine user data, through the same VFS/CRDT storage
// every other e2e spec exercises, never a direct storage write. Sending the
// exact private `BOOT_FAILED` request the real boot watchdog would send
// performs the real worker rollback and broadcasts the real reload; this
// spec owns only proving that the data B wrote is still readable once the
// previous release A is served again — the existing lifecycle suite already
// owns proving real watchdog-detected boot failure and rollback mechanics.
test('release A remains the persisted active release while B (activating) writes real user data, and that data survives a real worker rollback to A', async ({
  browser,
}, testInfo) => {
  testInfo.setTimeout(120_000);
  const workDir = mkdtempSync(join(tmpdir(), 'managed-release-activation-rollback-work-'));

  try {
    const releaseA = await buildAndPublishManagedRelease({
      channel: 'stable',
      basePath: BASE_PATH,
      appVersion: '1.0.0',
      buildId: 'activation-rollback-release-a',
      workDir,
    });
    const server = await startManagedArtifactServer({ workDir, basePath: BASE_PATH });

    try {
      const context = await browser.newContext({ baseURL: server.url });

      const firstPage = await context.newPage();
      await firstPage.goto(server.url);
      await firstPage.evaluate(() => navigator.serviceWorker.ready);
      await firstPage.reload();
      await waitForControlledPage(firstPage);

      // Release A is active. Publish and schedule release B for Manual
      // install on next launch, exactly like the sibling activation-UI test.
      const releaseB = await buildAndPublishManagedRelease({
        channel: 'stable',
        basePath: BASE_PATH,
        appVersion: '1.1.0',
        buildId: 'activation-rollback-release-b',
        workDir,
      });
      await sendProtocolRequest(firstPage, { type: 'SET_MODE', mode: 'manual' });
      const checked = await sendProtocolRequest<{
        snapshot: { candidate?: { phase: string; release: { releaseNumber: number } } };
      }>(firstPage, { type: 'CHECK_FOR_UPDATES' });
      expect(checked.snapshot.candidate?.phase).toBe('available');
      const installed = await sendProtocolRequest<{
        snapshot: { candidate?: { phase: string; release: { releaseNumber: number } } };
      }>(firstPage, { type: 'INSTALL_ON_NEXT_LAUNCH' });
      expect(installed.snapshot.candidate?.phase).toBe('ready');

      // Close every same-channel window, then reopen: this qualifying clean
      // launch starts B's activation. The BOOT_OK gate is installed before
      // the first navigation so B's own real boot confirmation never durably
      // commits until this test explicitly allows it — which it never does
      // here, so the deliberate BOOT_FAILED below is the only thing that can
      // resolve the activation.
      await firstPage.close();

      const reopenedPage = await context.newPage();
      await gateBootOk(reopenedPage);
      await reopenedPage.goto(server.url);
      await waitForControlledPage(reopenedPage);
      await expect(reopenedPage.getByText(/^browser storage$/i)).toBeVisible();

      // Prove through the worker's own snapshot (not the UI projection,
      // already covered by the sibling test) that A is still the persisted
      // active release while B is the pinned `activating` candidate.
      const activating = await sendProtocolRequest<{
        snapshot: {
          activeRelease: { releaseNumber: number };
          candidate?: { phase: string; release: { releaseNumber: number } };
        };
      }>(reopenedPage, { type: 'GET_SNAPSHOT' });
      expect(activating.snapshot.activeRelease.releaseNumber).toBe(releaseA.releaseNumber);
      expect(activating.snapshot.candidate?.phase).toBe('activating');
      expect(activating.snapshot.candidate?.release.releaseNumber).toBe(releaseB.releaseNumber);

      // While this page is running B's real application code (its BOOT_OK is
      // gated but the app has already mounted), write real durable user data
      // through the product UI and existing e2e helpers only.
      await openOpfs(reopenedPage);
      const documentName = await createDatabaseDocument(
        reopenedPage,
        createUniqueName('activating rollback catalog'),
      );
      await openDocumentFromExplorer(reopenedPage, documentName);
      const propertyName = await createStringProperty(
        reopenedPage,
        createUniqueName('activating rollback title'),
      );
      const itemValue = createUniqueName('activating rollback row');
      await addDatabaseItem(reopenedPage, propertyName, itemValue);
      await expect(findDatabaseRow(reopenedPage, itemValue)).toBeVisible();

      // Return to the explorer root so the reload this test is about to
      // trigger resumes on a deep-linkable URL, exactly like the equivalent
      // reload step in databasePersistenceSmoke.spec.ts.
      await closeDocumentPane(reopenedPage);
      await expect(reopenedPage.getByText(documentName, { exact: true })).toBeVisible();

      const pageErrors: string[] = [];
      reopenedPage.on('pageerror', (error) => pageErrors.push(error.message));

      // Send the exact private BOOT_FAILED request the real boot watchdog
      // would send for B — the same worker protocol path, not a test-side
      // reproduction of rollback. The gated BOOT_OK is never released.
      const reloadPromise = reopenedPage.waitForEvent('load');
      const bootFailedAck = await sendProtocolRequest<{
        ack: string;
        snapshot: { candidate?: { phase: string; release: { releaseNumber: number } } };
      }>(reopenedPage, { type: 'BOOT_FAILED', releaseNumber: releaseB.releaseNumber });
      expect(bootFailedAck.ack).toBe('rolled-back');
      expect(bootFailedAck.snapshot.candidate?.phase).toBe('failed');
      expect(bootFailedAck.snapshot.candidate?.release.releaseNumber).toBe(releaseB.releaseNumber);

      // The real rollback broadcast is what reloads this page — this test
      // never calls `page.reload()` itself.
      await reloadPromise;
      await waitForControlledPage(reopenedPage);
      await expect(reopenedPage.getByText(/^browser storage$/i)).toBeVisible();
      await expect(
        reopenedPage.getByText(/error reading|corrupt|lost changes|failed to open/i),
      ).toHaveCount(0);
      expect(pageErrors).toEqual([]);

      const rolledBackState = await readControllerState(reopenedPage);
      expect(rolledBackState.status).toBe('valid');
      if (rolledBackState.status === 'valid') {
        expect(rolledBackState.state.activeRelease.releaseNumber).toBe(releaseA.releaseNumber);
        expect(rolledBackState.state.candidate?.phase).toBe('failed');
        expect(rolledBackState.state.candidate?.release.releaseNumber).toBe(releaseB.releaseNumber);
      }

      // Through release A's real UI (booted fresh from the reload), the
      // document, property, and item B wrote are still readable.
      await expect(reopenedPage.getByText(documentName, { exact: true })).toBeVisible();
      await openDocumentFromExplorer(reopenedPage, documentName);
      await expect(reopenedPage.getByRole('button', { name: /rename document/i })).toBeVisible();
      await expect(findDatabaseRow(reopenedPage, itemValue)).toBeVisible();

      await reopenedPage.close();
      await context.close();
    } finally {
      await server.close();
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});
