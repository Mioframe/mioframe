import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { launchApp } from '../helpers';
import {
  createPersistentProfile,
  launchPersistentBrowser,
  removePersistentProfile,
} from './persistentProfile';

const marker = (page: Page) =>
  page.evaluate(() => Reflect.get(globalThis, '__MIOFRAME_EXECUTED_RELEASE__'));
const waitForExecutedRelease = (page: Page, release: 'A' | 'B') =>
  page.waitForFunction(
    (expected) => Reflect.get(globalThis, '__MIOFRAME_EXECUTED_RELEASE__') === expected,
    release,
  );
type ReleaseTestVfsActivity = {
  /** Starts one real, tracked pending VFS operation and returns its token. */
  start: () => Promise<string>;
  /** Resolves the pending operation identified by `token`. */
  finish: (token: string) => Promise<void>;
};
// Drives the release-only VFS-activity test seam (see `MainApp.vue`/`useVfsActivity.ts`): starts
// or finishes one real, tracked VFS operation through the same production activity tracking
// `useVfsActivity` exposes, without overriding `vfsReady` directly.
const startReleaseTestVfsActivity = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const activity: ReleaseTestVfsActivity = Reflect.get(
      globalThis,
      '__MIOFRAME_RELEASE_TEST_VFS_ACTIVITY__',
    );
    return activity.start();
  });
const finishReleaseTestVfsActivity = (page: Page, token: string): Promise<void> =>
  page.evaluate((activeToken) => {
    const activity: ReleaseTestVfsActivity = Reflect.get(
      globalThis,
      '__MIOFRAME_RELEASE_TEST_VFS_ACTIVITY__',
    );
    return activity.finish(activeToken);
  }, token);
// Triggers a real browser update check (the same API a returning visit or periodic background
// check would use) — this is a genuine browser action, not a reproduction of the managed-update
// connection protocol.
const triggerControllerUpdateCheck = (page: Page) =>
  page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration('/');
    await registration?.update();
  });

// Waits only on public application UI: production's own `setupManagedAppUpdates()`/
// `controllerchange` reconnect (see `client.ts`) is what actually establishes capability here —
// this helper never sends or listens for controller protocol messages itself.
const waitForManagedCapability = async (page: Page) => {
  await goToAppUpdates(page);
  await expect(page.getByRole('heading', { name: /status unavailable/i })).toHaveCount(0);
};
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
  await triggerControllerUpdateCheck(updating);
  await waitForManagedCapability(updating);
  await updating.close();
  const migrated = await context.newPage();
  await initializeReleaseA(migrated);
  await openAppUpdates(migrated);
  await expect(migrated.getByRole('switch', { name: /automatic updates/i })).toHaveAttribute(
    'aria-checked',
    'true',
  );
});

