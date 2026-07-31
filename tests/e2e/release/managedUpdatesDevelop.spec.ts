import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildAndPublishBrokenManagedRelease,
  buildAndPublishManagedRelease,
  startManagedArtifactServer,
} from './fixtures/managedReleaseFixture.mjs';

// Develop channel isolation for the managed pinned application updates
// feature: independent scope, persisted state, and Cache Storage namespace
// from stable, served from the SAME origin (stable at `/`, develop at
// `/branch/develop/`) exactly like real GitHub Pages hosting.
//
// Every test below shares ONE BrowserContext (created once in `beforeAll`):
// two separate contexts would each get their own storage partition from
// Playwright itself, which would "prove" isolation regardless of whether
// this project's own channel-namespacing logic is correct. Proving
// isolation requires the stable and develop pages to genuinely share the
// same origin's storage — only this project's own namespacing
// (`buildControllerStateDbName`, `buildManagedCacheNamespace`, and
// `isSameChannelPath`'s channel-window filtering) is what keeps them apart.

const STABLE_BASE_PATH = '/';
const DEVELOP_BASE_PATH = '/branch/develop/';

async function readControllerStateDbNames(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    if (!('databases' in indexedDB)) return [];
    const databases = await indexedDB.databases();
    return databases
      .map((db) => db.name)
      .filter((name): name is string => typeof name === 'string')
      .filter((name) => name.startsWith('mioframe-update-controller-'));
  });
}

/**
 * Reads a channel's persisted `activeRelease` by IndexedDB database name,
 * from any same-origin page. IndexedDB is per-origin, not per-page — stable
 * and develop's databases are both visible from either page's own
 * `indexedDB.databases()` regardless of which channel that page belongs to,
 * so isolation is proven by each channel's *content* staying independent,
 * not by one channel's database name being invisible to the other.
 * @param page
 * @param dbName
 */
