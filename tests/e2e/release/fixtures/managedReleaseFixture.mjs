/**
 * Test-only helper for the managed pinned application updates e2e specs:
 * builds a real production artifact for one managed channel, publishes it
 * into a retained release tree via the real publisher
 * (`scripts/pages/lib/releasePublish.mjs`), and serves the result with the
 * same static artifact server used by the other release specs
 * (`scripts/release/artifactServer.mjs`).
 *
 * Never used by the real application build or deploy pipeline — only by
 * `tests/e2e/release/managedUpdates*.spec.ts`.
 */

import { appendFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runLocalCommand } from '../../../../scripts/lib/runLocalCommand.mjs';
import { createArtifactServer } from '../../../../scripts/release/artifactServer.mjs';
import { applyStablePublish } from '../../../../scripts/pages/lib/pagesFs.mjs';
import { publishManagedRelease } from '../../../../scripts/pages/lib/releasePublish.mjs';

const MAIN_MODULE_SCRIPT_PATTERN = /<script type="module"[^>]*\ssrc="([^"]+)"/;

/**
 * Overwrites the built entry module script with source that throws
 * immediately on evaluation, so this artifact genuinely fails to boot in a
 * real browser. The corruption happens before publishing, on the same
 * bytes the publisher hashes and archives, so the resulting release is
 * internally consistent (its SHA-256 matches its own broken content) —
 * exactly like a real deployment that passed CI but has a runtime bug,
 * rather than a mismatch a hash check would reject.
 * @param distDir The built artifact directory to corrupt in place.
 * @param basePath The Vite `base` this artifact was built with.
 * @throws When the main module script entry cannot be found in `index.html`.
 */