test('production client reconnects after worker takeover, and conservative live-window counting still blocks Update now for a second window that has not yet re-registered', async ({
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

  // Both windows load under the still-active legacy worker before the server ever serves the
  // managed worker's bytes, matching "already open before the new worker takes control".
  const first = await context.newPage();
  await first.goto('/');
  const second = await context.newPage();
  await second.goto('/');

  await request.post('/__managed-fixture/worker/current');
  // Only `first` explicitly checks for a worker update; `second` does nothing of its own. Its
  // reconnect must come from production's own `controllerchange` handling, not a second explicit
  // check, and its liveness must count for blocking regardless of whether it has reconnected yet.
  await triggerControllerUpdateCheck(first);
  await waitForManagedCapability(first);

  await goToAppUpdates(first);
  await setManual(first);
  await selectLatest(request, 'B');
  await checkForUpdates(first, /update available/i);
  await first.getByRole('button', { name: /update now/i }).click();
  await expect(first.getByText(/close other mioframe windows to update/i)).toBeVisible();

  // `second` never explicitly re-checked, yet it reconnects and reports real capability, proving
  // production's own `controllerchange` handling — not test-only retry code — completed its
  // private handshake with the new controller.
  await goToAppUpdates(second);
  await expect(second.getByRole('heading', { name: /status unavailable/i })).toHaveCount(0);

  await second.close();
  await first.getByRole('button', { name: /update now/i }).click();
  await waitForExecutedRelease(first, 'B');
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

test('a pending trial serves only its claiming client B; an unrelated client keeps receiving the committed A and cannot confirm the trial', async ({
  page,
  context,
  request,
}) => {
  await initializeReleaseA(page);
  await openAppUpdates(page);
  await setManual(page);
  await selectLatest(request, 'B');
  await checkForUpdates(page, /update available/i);

  // The claiming client's own reload navigation is what actually claims the trial; waiting for it
  // to start (real navigation lifecycle, not a sleep) before opening the unrelated client below
  // guarantees the trial already exists and is already claimed by `page`, so `other`'s subsequent
  // navigation exercises the "unrelated client during a pending trial" path deterministically.
  await Promise.all([
    page.waitForURL(/.*/),
    page.getByRole('button', { name: /update now/i }).click(),
  ]);

  const other = await context.newPage();
  await other.goto('/');
  // The unrelated client is served the committed release, not the trial target, while the trial
  // is still pending.
  await waitForExecutedRelease(other, 'A');

  // The claiming client's own reload completes its confirmation and commits the trial. Waiting
  // for its own status to settle past `trialStarting` (not just its executed-release marker,
  // which fires on parse, before the app has mounted and sent its own boot confirmation) proves
  // the trial has actually committed before `other` reloads below.
  await waitForExecutedRelease(page, 'B');
  await openAppUpdates(page);

  // The unrelated client never claimed or ran the trial target and still cannot receive or
  // confirm it after commit either — it only sees the now-committed release on its own next
  // navigation, exactly as any ordinary client would.
  await other.reload();
  await waitForExecutedRelease(other, 'B');
});

test('11 active application work blocks update', async ({ page, request }) => {
  await initializeReleaseA(page);
  await openAppUpdates(page);
  await setManual(page);
  await selectLatest(request, 'B');
  await checkForUpdates(page, /update available/i);

  const token = await startReleaseTestVfsActivity(page);

  await goToAppUpdates(page);
  await page.getByRole('button', { name: /update now/i }).click();
  await expect(page.getByText(/changes are still being saved/i)).toBeVisible();
  expect(await marker(page)).toBe('A');

  await finishReleaseTestVfsActivity(page, token);

  await page.getByRole('button', { name: /update now/i }).click();
  await waitForExecutedRelease(page, 'B');
});

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

test('offline cold start serves the installed release after a real browser-process restart with no network access', async () => {
  const profileDir = createPersistentProfile();
  try {
    const install = await launchPersistentBrowser(profileDir);
    try {
      await initializeReleaseA(await install.newPage());
    } finally {
      // Closes the entire browser context/process, not just the page.
      await install.close();
    }

    const restarted = await launchPersistentBrowser(profileDir);
    try {
      await restarted.setOffline(true);
      const offline = await restarted.newPage();
      await offline.goto('/');
      await waitForExecutedRelease(offline, 'A');
    } finally {
      await restarted.close();
    }
  } finally {
    removePersistentProfile(profileDir);
  }
});

test('offline deep-link navigation serves the installed release after a real browser-process restart with no network access', async () => {
  const profileDir = createPersistentProfile();
  try {
    const install = await launchPersistentBrowser(profileDir);
    try {
      await initializeReleaseA(await install.newPage());
    } finally {
      await install.close();
    }

    const restarted = await launchPersistentBrowser(profileDir);
    try {
      await restarted.setOffline(true);
      const offline = await restarted.newPage();
      await offline.goto('/settings/app-updates');
      await waitForExecutedRelease(offline, 'A');
    } finally {
      await restarted.close();
    }
  } finally {
    removePersistentProfile(profileDir);
  }
});

test('Manual pin survives a real browser-process restart', async ({ request }) => {
  const profileDir = createPersistentProfile();
  try {
    const install = await launchPersistentBrowser(profileDir);
    try {
      const page = await install.newPage();
      await initializeReleaseA(page);
      await openAppUpdates(page);
      await setManual(page);
      await selectLatest(request, 'B');
      await checkForUpdates(page, /update available/i);
    } finally {
      await install.close();
    }

    const restarted = await launchPersistentBrowser(profileDir);
    try {
      const page = await restarted.newPage();
      await page.goto('/');
      await waitForExecutedRelease(page, 'A');
    } finally {
      await restarted.close();
    }
  } finally {
    removePersistentProfile(profileDir);
  }
});

test('a newer worker whose own build differs from the pinned release still serves the pinned release after a real offline browser-process restart', async ({
  request,
}) => {
  const profileDir = createPersistentProfile();
  try {
    const install = await launchPersistentBrowser(profileDir);
    try {
      const page = await install.newPage();
      await initializeReleaseA(page);
      await openAppUpdates(page);
      await setManual(page);
      await selectLatest(request, 'B');
      await checkForUpdates(page, /update available/i);

      // A newer controller worker whose own build identity is release B takes over, while the
      // persisted pin remains release A — Manual mode never activates a discovered target on its
      // own, so the pin is untouched by this worker takeover.
      await request.post('/__managed-fixture/worker/B');
      await triggerControllerUpdateCheck(page);
      await waitForManagedCapability(page);
    } finally {
      await install.close();
    }

    const restarted = await launchPersistentBrowser(profileDir);
    try {
      await restarted.setOffline(true);
      const page = await restarted.newPage();
      await page.goto('/');
      await waitForExecutedRelease(page, 'A');
    } finally {
      await restarted.close();
    }
  } finally {
    removePersistentProfile(profileDir);
  }
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
