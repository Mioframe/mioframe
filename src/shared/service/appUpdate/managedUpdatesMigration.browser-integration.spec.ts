import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildAndApplyLegacyStableDeploy,
  buildAndPublishBrokenManagedRelease,
  buildAndPublishManagedRelease,
  corruptPublishedReleaseFile,
  readPublishedReleaseFile,
  restorePublishedReleaseFile,
  startManagedArtifactServer,
} from '../../../../tests/e2e/release/fixtures/managedReleaseFixture.mjs';

const BASE_PATH = '/';
const CONTROLLER_STATE_DB_NAME = 'mioframe-update-controller-stable';

async function readActiveReleaseNumber(
  page: import('@playwright/test').Page,
): Promise<number | undefined> {
  return page.evaluate(
    (dbName) =>
      new Promise<number | undefined>((resolve) => {
        const request = indexedDB.open(dbName);
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('controllerState')) {
            db.close();
            resolve(undefined);
            return;
          }
          const tx = db.transaction('controllerState', 'readonly');
          const getRequest = tx.objectStore('controllerState').get('controllerState');
          getRequest.onsuccess = () => {
            db.close();
            resolve(getRequest.result?.activeRelease?.releaseNumber);
          };
        };
      }),
    CONTROLLER_STATE_DB_NAME,
  );
}

/**
 * Polls {@link readActiveReleaseNumber} until it resolves
 * `expectedReleaseNumber`, bounded by `timeoutMs`. A page becoming
 * "controlled" only guarantees the worker exists — persisting its own
 * `activeRelease` into IndexedDB from the worker's own execution context can
 * very briefly lag behind that from a different page's read, so a one-shot
 * read right after observing `controller !== null` is not reliable (see the
 * same documented race in `managedUpdatesDevelop.spec.ts`).
 * @param page - The page to read persisted controller state from.
 * @param expectedReleaseNumber - The release number to wait for `activeRelease` to become.
 * @param timeoutMs - Maximum time to poll before throwing.
 */
async function waitForActiveReleaseNumber(
  page: import('@playwright/test').Page,
  expectedReleaseNumber: number,
  timeoutMs = 15_000,
): Promise<void> {
  const start = Date.now();
  for (;;) {
    const releaseNumber = await readActiveReleaseNumber(page);
    if (releaseNumber === expectedReleaseNumber) return;
    if (Date.now() - start > timeoutMs) {
      throw new Error(
        `Timed out waiting for activeRelease to become "${expectedReleaseNumber}". Last: ${releaseNumber}`,
      );
    }
    await page.waitForTimeout(200);
  }
}

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
 * Reads the full persisted controller-state record (not only
 * `activeRelease`, unlike {@link readActiveReleaseNumber}), needed to prove a
 * discovered candidate's exact phase and release number during delayed
 * release-1 recovery.
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

/**
 * Polls {@link readControllerState} until `predicate` matches, bounded by
 * `timeoutMs`. See {@link waitForActiveReleaseNumber} for why a single
 * post-"controlled" read is not reliable.
 * @param page - The page to read persisted controller state from.
 * @param predicate - Resolves once the read result satisfies this.
 * @param timeoutMs - Maximum time to poll before throwing.
 * @returns The first read result that satisfied `predicate`.
 */
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
 * Triggers `registration.update()` and waits for the resulting installing
 * worker to reach the browser's own terminal failed-install state
 * (`redundant`) — the real signal that an `install` event was rejected —
 * bounded by `timeoutMs` as the maximum wait for that observable condition,
 * never a blind sleep. The `updatefound` listener is attached before
 * `update()` is called, in the same browser-side call, so a fast failure
 * cannot fire before this starts observing it.
 * @param page - The page whose registration should be updated and observed.
 * @param timeoutMs - Maximum time to wait for the installing worker to reach `redundant`.
 * @returns Whether an installing worker was observed reaching `redundant` before the timeout.
 */