function corruptEntryScript(distDir, basePath) {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');
  const match = MAIN_MODULE_SCRIPT_PATTERN.exec(html);
  if (!match) {
    throw new Error('Could not find the main module script entry to corrupt');
  }
  const src = match[1];
  const relativePath = src.startsWith(basePath)
    ? src.slice(basePath.length)
    : src.replace(/^\//, '');
  writeFileSync(join(distDir, relativePath), 'throw new Error("simulated boot failure");');
}

const VITE_BIN = './node_modules/.bin/vite';

async function buildViteArtifact({ channel, basePath, extraEnv = {} }) {
  const distDir = mkdtempSync(join(tmpdir(), 'managed-release-dist-'));
  const result = await runLocalCommand({
    command: VITE_BIN,
    args: ['build', '--outDir', distDir, '--emptyOutDir'],
    env: {
      ...process.env,
      BASE_URL: basePath,
      VITE_RELEASE_CHANNEL: channel === 'stable' ? 'stable' : 'branch',
      ...(channel === 'stable' ? {} : { VITE_RELEASE_CHANNEL_ID: 'develop' }),
      ...extraEnv,
    },
  });
  if (result.status !== 0 || result.signal) {
    rmSync(distDir, { recursive: true, force: true });
    throw new Error(
      `vite build failed for channel "${channel}": ${result.stderr || result.stdout}`,
    );
  }
  return distDir;
}

/**
 * Builds one production artifact for a managed channel and publishes it
 * into `workDir`'s retained release tree.
 * @param options Build and publish inputs.
 * @param options.channel Managed channel: `'stable'` or `'develop'`.
 * @param options.basePath Vite `base` for this build, e.g. `/` or `/branch/develop/`.
 * @param options.appVersion `package.json`-style version to record for this release.
 * @param options.buildId Build identity to record for this release.
 * @param options.workDir The retained-release work directory to publish into.
 * @param [options.extraEnv] Additional Vite build environment variables.
 * @returns The published `ReleaseDescriptor`.
 * @throws When the `vite build` step fails.
 */
export async function buildAndPublishManagedRelease({
  channel,
  basePath,
  appVersion,
  buildId,
  workDir,
  extraEnv = {},
}) {
  const distDir = await buildViteArtifact({ channel, basePath, extraEnv });
  try {
    return publishManagedRelease({ workDir, distDir, channel, basePath, appVersion, buildId });
  } finally {
    rmSync(distDir, { recursive: true, force: true });
  }
}

/**
 * Builds and publishes a managed release whose entry module script has been
 * replaced with source that throws immediately on evaluation. Used only to
 * prove real boot-failure detection and rollback: the archived release's
 * own inline boot watchdog (injected by the real publisher, unmodified by
 * this fixture) is what detects the failure and reports it, not a test-side
 * reproduction of the private protocol.
 * @param options Build and publish inputs; see {@link buildAndPublishManagedRelease}.
 * @returns The published `ReleaseDescriptor`.
 * @throws When the `vite build` step fails or the entry script cannot be corrupted.
 */
export async function buildAndPublishBrokenManagedRelease({
  channel,
  basePath,
  appVersion,
  buildId,
  workDir,
  extraEnv = {},
}) {
  const distDir = await buildViteArtifact({ channel, basePath, extraEnv });
  try {
    corruptEntryScript(distDir, basePath);
    return publishManagedRelease({ workDir, distDir, channel, basePath, appVersion, buildId });
  } finally {
    rmSync(distDir, { recursive: true, force: true });
  }
}

/**
 * Builds the frozen legacy (pre-feature, plain `generateSW`) stable artifact
 * and applies it as an ordinary unmanaged stable publish — no retained
 * release tree, no watchdog — matching exactly what a real installed user's
 * browser already has before the managed pinned application updates
 * feature. Only for `tests/e2e/release/managedUpdatesMigration.spec.ts`.
 * @param options Build inputs.
 * @param options.workDir The Pages work directory to publish into.
 * @returns Nothing; the legacy artifact is applied directly into `workDir`.
 * @throws When the `vite build` step fails.
 */
export async function buildAndApplyLegacyStableDeploy({ workDir }) {
  const distDir = await buildViteArtifact({
    channel: 'stable',
    basePath: '/',
    extraEnv: { RELEASE_TEST_LEGACY_PWA_FIXTURE: '1' },
  });
  try {
    applyStablePublish(workDir, distDir);
  } finally {
    rmSync(distDir, { recursive: true, force: true });
  }
}

/**
 * @param workDir Pages staging working directory root.
 * @param channel Managed channel: `'stable'` or `'develop'`.
 * @returns The channel's base directory, matching `releasePublish.mjs`'s own resolution.
 */
function resolveChannelBase(workDir, channel) {
  return channel === 'stable' ? workDir : join(workDir, 'branch', 'develop');
}

/**
 * Corrupts one already-published release file's on-disk bytes in place,
 * without touching its retained descriptor — the descriptor's declared
 * SHA-256 no longer matches the file's actual server content. Used only to
 * make release *preparation* (fetch + hash validation) genuinely fail, as
 * opposed to {@link buildAndPublishBrokenManagedRelease}, which publishes an
 * internally consistent release that fails only once running in the
 * browser (a boot-time failure, not an install/preparation-time one).
 * @param workDir Pages staging working directory root.
 * @param channel Managed channel: `'stable'` or `'develop'`.
 * @param filePath One of the published release's own file paths, e.g. `descriptor.files[0].path`.
 */
export function corruptPublishedReleaseFile(workDir, channel, filePath) {
  writeFileSync(
    join(resolveChannelBase(workDir, channel), filePath),
    'throw new Error("corrupted for install-failure test");',
  );
}

/**
 * Appends a harmless trailing comment to an already-published channel's
 * deployed `sw.js`, changing its bytes without altering any application
 * release asset, descriptor, or persisted controller state. Used only to
 * prove a controller-code (worker script) update is independent of the
 * managed application release it controls — never used to build the real
 * production artifact, only this test-only republish step.
 * @param workDir Pages staging working directory root.
 * @param channel Managed channel: `'stable'` or `'develop'`.
 */
export function mutateControllerWorkerBytes(workDir, channel) {
  appendFileSync(
    join(resolveChannelBase(workDir, channel), 'sw.js'),
    `\n// test-only controller-code byte change ${Date.now()}\n`,
  );
}

/**
 * Serves a published retained-release work directory, matching real
 * GitHub Pages static hosting.
 * @param options Server configuration.
 * @param options.workDir The retained-release work directory to serve.
 * @param options.basePath Deployment base path, e.g. `/` or `/branch/develop/`.
 * @param [options.host] Host to bind to.
 * @param [options.port] Port to bind to; `0` picks a free port.
 * @returns Running server handle with its base URL and a `close` function.
 */
export function startManagedArtifactServer({ workDir, basePath, host = '127.0.0.1', port = 0 }) {
  return createArtifactServer({ distDir: workDir, basePath, host, port });
}
