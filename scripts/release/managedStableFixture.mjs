import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runGuardedExpensiveLocalCommand } from '../lib/localCommandGuard.mjs';
import { runLocalCommand } from '../lib/runLocalCommand.mjs';
import { runBuildArtifact } from './buildArtifact.mjs';

const RELEASES = [
  { label: 'A', releaseId: 'a'.repeat(40), releaseSequence: 1, appVersion: '1.0.0' },
  { label: 'B', releaseId: 'b'.repeat(40), releaseSequence: 2, appVersion: '1.0.0' },
  { label: 'C', releaseId: 'c'.repeat(40), releaseSequence: 3, appVersion: '1.1.0' },
];

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

/**
 * Build a real, previously-generated-style Workbox stable worker and its complete application
 * artifact for the migration fixture: the repository's own `branch`-channel PWA config (root
 * scope, real Workbox precache, runtime caching, navigation fallback/denylist, no managed-update
 * protocol — see `config/plugins/pwa.ts`), the same worker and precached application the stable
 * app served before this managed-update feature, built once via the real build pipeline rather
 * than hand-written or approximated with the current branch-channel config's own app bytes.
 *
 * The complete build output (`sw.js`, any separately generated Workbox runtime chunk, the
 * precached `index.html`, hashed assets, and manifest) is preserved under `legacyArtifactDir` —
 * not just the worker source — so the legacy worker's own precache manifest is served real,
 * matching legacy content rather than the new managed artifact's bytes under old URLs.
 * @param legacyDistDir - Scratch build output directory for the legacy build.
 * @param legacyArtifactDir - Destination directory the complete legacy artifact tree is copied
 * into, served by the artifact server while legacy worker mode is selected.
 * @throws {Error} When the legacy worker build fails.
 */
async function buildLegacyWorkboxWorker(legacyDistDir, legacyArtifactDir) {
  const viteBin = './node_modules/.bin/vite';
  const args = ['build', '--outDir', legacyDistDir];
  const env = {
    ...process.env,
    BASE_URL: '/',
    VITE_RELEASE_CHANNEL: 'branch',
    VITE_RELEASE_CHANNEL_ID: 'fixture-legacy',
    VITE_BUILD_DATE: new Date().toISOString(),
  };
  const result = await runGuardedExpensiveLocalCommand({
    label: 'release-build',
    command: `${viteBin} ${args.join(' ')}`,
    executable: viteBin,
    args,
    env,
    run: (lockEnv) => runLocalCommand({ command: viteBin, args, env: { ...env, ...lockEnv } }),
  });
  if (result.status !== 0 || result.signal) {
    throw new Error(
      `Legacy Workbox fixture worker build failed (status ${result.status}, signal ${result.signal}).`,
    );
  }
  if (!existsSync(join(legacyDistDir, 'sw.js'))) {
    throw new Error('Legacy Workbox fixture build did not produce a compiled sw.js.');
  }
  cpSync(legacyDistDir, legacyArtifactDir, { recursive: true });
}

/**
 * Build a real stable-channel controller worker embedding a different release's own build
 * identity than the primary fixture artifact — the "a newer worker's own build differs from the
 * persisted committed release" scenario (offline bootstrap must serve the persisted release, not
 * this worker's own build, in that case).
 * @param altDistDir - Scratch build output directory for this alternate worker only.
 * @param release - The release whose identity this alternate worker embeds.
 * @returns The compiled alternate `sw.js` source text, with its real sequence already patched in.
 */
async function buildAlternateManagedWorker(altDistDir, release) {
  await runBuildArtifact(['--base', '/', '--dist', altDistDir], undefined, {
    ...process.env,
    RELEASE_ARTIFACT_SKIP_BUILD: '0',
    GITHUB_SHA: release.releaseId,
    // Rendered exactly once, directly to this release's own sequence: the strict renderer
    // rejects re-rendering an already-different value, so this must not double-patch.
    RELEASE_ARTIFACT_SEQUENCE: String(release.releaseSequence),
  });
  if (process.exitCode) {
    throw new Error(`Alternate managed fixture worker build for release ${release.label} failed.`);
  }
  return readFileSync(join(altDistDir, 'sw.js'), 'utf8');
}

/**
 * Build one real stable controller artifact and three immutable application releases.
 * @param [distDir] - Fixture output directory.
 * @returns Completion after fixture metadata and archives are written.
 */
