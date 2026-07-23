import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { createDirectory, launchApp, openOpfs } from '../helpers';

const marker = (page: Page) =>
  page.evaluate(() => Reflect.get(globalThis, '__MIOFRAME_EXECUTED_RELEASE__'));
const waitForExecutedRelease = (page: Page, release: 'A' | 'B') =>
  page.waitForFunction(
    (expected) => Reflect.get(globalThis, '__MIOFRAME_EXECUTED_RELEASE__') === expected,
    release,
  );
const waitForManagedController = (page: Page) =>
  page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration('/');
    await registration?.update();
    await new Promise<void>((resolve, reject) => {
      const deadline = window.setTimeout(() => {
        reject(new Error('Managed controller unavailable.'));
      }, 10_000);
      const tryController = () => {
        const controller = navigator.serviceWorker.controller;
        if (!controller) return;
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          if (event.data?.kind !== 'snapshot') return;
          window.clearTimeout(deadline);
          resolve();
        };
        controller.postMessage({ protocolVersion: 3, type: 'GET_SNAPSHOT' }, [channel.port2]);
      };
      navigator.serviceWorker.addEventListener('controllerchange', tryController);
      tryController();
    });
  });
const corruptControllerPersistence = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('mioframe-stable-release-controller', 3);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction('controller-state', 'readwrite');
          const objectStore = transaction.objectStore('controller-state');
          // Neither a valid current schema record nor a valid last-known-good record: recovery
          // must fall back to serving the locally built release with capability unavailable.
          objectStore.put({ notAValidControllerRecord: true }, 'current');
          objectStore.put({ notAValidControllerRecord: true }, 'last-known-good');
          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
          transaction.onerror = () => {
            reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
          };
        };
        request.onerror = () => {
          reject(request.error ?? new Error('IndexedDB open failed.'));
        };
      }),
  );

const selectLatest = async (
  request: APIRequestContext,
  mode: 'A' | 'B' | 'C' | 'invalid-hash' | 'partial-download',
) => {
  expect((await request.post(`/__managed-fixture/latest/${mode}`)).ok()).toBe(true);
};

const initializeReleaseA = async (page: Page) => {
  await launchApp(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await waitForExecutedRelease(page, 'A');
};

const goToAppUpdates = async (page: Page) => {
  await page.getByRole('button', { name: /^settings$/i }).click();
  await page.getByRole('button', { name: /app updates/i }).click();
  await expect(page.getByText('App updates', { exact: true }).last()).toBeVisible();
};

const openAppUpdates = async (page: Page) => {
  await goToAppUpdates(page);
  await expect(page.getByRole('heading', { name: /up to date/i })).toBeVisible();
};

const checkForUpdates = async (page: Page, expected: RegExp) => {
  await page.getByRole('button', { name: /check for updates/i }).click();
  await expect(page.getByRole('heading', { name: expected })).toBeVisible();
};

const setManual = async (page: Page) => {
  const automatic = page.getByRole('switch', { name: /automatic updates/i });
  if ((await automatic.getAttribute('aria-checked')) === 'true') await automatic.click();
  await expect(automatic).toHaveAttribute('aria-checked', 'false');
};

test.beforeEach(async ({ request }) => {
  await selectLatest(request, 'A');
  await request.post('/__managed-fixture/worker/current');
});

test('1 migration from generated stable worker and 2 existing install initialize Automatic without unregistering', async ({
  page,
  context,
  request,
}) => {
  await request.post('/__managed-fixture/worker/legacy');
  await page.goto('/branch/fixture/index.html');
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
  });
  await page.close();
  await request.post('/__managed-fixture/worker/current');
  const updating = await context.newPage();
  await launchApp(updating);
  await waitForManagedController(updating);
  await updating.close();
  const migrated = await context.newPage();
  await initializeReleaseA(migrated);
  await openAppUpdates(migrated);
  await expect(migrated.getByRole('switch', { name: /automatic updates/i })).toHaveAttribute(
    'aria-checked',
    'true',
  );
});

test('3 Automatic A to B prepares in background and activates on later safe launch', async ({
  page,
  context,
  request,
}) => {
  await initializeReleaseA(page);
  await openAppUpdates(page);
  await selectLatest(request, 'B');
  await checkForUpdates(page, /update ready/i);
  expect(await marker(page)).toBe('A');
  await page.close();
  const laterLaunch = await context.newPage();
  await launchApp(laterLaunch);
  await waitForExecutedRelease(laterLaunch, 'B');
});