async function waitForFailedInstallToSettle(page: Page, timeoutMs = 20_000): Promise<boolean> {
  return page.evaluate(async (timeout) => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;

    const reachedRedundant = new Promise<boolean>((resolve) => {
      let settled = false;
      const settle = (value: boolean) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      const timer = setTimeout(() => {
        settle(false);
      }, timeout);
      const observeInstallingWorker = (worker: ServiceWorker) => {
        if (worker.state === 'redundant') {
          clearTimeout(timer);
          settle(true);
          return;
        }
        worker.addEventListener('statechange', () => {
          if (worker.state === 'redundant') {
            clearTimeout(timer);
            settle(true);
          }
        });
      };
      if (registration.installing) observeInstallingWorker(registration.installing);
      registration.addEventListener('updatefound', () => {
        if (registration.installing) observeInstallingWorker(registration.installing);
      });
    });

    await registration.update();
    return reachedRedundant;
  }, timeoutMs);
}

/**
 * Sends one private worker protocol request through the page's own
 * `navigator.serviceWorker.controller`, the same real transport the product
 * UI uses — never a test-side reproduction of the protocol.
 * @param page - The controlled page to send the request from.
 * @param request - The protocol request body, without `protocolVersion`.
 * @returns The worker's response to this request.
 */
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

/**
 * Opens a fresh same-channel window navigated to `url`, retrying by closing
 * and reopening until it answers `GET_SNAPSHOT` — proof it is genuinely
 * controlled by the managed worker, not an outgoing predecessor worker that
 * still happened to be `registration.active` when this navigation's request
 * was dispatched (the same same-path bootstrap race the predecessor probe
 * exists to arbitrate at install time; a brand-new window opened immediately
 * after the predecessor's last controlled client closes can still land on
 * it). A predecessor worker never implements this private protocol, so an
 * unanswered request within `perAttemptTimeoutMs` means this exact race
 * occurred. Reloading the *same* window cannot resolve it: while it stays
 * open, it is itself a live predecessor-controlled client, and this worker
 * never calls `clients.claim()` to reclaim it — only closing it and
 * navigating a genuinely new window gives the managed worker another chance
 * to finish promoting.
 * @param context - Browser context to open windows in.
 * @param url - URL to navigate to.
 * @param timeoutMs - Overall bound across every retry.
 * @returns The confirmed managed-controlled page and its accumulated `pageerror` messages.
 */
async function openManagedControlledPage(
  context: BrowserContext,
  url: string,
  timeoutMs = 30_000,
): Promise<{ page: Page; pageErrors: string[] }> {
  const perAttemptTimeoutMs = 3_000;
  const start = Date.now();
  for (;;) {
    const page = await context.newPage();
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(url);
    await waitForControlledPage(page);

    const answered = await Promise.race([
      sendProtocolRequest(page, { type: 'GET_SNAPSHOT' }).then(
        () => true,
        () => false,
      ),
      new Promise<boolean>((resolve) => {
        setTimeout(() => {
          resolve(false);
        }, perAttemptTimeoutMs);
      }),
    ]);
    if (answered) return { page, pageErrors };

    await page.close();
    if (Date.now() - start > timeoutMs) {
      throw new Error(
        'Timed out waiting for a same-channel window controlled by the managed worker',
      );
    }
  }
}

