import { expect, test } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildAndPublishManagedRelease,
  startManagedArtifactServer,
} from './fixtures/managedReleaseFixture.mjs';

// Develop channel isolation for the managed pinned application updates
// feature: independent scope, persisted state, and Cache Storage namespace
// from stable, served from the SAME origin (stable at `/`, develop at
// `/branch/develop/`) exactly like real GitHub Pages hosting.

const STABLE_BASE_PATH = '/';
const DEVELOP_BASE_PATH = '/branch/develop/';

async function readControllerStateDbNames(
  page: import('@playwright/test').Page,
): Promise<string[]> {
  return page.evaluate(async () => {
    if (!('databases' in indexedDB)) return [];
    const databases = await indexedDB.databases();
    return databases
      .map((db) => db.name)
      .filter((name): name is string => typeof name === 'string')
      .filter((name) => name.startsWith('mioframe-update-controller-'));
  });
}

test.describe('managed pinned application updates: develop channel isolation', () => {
  // Each test/hook here builds one or two real production artifacts via
  // `vite build`, which comfortably exceeds Playwright's default 30s
  // per-test/hook timeout.
  test.describe.configure({ timeout: 180_000 });

  let workDir = '';
  let server: Awaited<ReturnType<typeof startManagedArtifactServer>>;

  test.beforeAll(async () => {
    // `describe.configure({ timeout })` covers this describe block's tests
    // but not `beforeAll` itself; hooks need their own explicit override.
    test.setTimeout(180_000);
    workDir = mkdtempSync(join(tmpdir(), 'managed-release-develop-work-'));
    await buildAndPublishManagedRelease({
      channel: 'stable',
      basePath: STABLE_BASE_PATH,
      appVersion: '1.0.0',
      buildId: 'stable-release-a',
      workDir,
    });
    await buildAndPublishManagedRelease({
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
  });

  test.afterAll(async () => {
    await server.close();
    rmSync(workDir, { recursive: true, force: true });
  });

  test('stable and develop each install their own controller with independent persisted state', async ({
    browser,
  }) => {
    const stableContext = await browser.newContext({ baseURL: server.url });
    const stablePage = await stableContext.newPage();
    await stablePage.goto(server.url);
    await stablePage.waitForFunction(() => navigator.serviceWorker.controller !== null);

    const developContext = await browser.newContext({ baseURL: server.url });
    const developPage = await developContext.newPage();
    await developPage.goto(`${server.url}branch/develop/`);
    await developPage.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await expect(developPage.getByText(/^browser storage$/i)).toBeVisible();

    const stableDbNames = await readControllerStateDbNames(stablePage);
    const developDbNames = await readControllerStateDbNames(developPage);

    expect(stableDbNames).toContain('mioframe-update-controller-stable');
    expect(developDbNames).toContain('mioframe-update-controller-branch-develop');
    expect(stableDbNames).not.toContain('mioframe-update-controller-branch-develop');
    expect(developDbNames).not.toContain('mioframe-update-controller-stable');

    await stableContext.close();
    await developContext.close();
  });

  test('a develop release scheduled for install-on-next-launch does not affect stable', async ({
    browser,
  }) => {
    await buildAndPublishManagedRelease({
      channel: 'develop',
      basePath: DEVELOP_BASE_PATH,
      appVersion: '1.1.0-dev',
      buildId: 'develop-release-b',
      workDir,
    });

    const developContext = await browser.newContext({ baseURL: server.url });
    const developPage = await developContext.newPage();
    await developPage.goto(`${server.url}branch/develop/`);
    await developPage.waitForFunction(() => navigator.serviceWorker.controller !== null);

    const checkResult = await developPage.evaluate(
      () =>
        new Promise<{ snapshot: { latestRelease?: unknown } }>((resolve) => {
          const channel = new MessageChannel();
          channel.port1.onmessage = (event) => {
            resolve(event.data);
          };
          navigator.serviceWorker.controller?.postMessage({ type: 'CHECK_FOR_UPDATES' }, [
            channel.port2,
          ]);
        }),
    );
    expect(checkResult.snapshot.latestRelease).toBeTruthy();

    const stableContext = await browser.newContext({ baseURL: server.url });
    const stablePage = await stableContext.newPage();
    await stablePage.goto(server.url);
    await stablePage.waitForFunction(() => navigator.serviceWorker.controller !== null);

    const stableSnapshot = await stablePage.evaluate(
      () =>
        new Promise<{ snapshot: { latestRelease?: unknown } }>((resolve) => {
          const channel = new MessageChannel();
          channel.port1.onmessage = (event) => {
            resolve(event.data);
          };
          navigator.serviceWorker.controller?.postMessage({ type: 'GET_SNAPSHOT' }, [
            channel.port2,
          ]);
        }),
    );
    expect(stableSnapshot.snapshot.latestRelease).toBeUndefined();

    await developContext.close();
    await stableContext.close();
  });
});
