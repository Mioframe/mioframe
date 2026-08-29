import { expect, test, type Page, type Route } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildAndPublishBrokenManagedRelease,
  buildAndPublishManagedRelease,
  startManagedArtifactServer,
} from '../../../../tests/e2e/release/fixtures/managedReleaseFixture.mjs';

// Proves the managed pinned application updates feature's rollback
// diagnostics reporting end to end, as a real browser regression (see the
// managed release publication safety fix, "Keep Service Worker diagnostics
// autonomous"):
//
//   release A active -> diagnostics reporting enabled -> candidate B starts
//   activation -> B's own application code never runs at all (its entry
//   module throws synchronously on evaluation, so there is nothing to boot)
//   -> the injected watchdog reports BOOT_FAILED -> the Service Worker
//   durably rolls back to A -> B becomes failed -> the Service Worker's own
//   Sentry transport delivers `appUpdate.activationRolledBack` with safe
//   context.
//
// This whole proof reads only Service Worker protocol responses/persisted
// controller state and the intercepted Sentry envelope request the worker
// itself sends -- it never depends on, or asserts on, Vue/main application
// rendering for either release. `dist/deployment.json` and the managed
// artifact-semantic checks are unrelated to this proof (see
// scripts/pages/lib/managedArtifactSemantics.mjs) -- this spec exercises
// runtime rollback diagnostics only.

const BASE_PATH = '/';
const CONTROLLER_DB_NAME = 'mioframe-update-controller-stable';

// Never resolved over real DNS: Playwright's route interception below
// answers every request to this host directly, so the worker's Sentry
// transport never needs real network access.
const FAKE_SENTRY_HOST = 'fake-sentry.invalid';
const FAKE_SENTRY_DSN = `https://11112222333344445555666677778888@${FAKE_SENTRY_HOST}/1`;

type ControllerStateReadResult =
  | { status: 'absent' }
  | {
      status: 'valid';
      state: {
        activeRelease: { releaseNumber: number };
        candidate?:
          | { phase: 'available' | 'ready' | 'failed'; release: { releaseNumber: number } }
          | { phase: 'activating'; release: { releaseNumber: number }; deadlineAt: string };
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
 * Pushes the diagnostics-policy live-sync message directly to this page's
 * controlling Service Worker -- the same message
 * `syncDiagnosticsPolicyToManagedServiceWorker` (a main-thread-only module)
 * sends in the real application, reproduced here as a raw `postMessage` so
 * this test never depends on Vue application code running at all. See
 * `src/sw.ts`'s `DIAGNOSTICS_POLICY_SYNC` handling and
 * `src/shared/lib/diagnostics/diagnosticsPolicySyncMessage.ts`.
 *
 * `sessionId` must match `session:<lowercase-uuid>` — the exact format
 * `isSessionSentryUserId` requires (see
 * `src/shared/lib/diagnostics/sentrySession.ts`); any other value is
 * rejected and forces reporting to `disabled` instead, silently, rather than
 * throwing.
 * @param page - The already-controlled page to send the sync message from.
 */
async function enableDiagnosticsReporting(page: Page): Promise<void> {
  await page.evaluate(() => {
    navigator.serviceWorker.controller?.postMessage({
      type: 'DIAGNOSTICS_POLICY_SYNC',
      reportingState: 'enabled',
      sessionId: `session:${crypto.randomUUID()}`,
    });
  });
}

/**
 * Persists diagnostics consent directly into the exact `idb-keyval` default
 * store record `useLocalSettings.ts` owns (database `keyval-store`, object
 * store `keyval`, key `settings`) -- the same record `readPersistedDiagnosticsPolicy`
 * reads on every fresh Service Worker module evaluation. Required in
 * addition to {@link enableDiagnosticsReporting}'s live sync: a Service
 * Worker may be terminated and re-evaluated by the browser between events at
 * any time, and a fresh evaluation's own `diagnosticsBootstrap` only reads
 * this persisted record, never remembering an earlier instance's in-memory
 * live-synced state.
 * @param page - Any page already navigated to this test's origin.
 */
async function persistDiagnosticsConsent(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('keyval-store');
        request.onerror = () => {
          reject(new Error(request.error?.message ?? 'indexedDB.open failed'));
        };
        request.onupgradeneeded = () => {
          request.result.createObjectStore('keyval');
        };
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('keyval', 'readwrite');
          tx.objectStore('keyval').put(
            { diagnosticsEnabled: true, diagnosticsConsentRequested: true },
            'settings',
          );
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => {
            db.close();
            reject(new Error(tx.error?.message ?? 'IndexedDB transaction failed'));
          };
        };
      }),
  );
}

