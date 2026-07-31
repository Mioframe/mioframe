import { expect, test, type Page } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildAndPublishManagedRelease,
  startManagedArtifactServer,
} from './fixtures/managedReleaseFixture.mjs';

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