test('4 latest equal running performs no preparation or trial', async ({ page }) => {
  await initializeReleaseA(page);
  await openAppUpdates(page);
  await checkForUpdates(page, /up to date/i);
  const cacheNames = await page.evaluate(() => caches.keys());
  expect(cacheNames.some((name) => name.includes('staging'))).toBe(false);
  await page.reload();
  expect(await marker(page)).toBe('A');
});

test('5 Manual pins A across all windows closing while B is latest', async ({
  page,
  context,
  request,
}) => {
  await initializeReleaseA(page);
  await openAppUpdates(page);
  await setManual(page);
  await selectLatest(request, 'B');
  await checkForUpdates(page, /update available/i);
  await page.close();
  const reopened = await context.newPage();
  await launchApp(reopened);
  await waitForExecutedRelease(reopened, 'A');
});

test('6 a prepared B candidate does not activate after switching to Manual', async ({
  page,
  context,
  request,
}) => {
  await initializeReleaseA(page);
  await openAppUpdates(page);
  await selectLatest(request, 'B');
  await checkForUpdates(page, /update ready/i);
  await setManual(page);
  await page.close();
  const reopened = await context.newPage();
  await launchApp(reopened);
  await waitForExecutedRelease(reopened, 'A');
});

test('7 Manual Update now activates B and advances the pin; 8 same SemVer advances by sequence', async ({
  page,
  request,
}) => {
  await initializeReleaseA(page);
  await openAppUpdates(page);
  await setManual(page);
  await selectLatest(request, 'B');
  await checkForUpdates(page, /update available/i);
  await page.getByRole('button', { name: /update now/i }).click();
  await waitForExecutedRelease(page, 'B');
  await openAppUpdates(page);
  await expect(page.getByText('Current version: 1.0.0')).toBeVisible();
  await expect(page.getByRole('switch', { name: /automatic updates/i })).toHaveAttribute(
    'aria-checked',
    'false',
  );
});

test('9 stale latest A cannot downgrade running B', async ({ page, context, request }) => {
  await initializeReleaseA(page);
  await openAppUpdates(page);
  await selectLatest(request, 'B');
  await checkForUpdates(page, /update ready/i);
  await page.close();
  const runningB = await context.newPage();
  await launchApp(runningB);
  await waitForExecutedRelease(runningB, 'B');
  await selectLatest(request, 'A');
  await openAppUpdates(runningB);
  await checkForUpdates(runningB, /up to date/i);
  await runningB.reload();
  expect(await marker(runningB)).toBe('B');
});

test('10 Manual Update now is blocked while another stable window is open and succeeds once it closes', async ({
  page,
  context,
  request,
}) => {
  await initializeReleaseA(page);
  const second = await context.newPage();
  await second.goto('/');
  await waitForExecutedRelease(second, 'A');

  await openAppUpdates(page);
  await setManual(page);
  await selectLatest(request, 'B');
  await checkForUpdates(page, /update available/i);
  await page.getByRole('button', { name: /update now/i }).click();
  await expect(page.getByText(/close other mioframe windows to update/i)).toBeVisible();
  expect(await marker(page)).toBe('A');

  await second.close();
  await page.getByRole('button', { name: /update now/i }).click();
  await waitForExecutedRelease(page, 'B');
});

test.fixme('11 active application work blocks update', async ({ page, request }) => {
  await initializeReleaseA(page);
  await openAppUpdates(page);
  await selectLatest(request, 'B');
  await checkForUpdates(page, /update ready/i);

  await page.getByRole('button', { name: /^home$/i }).click();
  await openOpfs(page);
  const directoryName = await createDirectory(page, 'active write fixture');
  await page.getByRole('button', { name: new RegExp(`^options ${directoryName}$`, 'i') }).click();
  await page.getByRole('menuitem', { name: /^rename$/i }).click();
  const dialog = page.getByRole('dialog', { name: /^rename/i });
  await dialog.getByLabel(/^name$/i).fill('active write fixture renamed');
  await dialog.getByRole('button', { name: /^rename$/i }).click();

  await goToAppUpdates(page);
  await page.getByRole('button', { name: /update now/i }).click();
  await expect(page.getByText(/changes are still being saved/i)).toBeVisible();
});
// Left as `fixme` rather than deleted or left flaky: every VFS-mutating dialog in this app (a
// shared DialogForm with a native <dialog> and loading-gated cancel) stays modal for its entire
// async duration, so a same-window write is either already settled by the time navigation
// reaches Update now (fast operations) or still blocks that same navigation via its own open
// dialog (slowed operations, confirmed by patching the VFS worker's OPFS primitives). Reaching
// this scenario for real needs a VFS mutation with no modal at all (e.g. an inline database cell
// edit) with its own document/property/row setup, which is unit-proven already via
// controller.test.ts's `vfsReadiness` gating but not yet reliably provable at the browser level.