export async function buildManagedStableFixture(distDir = 'dist') {
  const releaseA = RELEASES[0];
  // `runBuildArtifact` forwards the real `process.env` to its own `vite build` invocation, not
  // the `env` argument below (that argument only feeds this function's own release-id/skip-build
  // resolution) — so the release-only test-hook flag must be set here, on the real process env,
  // scoped to this one build and restored immediately after. This script is only ever invoked for
  // the Playwright release fixture, never for the real production/branch/PR build pipelines.
  process.env.VITE_RELEASE_TEST_HOOKS = '1';
  try {
    await runBuildArtifact(['--base', '/', '--dist', distDir], undefined, {
      ...process.env,
      RELEASE_ARTIFACT_SKIP_BUILD: '0',
      GITHUB_SHA: releaseA.releaseId,
      // The compiled worker embeds release A's build identity (`GITHUB_SHA: releaseA.releaseId`
      // above) and its real sequence, the same way a genuine publish would, so the fixture
      // actually exercises the worker's offline embedded-identity bootstrap path instead of
      // always falling back to network/cache resolution in tests.
      RELEASE_ARTIFACT_SEQUENCE: String(releaseA.releaseSequence),
    });
  } finally {
    delete process.env.VITE_RELEASE_TEST_HOOKS;
  }
  if (process.exitCode) return;

  // A real, previously-generated-style Workbox worker and its complete precached application
  // (see `buildLegacyWorkboxWorker`), built once into a scratch directory and the full tree
  // copied alongside the managed fixture for the artifact server to serve entirely when the
  // legacy worker mode is selected — not just a substituted `sw.js` over the new artifact's bytes.
  const legacyDistDir = `${distDir}-legacy-worker`;
  const legacyArtifactDir = join(distDir, 'legacy-artifact');
  try {
    await buildLegacyWorkboxWorker(legacyDistDir, legacyArtifactDir);
  } finally {
    rmSync(legacyDistDir, { recursive: true, force: true });
  }

  // A second real managed worker embedding release B's own build identity, for the offline
  // bootstrap scenario where a newer worker's own build differs from the persisted committed
  // release.
  const releaseB = RELEASES[1];
  const alternateDistDir = `${distDir}-worker-b`;
  try {
    const alternateWorkerSource = await buildAlternateManagedWorker(alternateDistDir, releaseB);
    writeFileSync(join(distDir, 'worker-b-sw.js'), alternateWorkerSource);
  } finally {
    rmSync(alternateDistDir, { recursive: true, force: true });
  }

  const descriptorAPath = join(distDir, 'updates', 'releases', `${releaseA.releaseId}.json`);
  const builtDescriptor = JSON.parse(readFileSync(descriptorAPath, 'utf8'));
  const builtIndex = readFileSync(join(distDir, 'index.html'), 'utf8');
  const assetFiles = builtDescriptor.files.filter(({ url }) => url.startsWith('/assets/'));
  const fixture = { schemaVersion: 1, releases: {} };

  for (const release of RELEASES) {
    let index = builtIndex.replace(
      '<head>',
      `<head><meta name="mioframe-release-id" content="${release.releaseId}"><script>globalThis.__MIOFRAME_EXECUTED_RELEASE__=${JSON.stringify(release.label)}</script>`,
    );
    if (release.label === 'C') {
      index = index.replace(
        /<script type="module"[^>]*src="[^"]+"[^>]*><\/script>/,
        '<script type="module" src="/assets/first-boot-missing.js"></script>',
      );
    }
    const indexBytes = Buffer.from(index);
    const identity = {
      releaseId: release.releaseId,
      releaseSequence: release.releaseSequence,
      appVersion: release.appVersion,
      buildId: release.releaseId.slice(0, 7),
      buildDate: `2026-07-2${release.releaseSequence}T00:00:00.000Z`,
    };
    const indexUrl = `/updates/releases/${release.releaseId}/index.html`;
    const descriptor = {
      schemaVersion: 2,
      ...identity,
      indexUrl,
      files: [
        ...assetFiles,
        { url: indexUrl, byteSize: indexBytes.byteLength, sha256: sha256(indexBytes) },
      ].sort((left, right) => left.url.localeCompare(right.url)),
    };
    const latest = {
      schemaVersion: 2,
      release: identity,
      descriptorUrl: `/updates/releases/${release.releaseId}.json`,
    };
    mkdirSync(join(distDir, 'updates', 'releases', release.releaseId), { recursive: true });
    writeFileSync(join(distDir, indexUrl), indexBytes);
    writeFileSync(
      join(distDir, 'updates', 'releases', `${release.releaseId}.json`),
      `${JSON.stringify(descriptor, null, 2)}\n`,
    );
    fixture.releases[release.label] = { latest, descriptor };
  }

  writeFileSync(
    join(distDir, 'updates', 'latest.json'),
    `${JSON.stringify(fixture.releases.A.latest, null, 2)}\n`,
  );
  writeFileSync(
    join(distDir, 'managed-stable-fixture.json'),
    `${JSON.stringify(fixture, null, 2)}\n`,
  );
  mkdirSync(join(distDir, 'branch', 'fixture'), { recursive: true });
  mkdirSync(join(distDir, 'pr', '161'), { recursive: true });
  writeFileSync(
    join(distDir, 'branch', 'fixture', 'index.html'),
    '<!doctype html><title>Branch fixture</title>',
  );
  writeFileSync(
    join(distDir, 'pr', '161', 'index.html'),
    '<!doctype html><title>PR fixture</title>',
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await buildManagedStableFixture();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