// Migration proof: a browser that already installed the exact previous
// generated (`generateSW`) Workbox worker must upgrade to the new managed
// `injectManifest` controller worker without unregistering or clearing
// storage, while the already-open old-worker session keeps working.
//
// The managed controller worker uses the browser's ordinary Service Worker
// lifecycle for its own code — it never calls `skipWaiting()`. When
// persisted managed state is absent, `install` sends the exact concurrent
// managed/Workbox predecessor probes to `registration.active` (this frozen
// legacy `generateSW` worker answers the standard Workbox `CACHE_URLS`
// probe with exact `true`, proving compatibility); only once that probe
// classifies the predecessor as a genuine first registration or a
// compatible Workbox worker does `install` fetch, validate, and fully
// prepare the channel's first managed release — including while the legacy
// Workbox worker still controls the page that triggered registration — then
// finish; ordinary browser lifecycle promotes it to "waiting", and only
// promotes it further to "active" once every previously-controlled window
// closes. See the managed pinned application updates feature.
//
// Wired into the `managed-updates` release-only verify label; a failure
// here fails `pnpm verify:release`.
test('migrates from the frozen legacy generated Workbox worker to the managed controller worker', async ({
  browser,
}, testInfo) => {
  // Builds two real production artifacts via `vite build` in sequence,
  // which comfortably exceeds Playwright's default 30s test timeout.
  testInfo.setTimeout(180_000);
  const workDir = mkdtempSync(join(tmpdir(), 'managed-release-migration-work-'));

  try {
    await buildAndApplyLegacyStableDeploy({ workDir });
    const server = await startManagedArtifactServer({ workDir, basePath: BASE_PATH });

    try {
      const context = await browser.newContext({ baseURL: server.url });
      const legacyPage = await context.newPage();

      await legacyPage.goto(server.url);
      await expect(legacyPage.getByText(/^browser storage$/i)).toBeVisible();

      // The frozen legacy config never sets Workbox's `clientsClaim`, so
      // (per spec) a worker's very first activation never takes control of
      // the page that triggered its own registration — only a subsequent
      // navigation does. Wait for the worker to become active, then reload
      // once to become genuinely controlled, exactly like a real user's
      // first visit (online bootstrap) followed by a second visit
      // (offline-capable), before publishing the managed release on top.
      await legacyPage.evaluate(() => navigator.serviceWorker.ready);
      await legacyPage.reload();
      await expect(legacyPage.getByText(/^browser storage$/i)).toBeVisible();
      await legacyPage.waitForFunction(() => navigator.serviceWorker.controller !== null);
      const legacyScriptUrl = await legacyPage.evaluate(
        () => navigator.serviceWorker.controller?.scriptURL,
      );
      expect(legacyScriptUrl).toBeTruthy();

      // Correction 3 (managed-controller capability): this build has a
      // managed channel (__MANAGED_APP_UPDATE_CHANNEL__ === 'stable'), but
      // the controller actually controlling this origin right now is the
      // frozen legacy Workbox worker, which never answers the client's
      // capability probe. The client must classify capability as unavailable
      // within its own 1-second probe deadline — never the 10-second or
      // 120-second command deadline — and the UI must disable update
      // actions accordingly. Uses a separate page so `legacyPage`'s own
      // navigation state is untouched for the assertions below.
      const legacyCapabilityPage = await context.newPage();
      await legacyCapabilityPage.goto(server.url);
      await legacyCapabilityPage.waitForFunction(() => navigator.serviceWorker.controller !== null);
      await legacyCapabilityPage.getByRole('button', { name: /^settings$/i }).click();
      await legacyCapabilityPage.getByRole('button', { name: /^app updates/i }).click();
      const legacyPane = legacyCapabilityPage.locator('.app-updates-pane');
      await expect(legacyPane.getByText(/updates unavailable/i)).toBeVisible({ timeout: 5_000 });
      await expect(legacyPane.getByRole('button', { name: /^check for updates$/i })).toBeDisabled();
      await legacyCapabilityPage.close();

      // Prove the legacy worker actually caches the app for offline use,
      // establishing a real baseline before migration (not an approximation).
      await context.setOffline(true);
      await legacyPage.reload();
      await expect(legacyPage.getByText(/^browser storage$/i)).toBeVisible();
      await context.setOffline(false);

      // Publish the managed release on top of the same work directory —
      // no unregister, no storage clearing — matching a real stable rollout.
      const published = await buildAndPublishManagedRelease({
        channel: 'stable',
        basePath: BASE_PATH,
        appVersion: '2.0.0',
        buildId: 'managed-release-a',
        workDir,
      });

      // The already-open legacy session must not be force-reloaded or broken
      // just because a new controller worker was published.
      await expect(legacyPage.getByText(/^browser storage$/i)).toBeVisible();
      const pageErrors: string[] = [];
      legacyPage.on('pageerror', (error) => pageErrors.push(error.message));

      // A fresh navigation's own bootstrap calls `navigator.serviceWorker
      // .register()` with the same scriptURL again, which triggers the
      // browser's real byte-diff update check — this app never calls
      // `registration.update()` itself, so an explicit call here exercises
      // the same real mechanism deterministically rather than depending on
      // browser-internal scheduling, without reproducing the private
      // protocol (which this never touches).
      const freshPage = await context.newPage();
      await freshPage.goto(server.url);
      await expect(freshPage.getByText(/^browser storage$/i)).toBeVisible();
      await freshPage.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration?.update();
      });

      // Direct evidence that install-time release preparation genuinely
      // completed — not merely that `install` was allowed to finish for
      // some other reason: the release's own Cache Storage entry, complete
      // with a descriptor marker matching the published release, must
      // exist. Cache Storage is origin-scoped, so this is visible from the
      // ordinary page context even before this worker ever controls
      // anything. If the still-active legacy Workbox worker's own
      // runtime-caching routes intercepted this installing worker's
      // install-time `fetch()` calls, this cache would never become
      // complete and this assertion would fail or time out — the concrete
      // evidence the required workflow calls for either way.
      await freshPage.waitForFunction(
        async (releaseNumber) => {
          const cache = await caches.open(`stable-release-${releaseNumber}`);
          const marker = await cache.match(
            'https://mioframe.internal/__release-descriptor-marker__',
          );
          if (!marker) return false;
          const descriptor = await marker.json();
          return descriptor?.releaseNumber === releaseNumber;
        },
        published.releaseNumber,
        { timeout: 60_000 },
      );

      // The new controller worker must reach "waiting" — installed, but not
      // yet claiming anything — without ever calling `skipWaiting()` while
      // the legacy-controlled `legacyPage` is still open.
      await freshPage.waitForFunction(
        () =>
          navigator.serviceWorker
            .getRegistration()
            .then((registration) => registration?.waiting != null),
        undefined,
        { timeout: 60_000 },
      );

      // The still-open legacy session remains controlled by the legacy
      // worker, completely undisturbed by the new worker reaching "waiting".
      await expect(legacyPage.getByText(/^browser storage$/i)).toBeVisible();
      const legacyControllerWhileWaiting = await legacyPage.evaluate(
        () => navigator.serviceWorker.controller?.scriptURL,
      );
      expect(legacyControllerWhileWaiting).toBe(legacyScriptUrl);
      expect(pageErrors).toEqual([]);

      // Only once every legacy-controlled window closes does ordinary
      // browser worker lifecycle promote the waiting managed worker to
      // "active". It never claims those closed clients (there are none left
      // to claim) or any subsequent one via `clients.claim()`; a fresh
      // navigation becomes controlled only on its own next request cycle.
      await legacyPage.close();
      await freshPage.close();

      const verifyPage = await context.newPage();
      await verifyPage.goto(server.url);
      await verifyPage.waitForFunction(
        () => navigator.serviceWorker.controller !== null,
        undefined,
        {
          timeout: 30_000,
        },
      );
      await expect(verifyPage.getByText(/^browser storage$/i)).toBeVisible();

      await waitForActiveReleaseNumber(verifyPage, published.releaseNumber);

      // The migrated managed release must also serve fully offline.
      await context.setOffline(true);
      await verifyPage.reload();
      await expect(verifyPage.getByText(/^browser storage$/i)).toBeVisible();
      await context.setOffline(false);

      await verifyPage.close();
      await context.close();
    } finally {
      await server.close();
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

// Failure case: the very first managed release fails install-time
// preparation (a hash mismatch against the server's own published bytes —
// e.g. storage corruption in transit). Installation must be rejected
// outright, per the browser's ordinary lifecycle: the still-active legacy
// worker must remain untouched and fully operational, and a later publish
// of a genuinely valid release must still succeed.
test('a failed first managed install leaves the legacy worker active and operational, and a later valid publish still succeeds', async ({
  browser,
}, testInfo) => {
  testInfo.setTimeout(180_000);
  const workDir = mkdtempSync(join(tmpdir(), 'managed-release-migration-failure-work-'));

  try {
    await buildAndApplyLegacyStableDeploy({ workDir });
    const server = await startManagedArtifactServer({ workDir, basePath: BASE_PATH });

    try {
      const context = await browser.newContext({ baseURL: server.url });
      const legacyPage = await context.newPage();

      await legacyPage.goto(server.url);
      await legacyPage.evaluate(() => navigator.serviceWorker.ready);
      await legacyPage.reload();
      await legacyPage.waitForFunction(() => navigator.serviceWorker.controller !== null);
      const legacyScriptUrl = await legacyPage.evaluate(
        () => navigator.serviceWorker.controller?.scriptURL,
      );

      const broken = await buildAndPublishManagedRelease({
        channel: 'stable',
        basePath: BASE_PATH,
        appVersion: '2.0.0',
        buildId: 'managed-release-broken',
        workDir,
      });
      // Corrupt the published asset's on-disk bytes after publishing: the
      // retained descriptor still declares the original SHA-256, so
      // install-time preparation's own hash validation genuinely fails —
      // exactly like storage corruption between publish and this browser's
      // fetch, not a fabricated protocol-level rejection. Saved so it can be
      // restored below: publication now validates every retained release's
      // complete physical bytes before allocating a next release number, so
      // a still-corrupt release 1 would otherwise block the later valid
      // publish this test also proves.
      const originalAssetBytes = readPublishedReleaseFile(workDir, 'stable', broken.files[0].path);
      corruptPublishedReleaseFile(workDir, 'stable', broken.files[0].path);

      const freshPage = await context.newPage();
      await freshPage.goto(server.url);

      // Observe the real browser Service Worker lifecycle: the update
      // attempt's installing worker must itself reach the terminal
      // `redundant` state (a failed `install` event), then the registration
      // must never have reached "installing" or "waiting" — a failed
      // `install` event leaves the registration with no new worker at all.
      const installReachedRedundant = await waitForFailedInstallToSettle(freshPage);
      expect(installReachedRedundant).toBe(true);
      const registrationAfterFailedInstall = await freshPage.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        return {
          installing: registration?.installing != null,
          waiting: registration?.waiting != null,
          controllerScriptUrl: navigator.serviceWorker.controller?.scriptURL,
        };
      });
      expect(registrationAfterFailedInstall.installing).toBe(false);
      expect(registrationAfterFailedInstall.waiting).toBe(false);
      expect(registrationAfterFailedInstall.controllerScriptUrl).toBe(legacyScriptUrl);

      // The legacy worker remains fully operational and offline-capable,
      // completely unaffected by the rejected installation attempt.
      await expect(freshPage.getByText(/^browser storage$/i)).toBeVisible();
      await context.setOffline(true);
      await freshPage.reload();
      await expect(freshPage.getByText(/^browser storage$/i)).toBeVisible();
      await context.setOffline(false);
      await freshPage.close();
      await legacyPage.close();

      // Restore release 1's corrupted bytes now that the failed-install
      // proof above is complete: a genuinely later publish must succeed on
      // its own retained-content merits, not because corruption elsewhere
      // in the tree went undetected.
      restorePublishedReleaseFile(workDir, 'stable', broken.files[0].path, originalAssetBytes);

      // A later, genuinely valid managed release must still install
      // successfully — the earlier failure leaves no lingering state that
      // blocks a subsequent correct attempt.
      const valid = await buildAndPublishManagedRelease({
        channel: 'stable',
        basePath: BASE_PATH,
        appVersion: '2.1.0',
        buildId: 'managed-release-valid',
        workDir,
      });

      const retryPage = await context.newPage();
      await retryPage.goto(server.url);
      await retryPage.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration?.update();
      });
      await retryPage.waitForFunction(
        () =>
          navigator.serviceWorker
            .getRegistration()
            .then((registration) => registration?.waiting != null),
        undefined,
        { timeout: 60_000 },
      );
      await retryPage.close();

      const verifyPage = await context.newPage();
      await verifyPage.goto(server.url);
      await verifyPage.waitForFunction(
        () => navigator.serviceWorker.controller !== null,
        undefined,
        { timeout: 30_000 },
      );
      await waitForActiveReleaseNumber(verifyPage, valid.releaseNumber);

      await verifyPage.close();
      await context.close();
    } finally {
      await server.close();
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

// Delayed release-1 recovery: the very first managed release is hash-correct
// and install-valid (installation never runs a release's own application
// JavaScript), but its entry module throws immediately once actually running
// in the browser — a real build that passed CI but has a runtime bug,
// discovered only once running. Per the managed pinned application updates
// feature's accepted initial-transition boundary, release 1 becomes the
// managed baseline directly at bootstrap (never through candidate
// activation), so its own boot failure can never trigger a rollback — there
// is nothing to roll back to. Recovery instead relies on every later owned
// top-level navigation continuing reconciliation (Automatic discovery and
// preparation) even though release 1's application JavaScript can never run
// an explicit Check itself: a corrected release becomes discoverable and
// `ready` from the worker's own navigation-triggered background pass alone,
// then activates on the next qualifying clean launch exactly like any other
// managed update.
test('a boot-broken first managed release remains the managed baseline, and a later corrected release recovers through navigation reconciliation without application JavaScript', async ({
  browser,
}, testInfo) => {
  testInfo.setTimeout(180_000);
  const workDir = mkdtempSync(join(tmpdir(), 'managed-release-migration-recovery-work-'));

  try {
    await buildAndApplyLegacyStableDeploy({ workDir });
    const server = await startManagedArtifactServer({ workDir, basePath: BASE_PATH });

    try {
      const context = await browser.newContext({ baseURL: server.url });
      const legacyPage = await context.newPage();

      await legacyPage.goto(server.url);
      await legacyPage.evaluate(() => navigator.serviceWorker.ready);
      await legacyPage.reload();
      await legacyPage.waitForFunction(() => navigator.serviceWorker.controller !== null);

      const releaseOne = await buildAndPublishBrokenManagedRelease({
        channel: 'stable',
        basePath: BASE_PATH,
        appVersion: '2.0.0',
        buildId: 'managed-release-1-broken',
        workDir,
      });

      const freshPage = await context.newPage();
      await freshPage.goto(server.url);
      await freshPage.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration?.update();
      });

      // Installation only validates hashes and prepares the cache — it never
      // runs the release's own application JavaScript — so the still-broken
      // release 1 installs and reaches "waiting" exactly like a valid one,
      // while the legacy-controlled session stays open and untouched.
      await freshPage.waitForFunction(
        () =>
          navigator.serviceWorker
            .getRegistration()
            .then((registration) => registration?.waiting != null),
        undefined,
        { timeout: 60_000 },
      );
      const legacyControllerWhileWaiting = await legacyPage.evaluate(
        () => navigator.serviceWorker.controller?.scriptURL,
      );
      expect(legacyControllerWhileWaiting).toBeTruthy();

      // Direct evidence that install-time release preparation genuinely
      // completed for the broken release too — not merely that "install"
      // was allowed to finish for some other reason — matching the
      // equivalent check in the first test above.
      await freshPage.waitForFunction(
        async (releaseNumber) => {
          const cache = await caches.open(`stable-release-${releaseNumber}`);
          const marker = await cache.match(
            'https://mioframe.internal/__release-descriptor-marker__',
          );
          if (!marker) return false;
          const descriptor = await marker.json();
          return descriptor?.releaseNumber === releaseNumber;
        },
        releaseOne.releaseNumber,
        { timeout: 60_000 },
      );

      // Close every legacy-controlled window: ordinary browser lifecycle
      // promotes the waiting managed worker to "active" only once none remain.
      await legacyPage.close();
      await freshPage.close();

      const { page: brokenPage, pageErrors: brokenPageErrors } = await openManagedControlledPage(
        context,
        server.url,
      );

      // Release 1 is the active baseline directly, persisted at bootstrap
      // without ever going through candidate activation. Poll rather than
      // reading once immediately after "controlled" — see
      // {@link waitForActiveReleaseNumber} for why a single post-"controlled"
      // read is not reliable.
      const bootstrapState = await waitForControllerState(
        brokenPage,
        (result) => result.status === 'valid',
      );
      expect(bootstrapState.status).toBe('valid');
      if (bootstrapState.status === 'valid') {
        expect(bootstrapState.state.activeRelease.releaseNumber).toBe(releaseOne.releaseNumber);
        expect(bootstrapState.state.candidate).toBeUndefined();
      }

      // Only the managed worker ever answers this private protocol at all: a
      // real `GET_SNAPSHOT` round trip succeeding is itself proof the browser
      // is genuinely controlled by the managed worker, not the legacy
      // Workbox worker (which never implements this protocol and would leave
      // this request hanging).
      const snapshotAfterBootstrap = await sendProtocolRequest<{
        snapshot: { activeRelease: { releaseNumber: number } };
      }>(brokenPage, { type: 'GET_SNAPSHOT' });
      expect(snapshotAfterBootstrap.snapshot.activeRelease.releaseNumber).toBe(
        releaseOne.releaseNumber,
      );

      // The application itself never reaches its normal ready UI: the entry
      // module's immediate throw is a real, uncaught application failure.
      await expect(brokenPage.getByText(/^browser storage$/i)).not.toBeVisible({
        timeout: 5_000,
      });
      expect(brokenPageErrors.length).toBeGreaterThan(0);

      // Publish a genuinely corrected release while release 1's own
      // application JavaScript is still broken.
      const releaseTwo = await buildAndPublishManagedRelease({
        channel: 'stable',
        basePath: BASE_PATH,
        appVersion: '2.1.0',
        buildId: 'managed-release-2-corrected',
        workDir,
      });

      // An owned top-level navigation — never an explicit Check request sent
      // by this test. This navigation's own document response still serves
      // release 1 (still broken) unchanged; reconciliation runs
      // independently under the same fetch event's `waitUntil`, entirely
      // inside the worker, so it never depends on release 1's broken
      // application JavaScript running at all.
      const recoveryNavigationPage = await context.newPage();
      const recoveryNavigationPageErrors: string[] = [];
      recoveryNavigationPage.on('pageerror', (error) =>
        recoveryNavigationPageErrors.push(error.message),
      );
      await recoveryNavigationPage.goto(server.url);
      await waitForControlledPage(recoveryNavigationPage);
      expect(recoveryNavigationPageErrors.length).toBeGreaterThan(0);

      const discovered = await waitForControllerState(
        recoveryNavigationPage,
        (result) =>
          result.status === 'valid' &&
          result.state.candidate?.phase === 'ready' &&
          result.state.candidate.release.releaseNumber === releaseTwo.releaseNumber,
      );
      expect(discovered.status).toBe('valid');
      if (discovered.status === 'valid') {
        // Release 1 remains the active baseline throughout discovery and
        // preparation: it is never superseded merely because a newer release
        // became `ready` — only a later qualifying clean launch activates it.
        expect(discovered.state.activeRelease.releaseNumber).toBe(releaseOne.releaseNumber);
      }

      // Close every same-channel page: the next navigation must qualify as a
      // clean launch.
      await brokenPage.close();
      await recoveryNavigationPage.close();

      const recoveredPage = await context.newPage();
      await recoveredPage.goto(server.url);
      await waitForControlledPage(recoveredPage);

      // The corrected release starts activation through this same qualifying
      // navigation, boots normally, and its own real boot watchdog reports
      // the existing durable BOOT_OK — no test-side reproduction of the
      // private protocol.
      await expect(recoveredPage.getByText(/^browser storage$/i)).toBeVisible();
      const committed = await waitForControllerState(
        recoveredPage,
        (result) =>
          result.status === 'valid' &&
          result.state.activeRelease.releaseNumber === releaseTwo.releaseNumber,
      );
      expect(committed.status).toBe('valid');
      if (committed.status === 'valid') {
        expect(committed.state.candidate).toBeUndefined();
      }

      await recoveredPage.close();
      await context.close();
    } finally {
      await server.close();
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});
