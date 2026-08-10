import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildAndPublishManagedRelease,
  startManagedArtifactServer,
} from './fixtures/managedReleaseFixture.mjs';
import {
  closeDocumentPane,
  createDatabaseDocument,
  createUniqueName,
  openDocumentFromExplorer,
  openOpfs,
} from '../helpers';

// Proves the worker-owned recovery architecture end to end (see
// docs/managed-pinned-updates.md, "Recovery when controller state is lost"
// and "Recovery when active release is known but unavailable"): the
// self-contained recovery page for state-loss and known-active-unavailable
// classifications, its Retry/Install-latest actions through the real
// private RECOVER_INSTALL_LATEST protocol command, and product-data
// preservation across both flows. Reuses the same managed-release fixture,
// real production UI helpers, and close-and-reopen clean-launch mechanism
// as every other managedUpdates* spec — no second test harness, and no
// test-side reproduction of the private protocol beyond the exact same
// MessageChannel pattern every sibling spec already uses for its own
// ordinary requests (this spec never issues RECOVER_INSTALL_LATEST itself —
// only the real recovery page's own inline script does, driven by real
// button clicks).

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
          getRequest.onerror = () => {
            db.close();
            resolve({ status: 'absent' });
          };
        };
      }),
    CONTROLLER_DB_NAME,
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
        const result = await readControllerState(page);
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
    timeout: 30_000,
  });
}

/**
 * Deletes this channel's persisted controller-state record, simulating
 * total managed-update state loss (e.g. a cleared or corrupted profile
 * partition) while leaving every other origin storage — OPFS product data,
 * release Cache Storage — completely untouched.
 *
 * Deliberately an ordinary `readwrite` key delete against the existing
 * database, never `indexedDB.deleteDatabase()`: a whole-database delete is
 * a version-change operation that can stay genuinely blocked until every
 * other open connection to that database closes, and the worker's own
 * `idb-keyval`-backed reads/writes do not explicitly close their
 * connections between calls.
 * @param page - The page whose origin owns the controller-state database.
 */
async function deleteControllerStateRecord(page: Page): Promise<void> {
  await page.evaluate(
    (dbName) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('controllerState')) {
            db.close();
            resolve();
            return;
          }
          const tx = db.transaction('controllerState', 'readwrite');
          tx.objectStore('controllerState').delete('controllerState');
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => {
            reject(new Error(tx.error?.message ?? 'delete failed'));
          };
        };
        request.onerror = () => {
          reject(new Error(request.error?.message ?? 'open failed'));
        };
      }),
    CONTROLLER_DB_NAME,
  );
}

/**
 * Writes a real structurally invalid record directly into IndexedDB, matching a corrupted profile.
 * @param page - The page whose origin owns the controller-state database.
 */
async function writeInvalidControllerState(page: Page): Promise<void> {
  await page.evaluate(
    (dbName) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('controllerState', 'readwrite');
          tx.objectStore('controllerState').put({ notAValidRecord: true }, 'controllerState');
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => {
            reject(new Error(tx.error?.message ?? 'write failed'));
          };
        };
        request.onerror = () => {
          reject(new Error(request.error?.message ?? 'open failed'));
        };
      }),
    CONTROLLER_DB_NAME,
  );
}

/**
 * Deletes a release's entire local Cache Storage cache, forcing on-demand restoration.
 * @param page - The page whose origin owns the release's Cache Storage.
 * @param releaseNumber - The release whose entire cache should be deleted.
 */
async function deleteReleaseCache(page: Page, releaseNumber: number): Promise<void> {
  await page.evaluate((cacheName) => caches.delete(cacheName), `stable-release-${releaseNumber}`);
}

const recoveryHeading = (page: Page) =>
  page.getByRole('heading', { level: 1, name: /^update recovery needed$/i });

