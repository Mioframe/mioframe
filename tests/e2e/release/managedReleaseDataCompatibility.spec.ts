import { expect, test, type BrowserContext } from '@playwright/test';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildAndPublishManagedRelease,
  startManagedArtifactServer,
} from './fixtures/managedReleaseFixture.mjs';
import {
  closeDocumentPane,
  createDatabaseDocument,
  createStringProperty,
  createUniqueName,
  findDatabaseRow,
  openDocumentFromExplorer,
  openOpfs,
  addDatabaseItem,
} from '../helpers';

/**
 * Proves the managed pinned application updates feature's data-compatibility
 * invariant (`docs/managed-pinned-updates.md`, "Data compatibility") as a
 * real browser round trip: while a previous managed release A remains a
 * supported pin/rollback target, data written by newer release B must
 * remain readable by A.
 *
 * This proof owns only user-data compatibility across archived releases —
 * it never reproduces activation, BOOT_OK, rollback, recovery, or
 * controller lifecycle scenarios, so Service Workers are blocked for the
 * whole browser context. Real application builds are router/base-anchored
 * to their deployment root and are not meant to be browsed directly from an
 * arbitrary `updates/releases/<n>/index.html` path, so "switching" between
 * releases is done the same way a real deployment ever serves an archived
 * release: by copying that release's own already-archived, immutable
 * `index.html` bytes over the channel's live deployed `index.html` before
 * navigating, never by navigating to a non-root path. Every navigation
 * still lands on the exact same origin and root URL, and the channel's
 * shared, accumulated `assets/` directory is never touched — only which
 * archived `index.html` currently answers `/` changes — so OPFS/IndexedDB
 * product data stays on one shared storage partition throughout.
 *
 * Two run modes, selected by whether `MANAGED_COMPAT_WORK_DIR` is set:
 * - given (the managed-release publication preflight's real invocation,
 *   see `scripts/pages/lib/managedCompatibilityPreflight.mjs`): serves the
 *   exact staged work directory and release numbers it was given — the real
 *   previously published release and the real newly staged candidate;
 * - absent (this suite's own hermetic `pnpm verify --full --only managed-updates`
 *   run, and local development): builds and publishes two real releases
 *   itself via the same fixture every other managed-updates spec uses, so
 *   this proof's own mechanism is fully exercised without a live Pages
 *   repository.
 */

const envWorkDir = process.env.MANAGED_COMPAT_WORK_DIR;
const envChannel = process.env.MANAGED_COMPAT_CHANNEL;
const envPreviousRelease = process.env.MANAGED_COMPAT_PREVIOUS_RELEASE;
const envCandidateRelease = process.env.MANAGED_COMPAT_CANDIDATE_RELEASE;

const isStagedRun = envWorkDir !== undefined;

if (isStagedRun && (!envChannel || !envPreviousRelease || !envCandidateRelease)) {
  throw new Error(
    'MANAGED_COMPAT_WORK_DIR was given without MANAGED_COMPAT_CHANNEL, ' +
      'MANAGED_COMPAT_PREVIOUS_RELEASE, and MANAGED_COMPAT_CANDIDATE_RELEASE',
  );
}

const channel: 'stable' | 'develop' = envChannel === 'develop' ? 'develop' : 'stable';
const basePath = channel === 'stable' ? '/' : '/branch/develop/';