test('an unbootable candidate is rolled back and the Service Worker itself durably reports appUpdate.activationRolledBack, independent of Vue/main application boot', async ({
  browser,
}, testInfo) => {
  // Two real, dedicated (uncached) `vite build`s with VITE_SENTRY_DSN set,
  // plus a full clean-launch activation/rollback cycle.
  testInfo.setTimeout(180_000);
  const workDir = mkdtempSync(join(tmpdir(), 'managed-release-rollback-diagnostics-work-'));

  try {
    // Built with VITE_SENTRY_DSN so the worker script this test's context
    // ends up running has runtime Sentry reporting compiled in (see
    // src/sw.ts registering it from `SENTRY_DSN`) -- release B below gets
    // the same env for the same reason, even though only whichever sw.js the
    // browser is actually running for this context matters.
    const releaseA = await buildAndPublishManagedRelease({
      channel: 'stable',
      basePath: BASE_PATH,
      appVersion: '1.0.0',
      buildId: 'rollback-diagnostics-release-a',
      workDir,
      extraEnv: { VITE_SENTRY_DSN: FAKE_SENTRY_DSN },
    });
    const server = await startManagedArtifactServer({ workDir, basePath: BASE_PATH });

    try {
      const context = await browser.newContext({ baseURL: server.url });

      // Every request to the fake Sentry ingest host is answered directly,
      // never reaching real network/DNS -- this also captures the worker's
      // own outgoing envelope bodies for the diagnostic-event assertion
      // below. Registered once, context-wide, so it also intercepts
      // requests the Service Worker itself issues (not only page requests).
      const sentryRequestBodies: string[] = [];
      await context.route(`https://${FAKE_SENTRY_HOST}/**`, async (route: Route) => {
        const request = route.request();
        const bodyBuffer = request.postDataBuffer();
        const body = bodyBuffer ? bodyBuffer.toString('utf-8') : request.postData();
        if (body) sentryRequestBodies.push(body);
        // Playwright's fulfilled response is still subject to the browser's
        // own CORS enforcement (interception never bypasses it): without an
        // explicit allow-origin header, the SW's cross-origin fetch to this
        // host would be rejected client-side even though this handler
        // observed the request and captured its body.
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'POST, OPTIONS',
            'access-control-allow-headers': '*',
          },
          body: '{}',
        });
      });

      // First install pins release A as the active release. The managed
      // worker never calls `clients.claim()`, so this same page remains
      // uncontrolled until its next navigation -- reload once, exactly like
      // a real user's first visit followed by a second one.
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

      // Diagnostics reporting enabled: the live sync for the exact worker
      // instance running right now, plus the persisted record for any
      // Service Worker instance the browser evaluates fresh later (e.g.
      // after idle termination during release B's own slow uncached build
      // below).
      await enableDiagnosticsReporting(firstPage);
      await persistDiagnosticsConsent(firstPage);
      await firstPage.close();

      // Release B's own entry module throws immediately on evaluation --
      // nothing of its application code ever runs, so its "boot" is
      // impossible by construction, not merely made to fail at runtime.
      const releaseB = await buildAndPublishBrokenManagedRelease({
        channel: 'stable',
        basePath: BASE_PATH,
        appVersion: '1.1.0',
        buildId: 'rollback-diagnostics-release-b',
        workDir,
        extraEnv: { VITE_SENTRY_DSN: FAKE_SENTRY_DSN },
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

      // The next clean launch starts activation of B; the injected watchdog
      // (never a test-side `BOOT_FAILED`) observes B's own entry module
      // throwing synchronously and reports the real failure.
      const bootPage = await context.newPage();
      await bootPage.goto(server.url);
      // B's entry throws immediately on evaluation, so the watchdog's own
      // rollback reload can follow extremely close behind this navigation's
      // own load event -- waiting for the controller here (navigation-safe,
      // unlike a single page.evaluate) avoids racing a `page.evaluate` call
      // against that second navigation and hitting "Execution context was
      // destroyed" (see the identical pattern in managedUpdatesLifecycle.spec.ts's
      // "a boot failure rolls back..." test, which injects the same failure).
      await waitForControlledPage(bootPage);

      // `activeRelease` alone is never a safe wait condition (it stays A
      // throughout scheduling, activation, and rollback -- it only changes
      // on a successful commit); wait for the candidate's own terminal
      // `failed` phase, proved entirely through the persisted controller
      // state the Service Worker itself writes.
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

      // The Service Worker's own Sentry transport actually delivered
      // `appUpdate.activationRolledBack`, with the exact safe context the
      // managed release publication safety fix requires: channel, previous
      // active release number, failed candidate release number, and
      // rollback trigger (see appUpdateDiagnosticEvents.ts). Proved purely
      // from the intercepted network transport -- never from Vue/main
      // application state.
      // A generous timeout: this waits on the real Sentry SDK's own fetch
      // dispatch after SW rollback processing, which observed extra latency
      // under this suite's bounded container CPU/memory limits.
      await expect
        .poll(
          () => sentryRequestBodies.some((body) => body.includes('appUpdate.activationRolledBack')),
          {
            timeout: 45_000,
          },
        )
        .toBe(true);
      const rollbackEnvelope = sentryRequestBodies.find((body) =>
        body.includes('appUpdate.activationRolledBack'),
      );
      expect(rollbackEnvelope).toBeDefined();
      if (rollbackEnvelope) {
        expect(rollbackEnvelope).toContain('"channel":"stable"');
        expect(rollbackEnvelope).toContain('"trigger":"bootFailed"');
        expect(rollbackEnvelope).toContain(`"managedReleaseNumber":"${releaseB.releaseNumber}"`);
        expect(rollbackEnvelope).toContain(
          `"previousActiveReleaseNumber":"${releaseA.releaseNumber}"`,
        );
      }

      await bootPage.close();
      await context.close();
    } finally {
      await server.close();
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});