test.describe('managed pinned application updates: worker-owned recovery (state loss)', () => {
  test.describe.configure({ mode: 'serial' });

  let workDir = '';
  let server: Awaited<ReturnType<typeof startManagedArtifactServer>>;
  let context: BrowserContext;
  let releaseA: Awaited<ReturnType<typeof buildAndPublishManagedRelease>>;

  test.beforeAll(async ({ browser }) => {
    workDir = mkdtempSync(join(tmpdir(), 'managed-release-recovery-state-loss-work-'));
    releaseA = await buildAndPublishManagedRelease({
      channel: 'stable',
      basePath: BASE_PATH,
      appVersion: '1.0.0',
      buildId: 'recovery-state-loss-release-a',
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

  test('an absent controller-state database shows the state-loss recovery page; Install latest writes a fresh Automatic baseline without silently selecting the still-cached release; existing product data remains readable', async () => {
    // This test combines real document-creation UI work, a destructive
    // IndexedDB mutation, and a full state-loss recovery round trip — more
    // sequential real browser/CRDT work than the default per-test budget
    // comfortably covers under this suite's constrained container profile.
    test.info().setTimeout(60_000);
    const page = await context.newPage();
    await page.goto(server.url);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await waitForControlledPage(page);
    await expect(page.getByText(/^browser storage$/i)).toBeVisible();

    // Real durable product data, written before the state loss below,
    // through the real production UI and existing e2e helpers only. Kept
    // to a single bare document (no property/row content): this test's
    // main proof is recovery classification and baseline installation, not
    // database content survival, and a lighter document reduces real
    // CRDT/OPFS work immediately ahead of the destructive state-loss step.
    await openOpfs(page);
    const documentName = await createDatabaseDocument(
      page,
      createUniqueName('recovery state-loss document'),
    );
    await openDocumentFromExplorer(page, documentName);
    await closeDocumentPane(page);
    await expect(page.getByText(documentName, { exact: true })).toBeVisible();

    // Simulate total managed-update state loss while release A's own
    // release cache is still fully intact and valid — proving recovery
    // never silently selects it before explicit user action.
    await deleteControllerStateRecord(page);
    await page.close();

    // A genuinely fresh navigation observes the resulting recovery page —
    // never a reload of the page that just performed heavy document-editing
    // UI work, which real product data's own pending saves/handles could
    // otherwise race.
    const recoveryPage = await context.newPage();
    const recoveryResponse = await recoveryPage.goto(server.url);
    expect(recoveryResponse?.status()).toBe(503);
    await expect(recoveryHeading(recoveryPage)).toBeVisible();
    await expect(recoveryPage.getByText('UPDATE_STATE_ABSENT')).toBeVisible();
    await expect(recoveryPage.getByText(/^browser storage$/i)).not.toBeVisible();

    const reloadPromise = recoveryPage.waitForEvent('load');
    await recoveryPage.getByRole('button', { name: /^install latest version$/i }).click();
    // Success reloads this same page only once recovery is durable.
    await reloadPromise;
    await waitForControlledPage(recoveryPage);
    await expect(recoveryPage.getByText(/^browser storage$/i)).toBeVisible();

    const recovered = await readControllerState(recoveryPage);
    expect(recovered.status).toBe('valid');
    if (recovered.status === 'valid') {
      expect(recovered.state.mode).toBe('automatic');
      expect(recovered.state.activeRelease.releaseNumber).toBe(releaseA.releaseNumber);
      expect(recovered.state.candidate).toBeUndefined();
    }

    // The previously created product data remains readable. `getByText(/^browser storage$/i)`
    // above only proves the home screen's entry button rendered — actually
    // navigating into the explorer is required before the document is listed.
    await openOpfs(recoveryPage);
    await expect(recoveryPage.getByText(documentName, { exact: true })).toBeVisible();
    await openDocumentFromExplorer(recoveryPage, documentName);

    await recoveryPage.close();
  });

  test('a real invalid persisted record classifies as UPDATE_STATE_INVALID with its stable reason', async () => {
    const page = await context.newPage();
    await page.goto(server.url);
    await waitForControlledPage(page);

    await writeInvalidControllerState(page);

    const response = await page.reload();
    expect(response?.status()).toBe(503);
    await expect(recoveryHeading(page)).toBeVisible();
    await expect(page.getByText('UPDATE_STATE_INVALID')).toBeVisible();
    await expect(page.getByText('MALFORMED_RECORD')).toBeVisible();

    await page.close();
  });
});

test.describe('managed pinned application updates: worker-owned recovery (known-active unavailable)', () => {
  test.describe.configure({ mode: 'serial' });

  let workDir = '';
  let server: Awaited<ReturnType<typeof startManagedArtifactServer>>;
  let context: BrowserContext;
  let releaseA: Awaited<ReturnType<typeof buildAndPublishManagedRelease>>;
  let entryFilePath = '';
  let documentName = '';

  test.beforeAll(async ({ browser }) => {
    workDir = mkdtempSync(join(tmpdir(), 'managed-release-recovery-known-active-work-'));
    releaseA = await buildAndPublishManagedRelease({
      channel: 'stable',
      basePath: BASE_PATH,
      appVersion: '1.0.0',
      buildId: 'recovery-known-active-release-a',
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

  test('first install pins active release A and creates real product data', async () => {
    const page = await context.newPage();
    await page.goto(server.url);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await waitForControlledPage(page);
    await expect(page.getByText(/^browser storage$/i)).toBeVisible();

    // A single bare document is enough real product data for this spec's
    // survival proof (see the equivalent state-loss test's comment).
    await openOpfs(page);
    documentName = await createDatabaseDocument(
      page,
      createUniqueName('recovery known-active document'),
    );
    await openDocumentFromExplorer(page, documentName);
    await closeDocumentPane(page);
    await expect(page.getByText(documentName, { exact: true })).toBeVisible();

    await page.close();
  });

  test('an unavailable exact active release shows the known-active recovery page, and Retry never changes lifecycle state', async () => {
    const targetFile = releaseA.files.find((file) => /(?:^|\/)entry-[^/]+/.test(file.path));
    expect(targetFile).toBeDefined();
    if (!targetFile) throw new Error('Expected the materialized release-specific entry file');
    entryFilePath = targetFile.path;

    // Make exact active release A unavailable: its local release cache is
    // deleted entirely (forcing on-demand restoration), and every request
    // for its own entry file is blocked at the network layer (a genuine
    // fetch failure inside releasePreparation.ts's real restoration path,
    // not a test-side reproduction of its classification). Deliberately
    // never corrupts the published on-disk bytes: the publisher validates
    // every retained release's complete physical bytes on every later
    // publish (see releaseDescriptor.mjs's retained-tree validation), and
    // this suite still needs to publish a further release B afterward in
    // this exact same retained tree.
    await context.route(`**/${entryFilePath}`, (route) => route.abort('failed'));

    const page = await context.newPage();
    await page.goto(server.url);
    await waitForControlledPage(page);

    await deleteReleaseCache(page, releaseA.releaseNumber);

    const response = await page.reload();
    expect(response?.status()).toBe(503);
    await expect(recoveryHeading(page)).toBeVisible();
    await expect(page.getByText('ACTIVE_RELEASE_UNAVAILABLE')).toBeVisible();
    await expect(page.getByText('ARCHIVE_UNAVAILABLE')).toBeVisible();

    const beforeRetry = await readControllerState(page);
    expect(beforeRetry.status).toBe('valid');

    const reloadPromise = page.waitForEvent('load');
    await page.getByRole('button', { name: /^retry$/i }).click();
    await reloadPromise;

    // Still broken: the recovery page is shown again (expected — recovery
    // never bypasses exact-cache validation/restoration), and Retry itself
    // never mutated persisted lifecycle state. Compares only the lifecycle
    // fields (mode, activeRelease, candidate): every owned navigation —
    // including this Retry reload — also triggers ordinary background
    // reconciliation, which legitimately advances `lastSuccessfulCheckAt`
    // on its own, unrelated to Retry itself mutating anything.
    await expect(recoveryHeading(page)).toBeVisible();
    const afterRetry = await readControllerState(page);
    expect(afterRetry.status).toBe('valid');
    if (beforeRetry.status === 'valid' && afterRetry.status === 'valid') {
      expect(afterRetry.state.mode).toBe(beforeRetry.state.mode);
      expect(afterRetry.state.activeRelease).toEqual(beforeRetry.state.activeRelease);
      expect(afterRetry.state.candidate).toEqual(beforeRetry.state.candidate);
    }

    await page.close();
  });

  test('Install latest stages a strictly newer B as ready without activating it; the existing close-and-reopen clean-launch flow then activates B only after BOOT_OK; product data remains readable', async () => {
    const releaseB = await buildAndPublishManagedRelease({
      channel: 'stable',
      basePath: BASE_PATH,
      appVersion: '1.1.0',
      buildId: 'recovery-known-active-release-b',
      workDir,
    });

    const page = await context.newPage();
    await page.goto(server.url);
    await waitForControlledPage(page);
    await expect(recoveryHeading(page)).toBeVisible();

    // A second live same-channel window: it also observes A broken and
    // shows the recovery page too, but it still counts as another live
    // same-channel window, so the reload below cannot itself qualify for
    // clean-launch activation — exactly the same window-liveness rule
    // every other managedUpdates* spec's activation tests already rely on.
    const secondPage = await context.newPage();
    await secondPage.goto(server.url);
    await expect(recoveryHeading(secondPage)).toBeVisible();

    const reloadPromise = page.waitForEvent('load');
    await page.getByRole('button', { name: /^install latest version$/i }).click();
    await reloadPromise;

    // Active remains A and the newer release only becomes a ready
    // candidate — proven before any activation is even attempted, since
    // the second window above still blocks clean-launch qualification on
    // this very reload.
    const staged = await readControllerState(page);
    expect(staged.status).toBe('valid');
    if (staged.status === 'valid') {
      expect(staged.state.activeRelease.releaseNumber).toBe(releaseA.releaseNumber);
      expect(staged.state.candidate?.phase).toBe('ready');
      expect(staged.state.candidate?.release.releaseNumber).toBe(releaseB.releaseNumber);
    }

    // Close every same-channel window, then perform the existing portable
    // next-safe-start flow: the next clean launch with no other live
    // window qualifies and activates B.
    await page.close();
    await secondPage.close();

    const activationPage = await context.newPage();
    await activationPage.goto(server.url);
    await waitForControlledPage(activationPage);

    const committed = await waitForControllerState(
      activationPage,
      (r) => r.status === 'valid' && r.state.activeRelease.releaseNumber === releaseB.releaseNumber,
    );
    expect(committed.status).toBe('valid');
    if (committed.status === 'valid') {
      expect(committed.state.candidate).toBeUndefined();
    }
    await expect(activationPage.getByText(/^browser storage$/i)).toBeVisible();

    // Existing product data, written against release A before any of this
    // recovery flow ran, remains readable on the newly activated B.
    // `getByText(/^browser storage$/i)` above only proves the home screen's
    // entry button rendered — actually navigating into the explorer is
    // required before the document is listed.
    await openOpfs(activationPage);
    await expect(activationPage.getByText(documentName, { exact: true })).toBeVisible();
    await openDocumentFromExplorer(activationPage, documentName);

    await activationPage.close();
  });
});