test.describe('managed pinned application updates: data compatibility (A/B/A)', () => {
  // The hermetic fallback path (no MANAGED_COMPAT_WORK_DIR) builds and
  // publishes two real releases in beforeAll — each a real cold `vite
  // build` when this spec runs alone in its own fresh container with no
  // warm template cache, comfortably exceeding Playwright's 30s default
  // hook timeout. Matches managedUpdatesCrossEngineLifecycle.spec.ts's own
  // describe-level timeout override for the same class of slow beforeAll.
  test.describe.configure({ mode: 'serial', timeout: 300_000 });

  let workDir = '';
  let ownsWorkDir = false;
  let previousReleaseNumber = 0;
  let candidateReleaseNumber = 0;
  let server: Awaited<ReturnType<typeof startManagedArtifactServer>>;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    if (envWorkDir !== undefined) {
      // envPreviousRelease/envCandidateRelease are guaranteed defined here
      // — validated together with envWorkDir above.
      workDir = envWorkDir;
      previousReleaseNumber = Number(envPreviousRelease);
      candidateReleaseNumber = Number(envCandidateRelease);
    } else {
      ownsWorkDir = true;
      workDir = mkdtempSync(join(tmpdir(), 'managed-release-data-compat-work-'));
      const releaseA = await buildAndPublishManagedRelease({
        channel,
        basePath,
        appVersion: '1.0.0',
        buildId: 'data-compat-release-a',
        workDir,
      });
      const releaseB = await buildAndPublishManagedRelease({
        channel,
        basePath,
        appVersion: '1.1.0',
        buildId: 'data-compat-release-b',
        workDir,
      });
      previousReleaseNumber = releaseA.releaseNumber;
      candidateReleaseNumber = releaseB.releaseNumber;
    }

    server = await startManagedArtifactServer({ workDir, basePath: '/' });
    // Service Workers are blocked for this whole context: this proof owns
    // only user-data compatibility across archived releases, never
    // controller/activation lifecycle.
    context = await browser.newContext({ baseURL: server.url, serviceWorkers: 'block' });
  });

  test.afterAll(async () => {
    await context.close();
    await server.close();
    if (ownsWorkDir) {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  test('release A can read user data written and edited by candidate release B, after A/B/A', async () => {
    // Three sequential real page boots, each with real OPFS/CRDT document
    // work, exceed the default per-test budget.
    test.info().setTimeout(120_000);

    const channelDir = channel === 'stable' ? workDir : join(workDir, 'branch', 'develop');
    const liveIndexPath = join(channelDir, 'index.html');
    const archivedIndexPath = (releaseNumber: number) =>
      join(channelDir, 'updates', 'releases', String(releaseNumber), 'index.html');
    // Selects which archived release answers the channel's live `/` — the
    // shared `assets/` directory underneath is never touched, so switching
    // never changes origin or storage, only which immutable index.html is
    // currently served at the root.
    const selectRelease = (releaseNumber: number) => {
      copyFileSync(archivedIndexPath(releaseNumber), liveIndexPath);
    };

    // 1. Serve real A; create representative persisted product data.
    selectRelease(previousReleaseNumber);
    const pageA1 = await context.newPage();
    await pageA1.goto('/');
    await openOpfs(pageA1);
    const documentName = await createDatabaseDocument(
      pageA1,
      createUniqueName('data compatibility document'),
    );
    await openDocumentFromExplorer(pageA1, documentName);
    await closeDocumentPane(pageA1);
    await expect(pageA1.getByText(documentName, { exact: true })).toBeVisible();
    // Close A.
    await pageA1.close();

    // 2. Serve candidate B from the same origin; open the same data;
    // perform and persist a normal user-data edit.
    selectRelease(candidateReleaseNumber);
    const pageB = await context.newPage();
    await pageB.goto('/');
    await openOpfs(pageB);
    await expect(pageB.getByText(documentName, { exact: true })).toBeVisible();
    await openDocumentFromExplorer(pageB, documentName);
    const propertyName = await createStringProperty(
      pageB,
      createUniqueName('data compatibility property'),
    );
    const itemValue = createUniqueName('data compatibility row');
    await addDatabaseItem(pageB, propertyName, itemValue);
    await expect(findDatabaseRow(pageB, itemValue)).toBeVisible();
    await closeDocumentPane(pageB);
    // Close B.
    await pageB.close();

    // 3. Serve real A again; verify both the original data and the
    // B-written data are readable.
    selectRelease(previousReleaseNumber);
    const pageA2 = await context.newPage();
    await pageA2.goto('/');
    await openOpfs(pageA2);
    await expect(pageA2.getByText(documentName, { exact: true })).toBeVisible();
    await openDocumentFromExplorer(pageA2, documentName);
    await expect(findDatabaseRow(pageA2, itemValue)).toBeVisible();
    await expect(
      pageA2.getByText(/error reading|corrupt|lost changes|failed to open/i),
    ).toHaveCount(0);
    await pageA2.close();
  });
});