test('12 branch and PR windows neither block nor reload', async ({ page, context, request }) => {
  await initializeReleaseA(page);
  const branch = await context.newPage();
  const preview = await context.newPage();
  await branch.goto('/branch/fixture/index.html');
  await preview.goto('/pr/161/index.html');
  await openAppUpdates(page);
  await selectLatest(request, 'B');
  await checkForUpdates(page, /update ready/i);
  await page.getByRole('button', { name: /update now/i }).click();
  await waitForExecutedRelease(page, 'B');
  await expect(branch).toHaveURL(/\/branch\/fixture\/index\.html$/);
  await expect(preview).toHaveURL(/\/pr\/161\/index\.html$/);
});

test('13 offline metadata check is not Up to date', async ({ page, context }) => {
  await initializeReleaseA(page);
  await openAppUpdates(page);
  await context.setOffline(true);
  await page.getByRole('button', { name: /check for updates/i }).click();
  await expect(page.getByRole('heading', { name: /could not check/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /up to date/i })).toHaveCount(0);
});

test('offline cold start serves the installed release with no network access', async ({
  page,
  context,
}) => {
  await initializeReleaseA(page);
  await page.close();
  const offline = await context.newPage();
  await context.setOffline(true);
  await offline.goto('/');
  await waitForExecutedRelease(offline, 'A');
});

test('offline deep-link navigation serves the installed release with no network access', async ({
  page,
  context,
}) => {
  await initializeReleaseA(page);
  await page.close();
  const offline = await context.newPage();
  await context.setOffline(true);
  await offline.goto('/settings/app-updates');
  await waitForExecutedRelease(offline, 'A');
});

for (const mode of ['invalid-hash', 'partial-download'] as const) {
  test(`14 ${mode} never becomes ready`, async ({ page, request }) => {
    await initializeReleaseA(page);
    await openAppUpdates(page);
    await selectLatest(request, mode);
    await page.getByRole('button', { name: /check for updates/i }).click();
    await expect(page.getByRole('heading', { name: /could not prepare update/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /update ready/i })).toHaveCount(0);
  });
}

test('15 failed first boot rolls back once and 16 failed C does not retry or loop', async ({
  page,
  request,
}) => {
  await initializeReleaseA(page);
  await openAppUpdates(page);
  await setManual(page);
  await selectLatest(request, 'C');
  await checkForUpdates(page, /update available/i);
  await page.getByRole('button', { name: /update now/i }).click();
  await page.waitForURL(/.*/);
  await page.reload();
  await waitForExecutedRelease(page, 'A');
  await page.reload();
  expect(await marker(page)).toBe('A');
});

test('17 deep links load the selected release', async ({ page, context, request }) => {
  await initializeReleaseA(page);
  await openAppUpdates(page);
  await selectLatest(request, 'B');
  await checkForUpdates(page, /update ready/i);
  await page.close();
  const deep = await context.newPage();
  await deep.goto('/settings/app-updates');
  await waitForExecutedRelease(deep, 'B');
});

test('18 Manual pin restores from archive when local cache is missing', async ({
  page,
  context,
}) => {
  await initializeReleaseA(page);
  await openAppUpdates(page);
  await setManual(page);
  await page.evaluate(async () => {
    await Promise.all(
      (await caches.keys())
        .filter((name) => name.startsWith('stable-release-'))
        .map((name) => caches.delete(name)),
    );
  });
  await page.close();
  const restored = await context.newPage();
  await launchApp(restored);
  await waitForExecutedRelease(restored, 'A');
});

test('19 active and pinned cache survive a failed repeat preparation', async ({
  page,
  request,
}) => {
  await initializeReleaseA(page);
  await openAppUpdates(page);
  await setManual(page);
  await selectLatest(request, 'invalid-hash');
  await checkForUpdates(page, /update available/i);
  await page.getByRole('button', { name: /update now/i }).click();
  await expect(page.getByRole('heading', { name: /could not prepare update/i })).toBeVisible();
  await page.reload();
  await waitForExecutedRelease(page, 'A');
});

test('unsupported or corrupt update persistence does not prevent application startup', async ({
  page,
}) => {
  await initializeReleaseA(page);
  await corruptControllerPersistence(page);
  await page.reload();
  await waitForExecutedRelease(page, 'A');
  await goToAppUpdates(page);
  await expect(page.getByRole('heading', { name: /status unavailable/i })).toBeVisible();
});