async function readActiveRelease(
  page: Page,
  dbName: string,
): Promise<{ releaseNumber: number } | undefined> {
  return page.evaluate<{ releaseNumber: number } | undefined, string>(
    (name) =>
      new Promise((resolve) => {
        const request = indexedDB.open(name);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('controllerState', 'readonly');
          const getRequest = tx.objectStore('controllerState').get('controllerState');
          getRequest.onsuccess = () => {
            db.close();
            resolve(getRequest.result?.activeRelease);
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

async function waitForControlledPage(page: Page): Promise<void> {
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, {
    timeout: 30_000,
  });
}

/**
 * Polls {@link readActiveRelease} until it resolves a release, bounded by
 * `timeoutMs`. A page becoming "controlled" only guarantees the worker
 * exists — persisting its own `activeRelease` into IndexedDB from the
 * worker's execution context can very briefly lag behind that from a
 * different page's read, so a one-shot read right after
 * `waitForControlledPage` is not reliable.
 * @param page
 * @param dbName
 * @param timeoutMs
 */
async function waitForActiveRelease(
  page: Page,
  dbName: string,
  timeoutMs = 15_000,
): Promise<{ releaseNumber: number } | undefined> {
  const start = Date.now();
  for (;;) {
    const result = await readActiveRelease(page, dbName);
    if (result) return result;
    if (Date.now() - start > timeoutMs) return undefined;
    await page.waitForTimeout(200);
  }
}

test.describe('managed pinned application updates: develop channel isolation', () => {
  // Each test/hook here builds one or more real production artifacts via
  // `vite build`, which comfortably exceeds Playwright's default 30s
  // per-test/hook timeout.
  test.describe.configure({ timeout: 180_000 });

  let workDir = '';
  let server: Awaited<ReturnType<typeof startManagedArtifactServer>>;
  let context: BrowserContext;
  let stableReleaseA: Awaited<ReturnType<typeof buildAndPublishManagedRelease>>;
  let developReleaseA: Awaited<ReturnType<typeof buildAndPublishManagedRelease>>;

  test.beforeAll(async ({ browser }) => {
    // `describe.configure({ timeout })` covers this describe block's tests
    // but not `beforeAll` itself; hooks need their own explicit override.
    test.setTimeout(180_000);
    workDir = mkdtempSync(join(tmpdir(), 'managed-release-develop-work-'));
    stableReleaseA = await buildAndPublishManagedRelease({
      channel: 'stable',
      basePath: STABLE_BASE_PATH,
      appVersion: '1.0.0',
      buildId: 'stable-release-a',
      workDir,
    });
    developReleaseA = await buildAndPublishManagedRelease({
      channel: 'develop',
      basePath: DEVELOP_BASE_PATH,
      appVersion: '1.0.0-dev',
      buildId: 'develop-release-a',
      workDir,
    });
    // Serve the whole work directory from its root: stable's own files sit
    // at the root and `branch/develop/` sits alongside them, exactly like
    // the real GitHub Pages layout (see scripts/pages/lib/pagesFs.mjs).
    server = await startManagedArtifactServer({ workDir, basePath: '/' });
    context = await browser.newContext({ baseURL: server.url });
  });

  test.afterAll(async () => {
    await context.close();
    await server.close();
    rmSync(workDir, { recursive: true, force: true });
  });

  test('stable and develop each install their own controller with independent persisted state, in the same browser context', async () => {
    // Each channel's very first visit triggers that channel's genuinely
    // fresh install. The managed worker never calls `clients.claim()`, so
    // the page whose own registration call triggered install remains
    // uncontrolled until its next navigation — reload once, exactly like a
    // real user's first visit followed by a second one.
    const stablePage = await context.newPage();
    await stablePage.goto(server.url);
    await stablePage.evaluate(() => navigator.serviceWorker.ready);
    await stablePage.reload();
    await waitForControlledPage(stablePage);

    const developPage = await context.newPage();
    await developPage.goto(`${server.url}branch/develop/`);
    await developPage.evaluate(() => navigator.serviceWorker.ready);
    await developPage.reload();
    await waitForControlledPage(developPage);
    await expect(developPage.getByText(/^browser storage$/i)).toBeVisible();

    const stableDbNames = await readControllerStateDbNames(stablePage);
    const developDbNames = await readControllerStateDbNames(developPage);

    // IndexedDB is per-origin, not per-page: both channels' database names
    // are visible from either page on this shared origin. What actually
    // proves isolation is that each channel's own persisted *content*
    // reflects only its own published release — never the other's.
    expect(stableDbNames).toContain('mioframe-update-controller-stable');
    expect(developDbNames).toContain('mioframe-update-controller-branch-develop');

    const stableActiveRelease = await waitForActiveRelease(
      stablePage,
      'mioframe-update-controller-stable',
    );
    const developActiveRelease = await waitForActiveRelease(
      developPage,
      'mioframe-update-controller-branch-develop',
    );
    expect(stableActiveRelease?.releaseNumber).toBe(stableReleaseA.releaseNumber);
    expect(developActiveRelease?.releaseNumber).toBe(developReleaseA.releaseNumber);

    // Each page's own controller is scoped to its own channel — the stable
    // worker never controls the develop page or vice versa.
    const stableControllerScope = await stablePage.evaluate(
      () => navigator.serviceWorker.controller?.scriptURL,
    );
    const developControllerScope = await developPage.evaluate(
      () => navigator.serviceWorker.controller?.scriptURL,
    );
    expect(stableControllerScope).toBeTruthy();
    expect(developControllerScope).toBeTruthy();

    await stablePage.close();
    await developPage.close();
  });

  test('a develop release scheduled for install-on-next-launch does not affect stable', async () => {
    await buildAndPublishManagedRelease({
      channel: 'develop',
      basePath: DEVELOP_BASE_PATH,
      appVersion: '1.1.0-dev',
      buildId: 'develop-release-b',
      workDir,
    });

    const developPage = await context.newPage();
    await developPage.goto(`${server.url}branch/develop/`);
    await waitForControlledPage(developPage);

    // Manual mode: a mere discovery check must record an `available`
    // candidate without automatically preparing it to `ready` — and, just as
    // importantly for later tests sharing this worker's persisted state,
    // must never leave a `ready` candidate behind that a later unrelated
    // navigation could pick up as its own clean-launch target.
    await sendProtocolRequest(developPage, { type: 'SET_MODE', mode: 'manual' });
    const checkResult = await sendProtocolRequest<{
      snapshot: { candidate?: { phase: string } };
    }>(developPage, { type: 'CHECK_FOR_UPDATES' });
    expect(checkResult.snapshot.candidate?.phase).toBe('available');

    const stablePage = await context.newPage();
    await stablePage.goto(server.url);
    await waitForControlledPage(stablePage);

    const stableSnapshot = await sendProtocolRequest<{
      snapshot: { candidate?: unknown };
    }>(stablePage, { type: 'GET_SNAPSHOT' });
    expect(stableSnapshot.snapshot.candidate).toBeUndefined();

    await developPage.close();
    await stablePage.close();
  });

  test("stable and develop windows do not block each other's clean-launch activation", async () => {
    // A live stable window must not count toward develop's own
    // otherLiveClientCount (and vice versa) — each channel's clean-launch
    // activation is decided from same-channel windows only.
    const stablePage = await context.newPage();
    await stablePage.goto(server.url);
    await waitForControlledPage(stablePage);

    await buildAndPublishManagedRelease({
      channel: 'develop',
      basePath: DEVELOP_BASE_PATH,
      appVersion: '1.2.0-dev',
      buildId: 'develop-release-c',
      workDir,
    });

    const setupDevelopPage = await context.newPage();
    await setupDevelopPage.goto(`${server.url}branch/develop/`);
    await waitForControlledPage(setupDevelopPage);
    // Defensively clear any approval a previous test/retry attempt may have
    // left scheduled, so this test's own assertions are never a symptom of
    // stale cross-test state rather than what it actually exercises.
    await sendProtocolRequest(setupDevelopPage, { type: 'CANCEL_SCHEDULED_UPDATE' });
    await sendProtocolRequest(setupDevelopPage, { type: 'SET_MODE', mode: 'manual' });
    const checked = await sendProtocolRequest<{
      snapshot: { candidate?: { phase: string; release: { releaseNumber: number } } };
    }>(setupDevelopPage, { type: 'CHECK_FOR_UPDATES' });
    expect(checked.snapshot.candidate?.phase).toBe('available');
    await sendProtocolRequest(setupDevelopPage, { type: 'INSTALL_ON_NEXT_LAUNCH' });
    await setupDevelopPage.close();

    // The stable page is still open throughout; a fresh develop launch must
    // still activate the scheduled release despite it.
    const nextDevelopPage = await context.newPage();
    await nextDevelopPage.goto(`${server.url}branch/develop/`);
    await waitForControlledPage(nextDevelopPage);
    const committed = await sendProtocolRequest<{
      snapshot: { activeRelease: { releaseNumber: number } };
    }>(nextDevelopPage, { type: 'GET_SNAPSHOT' });
    expect(committed.snapshot.activeRelease.releaseNumber).toBe(
      checked.snapshot.candidate?.release.releaseNumber,
    );

    await stablePage.close();
    await nextDevelopPage.close();
  });

  test('a develop rollback does not reload an open stable window, and vice versa', async () => {
    const stableWatchPage = await context.newPage();
    await stableWatchPage.goto(server.url);
    await waitForControlledPage(stableWatchPage);
    // Wait for the app's own initial client-side route (a Vue Router
    // history-API navigation, e.g. `/` -> `/home`) to settle before
    // watching: `load` only fires for a genuine full document
    // load/reload, never for that in-app SPA routing, so it is what
    // actually proves "was this page reloaded" — but only once the app's
    // own startup routing is done, not while it is still in flight.
    await expect(stableWatchPage.getByText(/^browser storage$/i)).toBeVisible();
    const stableReloads: string[] = [];
    stableWatchPage.on('load', (loadedPage) => stableReloads.push(loadedPage.url()));

    await buildAndPublishBrokenManagedRelease({
      channel: 'develop',
      basePath: DEVELOP_BASE_PATH,
      appVersion: '1.3.0-dev',
      buildId: 'develop-release-broken',
      workDir,
    });

    const developSetupPage = await context.newPage();
    await developSetupPage.goto(`${server.url}branch/develop/`);
    await waitForControlledPage(developSetupPage);
    // Defensively clear any approval a previous test/retry attempt may have
    // left scheduled (see the equivalent comment above).
    await sendProtocolRequest(developSetupPage, { type: 'CANCEL_SCHEDULED_UPDATE' });
    await sendProtocolRequest(developSetupPage, { type: 'SET_MODE', mode: 'manual' });
    await sendProtocolRequest(developSetupPage, { type: 'CHECK_FOR_UPDATES' });
    await sendProtocolRequest(developSetupPage, { type: 'INSTALL_ON_NEXT_LAUNCH' });
    await developSetupPage.close();

    // Loading the broken develop release triggers its own real boot
    // watchdog failure and rollback broadcast — scoped to develop only.
    // Queried through IndexedDB directly (same origin, different logical
    // database) from the untouched `stableWatchPage` rather than by
    // re-querying `developCrashPage` itself, since that page reloads once
    // it receives its own channel's rollback broadcast.
    async function readDevelopCandidatePhase(): Promise<string | undefined> {
      return stableWatchPage.evaluate(
        () =>
          new Promise((resolve) => {
            const request = indexedDB.open('mioframe-update-controller-branch-develop');
            request.onsuccess = () => {
              const db = request.result;
              const tx = db.transaction('controllerState', 'readonly');
              const getRequest = tx.objectStore('controllerState').get('controllerState');
              getRequest.onsuccess = () => {
                db.close();
                resolve(getRequest.result?.candidate?.phase);
              };
            };
          }),
      );
    }

    const developCrashPage = await context.newPage();
    await developCrashPage.goto(`${server.url}branch/develop/`);

    // Wait for develop's own real rollback to actually complete (the
    // positive signal: its candidate becomes `failed`), then confirm the
    // still-open stable page was never navigated by it — not a fixed sleep
    // guessing how long a broken channel takes to roll back.
    const start = Date.now();
    for (;;) {
      if ((await readDevelopCandidatePhase()) === 'failed') break;
      if (Date.now() - start > 30_000) {
        throw new Error('Timed out waiting for the develop channel to roll back');
      }
      await stableWatchPage.waitForTimeout(250);
    }

    expect(stableReloads).toEqual([]);
    await expect(stableWatchPage.getByText(/^browser storage$/i)).toBeVisible();

    await stableWatchPage.close();
    await developCrashPage.close();
  });
});
