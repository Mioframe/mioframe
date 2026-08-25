import { expect, test, type Page } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildAndPublishManagedRelease,
  startManagedArtifactServer,
} from '../../../../tests/e2e/release/fixtures/managedReleaseFixture.mjs';

// Proves that an unhandled failure inside real Vue setup/render during the
// initial managed boot window is treated as a genuine boot failure by the
// existing watchdog — the same production failure-detection and rollback
// path proven for a raw-JavaScript entry-module throw by
// managedUpdatesLifecycle.spec.ts's broken-entry release test.
//
// Unlike that fixture, this test never replaces or breaks the published
// release's own entry module: release B is a completely ordinary, healthy
// managed build. The failure is injected only from the test side, as a
// one-shot fault on `window.matchMedia` — a real synchronous browser
// dependency `MainApp.vue`'s own setup already calls unconditionally (via
// `setupPwaInstallRuntime()` -> `isStandaloneMode()`) — installed with
// `page.addInitScript()` before the clean-launch navigation that boots B.
// The resulting error therefore genuinely passes through Vue's own setup
// error pipeline, not a test-side reproduction of it.

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

/**
 * Installs a one-shot, per-tab fault: the first call to `window.matchMedia`
 * on `page` throws, then restores the native implementation. Armed via a
 * `sessionStorage` marker rather than a closure flag because the managed
 * update watchdog's own rollback issues a same-tab, same-origin
 * `location.reload()` — a fresh document, and therefore a fresh `window`,
 * whose own copy of this init script must recognize the fault already fired
 * and stay inert so the following healthy boot is never sabotaged too.
 * @param page - The page to arm before its first navigation.
 */
async function armOneShotMatchMediaFault(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const FAULT_ALREADY_FIRED_KEY = '__mioframeTestVueBootFaultInjected__';
    if (sessionStorage.getItem(FAULT_ALREADY_FIRED_KEY)) return;
    sessionStorage.setItem(FAULT_ALREADY_FIRED_KEY, '1');

    const originalMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = () => {
      window.matchMedia = originalMatchMedia;
      throw new Error('managed-updates-vue-boot-failure-fixture: synthetic matchMedia failure');
    };
  });
}

test('a synchronous Vue setup failure during a real boot rolls back to the previous release', async ({
  browser,
}, testInfo) => {
  testInfo.setTimeout(120_000);
  const workDir = mkdtempSync(join(tmpdir(), 'managed-release-vue-boot-failure-work-'));

  try {
    const releaseA = await buildAndPublishManagedRelease({
      channel: 'stable',
      basePath: BASE_PATH,
      appVersion: '1.0.0',
      buildId: 'vue-boot-failure-release-a',
      workDir,
    });
    const server = await startManagedArtifactServer({ workDir, basePath: BASE_PATH });

    try {
      const context = await browser.newContext({ baseURL: server.url });

      // First install pins release A as the active release. The managed
      // worker never calls `clients.claim()`, so this same page — whose own
      // registration call triggered a genuinely fresh install — remains
      // uncontrolled until its next navigation; reload once, exactly like a
      // real user's first visit followed by a second one.
      const firstPage = await context.newPage();
      await firstPage.goto(server.url);
      await firstPage.evaluate(() => navigator.serviceWorker.ready);
      await firstPage.reload();
      await waitForControlledPage(firstPage);
      const installed = await waitForControllerState(firstPage, (r) => r.status === 'valid');
      expect(installed.status).toBe('valid');
      if (installed.status === 'valid') {
        expect(installed.state.activeRelease.releaseNumber).toBe(releaseA.releaseNumber);
      }
      await firstPage.close();

      // Release B is a completely ordinary, healthy managed build — nothing
      // baked into it will make its boot fail.
      const releaseB = await buildAndPublishManagedRelease({
        channel: 'stable',
        basePath: BASE_PATH,
        appVersion: '1.1.0',
        buildId: 'vue-boot-failure-release-b',
        workDir,
      });

      const schedulingPage = await context.newPage();
      await schedulingPage.goto(server.url);
      await waitForControlledPage(schedulingPage);
      await sendProtocolRequest(schedulingPage, { type: 'SET_MODE', mode: 'manual' });
      const checked = await sendProtocolRequest<{
        snapshot: { candidate?: { phase: string; release: { releaseNumber: number } } };
      }>(schedulingPage, { type: 'CHECK_FOR_UPDATES' });
      expect(checked.snapshot.candidate?.phase).toBe('available');
      expect(checked.snapshot.candidate?.release.releaseNumber).toBe(releaseB.releaseNumber);

      const scheduled = await sendProtocolRequest<{
        snapshot: { candidate?: { phase: string; release: { releaseNumber: number } } };
      }>(schedulingPage, { type: 'INSTALL_ON_NEXT_LAUNCH' });
      expect(scheduled.snapshot.candidate?.phase).toBe('ready');
      expect(scheduled.snapshot.candidate?.release.releaseNumber).toBe(releaseB.releaseNumber);
      await schedulingPage.close();

      // The next clean launch executes release B's real main.ts, real
      // setupApp(), and real MainApp.vue setup — with the one-shot
      // matchMedia fault armed, so the failure genuinely occurs inside Vue's
      // own setup execution.
      const bootPage = await context.newPage();
      const bootPageErrors: string[] = [];
      bootPage.on('pageerror', (error) => {
        bootPageErrors.push(error.message);
      });
      await armOneShotMatchMediaFault(bootPage);
      await bootPage.goto(server.url);

      // `activeRelease` alone is not a safe wait condition here: it stays A
      // throughout scheduling, activation, and failure alike (it only ever
      // changes on a successful commit), so a predicate matching on it alone
      // would settle on an early "still activating" snapshot rather than the
      // real terminal outcome. Wait for the candidate's own terminal
      // `'failed'` phase directly.
      const rolledBack = await waitForControllerState(
        bootPage,
        (r) =>
          r.status === 'valid' &&
          r.state.activeRelease.releaseNumber === releaseA.releaseNumber &&
          r.state.candidate?.phase === 'failed',
      );
      expect(rolledBack.status).toBe('valid');
      if (rolledBack.status === 'valid') {
        expect(rolledBack.state.candidate?.phase).toBe('failed');
        expect(rolledBack.state.candidate?.release.releaseNumber).toBe(releaseB.releaseNumber);
      }
      expect(
        bootPageErrors.some((message) => message.includes('synthetic matchMedia failure')),
      ).toBe(true);

      // The watchdog's own rollback issues a same-tab reload; the
      // `sessionStorage` marker from `armOneShotMatchMediaFault` keeps this
      // second boot's `matchMedia` genuine, so release A — the previous
      // active release — boots successfully and this page becomes
      // controlled again.
      await waitForControlledPage(bootPage);
      await expect(bootPage.getByText(/^browser storage$/i)).toBeVisible();
      expect(await readControllerState(bootPage, CONTROLLER_DB_NAME)).toMatchObject({
        status: 'valid',
        state: { activeRelease: { releaseNumber: releaseA.releaseNumber } },
      });

      await bootPage.close();
      await context.close();
    } finally {
      await server.close();
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});
