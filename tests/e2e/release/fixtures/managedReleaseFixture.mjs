/**
 * Test-only helper for the managed pinned application updates e2e specs:
 * builds a real production artifact for one managed channel, publishes it
 * into a retained release tree via the real publisher
 * (`scripts/pages/lib/releasePublish.mjs`), and serves the result with the
 * same static artifact server used by the other release specs
 * (`scripts/release/artifactServer.mjs`).
 *
 * Never used by the real application build or deploy pipeline — only by
 * `src/shared/service/appUpdate/managedUpdates*.browser-integration.spec.ts`.
 *
 * Running a real `vite build` for every logical "release" these specs need
 * would make the whole `managed-updates` suite prohibitively slow (real
 * production builds, run serially). Instead this module builds exactly
 * three real production artifact *templates* — managed stable, managed
 * develop, and the frozen legacy Workbox stable build — lazily, at most
 * once each per successful suite run, cached on disk under a fixed path
 * (see `TEMPLATE_CACHE_ROOT`) so the cache survives Playwright reloading
 * each spec file into its own fresh module instance. Every logical release
 * is then *materialized* from the appropriate template: cloned into a
 * fresh directory, then only its entry
 * module (renamed to a unique test-only path) and `index.html` reference
 * are patched — never the shared template itself — before publishing
 * through the real, unmodified `publishManagedRelease()`. This still
 * exercises real production Vite/service-worker output, real publication,
 * real content hashing, real archived indexes and watchdog injection, and
 * real immutable-collision rules; only the redundant top-level `vite build`
 * invocation is avoided.
 */

import { randomUUID } from 'node:crypto';
import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join } from 'node:path';

import { runLocalCommand } from '../../../../scripts/lib/runLocalCommand.ts';
import { createArtifactServer } from '../../../../scripts/release/artifactServer.mjs';
import { applyStablePublish } from '../../../../scripts/pages/lib/pagesFs.mjs';
import { publishManagedRelease } from '../../../../scripts/pages/lib/releasePublish.mjs';

const MAIN_MODULE_SCRIPT_PATTERN = /<script type="module"[^>]*\ssrc="([^"]+)"/;

const VITE_BIN = './node_modules/.bin/vite';

/**
 * Runs one real `vite build` into a fresh temporary directory.
 * @param options Build inputs.
 * @param options.channel Release channel: `'stable'` or `'develop'`.
 * @param options.basePath Vite `base` for this build.
 * @param [options.extraEnv] Additional Vite build environment variables.
 * @returns The built dist directory. Caller owns its lifetime.
 * @throws When the `vite build` step fails.
 */
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
 * Fixed (not randomized) root directory template builds are cached under.
 *
 * Playwright reloads each `.spec.ts` test file into its own fresh module
 * instance even within one worker process, so an in-memory cache scoped to
 * this module's own closure would not actually survive across different
 * spec files and would rebuild once per file regardless. A cache keyed by a
 * stable on-disk path survives that reload: once a template has been built
 * and moved into place here, every later caller — in this file's own
 * process or a later one — finds it already present and skips rebuilding.
 * The whole path lives under the OS temp directory, which the ephemeral
 * container this suite runs in discards after the run.
 */
const TEMPLATE_CACHE_ROOT = join(tmpdir(), 'managed-release-fixture-template-cache');

/**
 * Returns the cached template dist directory for `key`, building it via
 * `buildFn` and moving it into the cache the first time it is requested. A
 * template directory is never mutated by any other function in this
 * module — every consumer clones it first.
 * @param key Template cache key.
 * @param buildFn Builds the template into a fresh directory; only invoked when no cached template exists yet.
 * @returns The cached template's dist directory.
 */
async function getOrBuildTemplate(key, buildFn) {
  const cachedDir = join(TEMPLATE_CACHE_ROOT, key);
  if (existsSync(cachedDir)) {
    return cachedDir;
  }

  const builtDir = await buildFn();
  mkdirSync(TEMPLATE_CACHE_ROOT, { recursive: true });
  try {
    renameSync(builtDir, cachedDir);
  } catch (error) {
    // Another (retried) worker already built and moved this template into
    // place first — a benign race, not expected under this suite's
    // single-worker configuration. Discard this attempt's own build and use
    // the one already cached.
    rmSync(builtDir, { recursive: true, force: true });
    if (!existsSync(cachedDir)) throw error;
  }
  return cachedDir;
}

/**
 * The managed stable channel's cached build template (`BASE_URL=/`).
 * @returns The template dist directory.
 */
function getManagedStableTemplate() {
  return getOrBuildTemplate('managed-stable', () =>
    buildViteArtifact({ channel: 'stable', basePath: '/' }),
  );
}

/**
 * The managed develop channel's cached build template (`BASE_URL=/branch/develop/`).
 * @returns The template dist directory.
 */
function getManagedDevelopTemplate() {
  return getOrBuildTemplate('managed-develop', () =>
    buildViteArtifact({ channel: 'develop', basePath: '/branch/develop/' }),
  );
}

/**
 * The frozen legacy (pre-feature, plain `generateSW`) stable build's cached template.
 * @returns The template dist directory.
 */
function getLegacyStableTemplate() {
  return getOrBuildTemplate('legacy-stable', () =>
    buildViteArtifact({
      channel: 'stable',
      basePath: '/',
      extraEnv: { RELEASE_TEST_LEGACY_PWA_FIXTURE: '1' },
    }),
  );
}

/**
 * Resolves the cached managed-channel template for `channel`.
 * @param channel Managed channel: `'stable'` or `'develop'`.
 * @returns The template dist directory.
 */
function getManagedTemplate(channel) {
  return channel === 'stable' ? getManagedStableTemplate() : getManagedDevelopTemplate();
}

/**
 * Locates `distDir`'s main module `<script type="module" src="...">` entry
 * and its channel-root-relative path.
 * @param distDir Built dist directory.
 * @param basePath Vite `base` this build was produced with.
 * @returns The entry's raw `src` attribute value, its relative path, and `index.html`'s full text.
 * @throws When the main module script entry cannot be found.
 */
function locateEntryModule(distDir, basePath) {
  const indexHtmlPath = join(distDir, 'index.html');
  const html = readFileSync(indexHtmlPath, 'utf8');
  const match = MAIN_MODULE_SCRIPT_PATTERN.exec(html);
  if (!match) {
    throw new Error('Could not find the main module script entry');
  }
  const src = match[1];
  const relativePath = src.startsWith(basePath)
    ? src.slice(basePath.length)
    : src.replace(/^\//, '');
  return { indexHtmlPath, html, src, relativePath };
}

/**
 * Materializes one logical release's dist directory from a cached,
 * never-mutated template: clones the template into a fresh directory, then
 * renames the entry module to a unique test-only path with
 * release-identifying (or intentionally broken) content, and rewrites
 * `index.html`'s reference to match.
 *
 * Every materialized release therefore has its own distinct entry file
 * path — never the template's original one — so publishing several
 * logical releases from the same template can never trip
 * `validateNoImmutableCollision` (same path, different content): every
 * other unchanged asset keeps its original path and hash, which
 * `validateNoImmutableCollision` already allows to repeat across releases.
 * @param options Materialization inputs.
 * @param options.templateDir Cached, read-only template dist directory.
 * @param options.basePath Vite `base` the template was built with.
 * @param options.buildId Build identity recorded in the entry marker.
 * @param [options.broken] When `true`, the entry module throws immediately on evaluation instead of carrying a marker.
 * @returns The materialized dist directory. Caller owns removing it.
 */
export function materializeManagedRelease({ templateDir, basePath, buildId, broken = false }) {
  const distDir = mkdtempSync(join(tmpdir(), 'managed-release-materialized-'));
  cpSync(templateDir, distDir, { recursive: true });

  const { indexHtmlPath, html, src, relativePath } = locateEntryModule(distDir, basePath);
  const entryDir = dirname(relativePath);
  const entryExt = extname(relativePath);
  const newRelativePath = [entryDir, `entry-${randomUUID()}${entryExt}`].join('/');
  const newSrc = `${basePath}${newRelativePath}`;

  const oldAbsolutePath = join(distDir, relativePath);
  const newAbsolutePath = join(distDir, ...newRelativePath.split('/'));
  const originalContent = readFileSync(oldAbsolutePath, 'utf8');
  const newContent = broken
    ? 'throw new Error("simulated boot failure");'
    : `${originalContent}\n// managed-release-fixture-marker: ${buildId}\n`;
  writeFileSync(newAbsolutePath, newContent);
  rmSync(oldAbsolutePath);

  // Every occurrence, not just the first: Vite may also reference the entry
  // chunk's filename in a `modulepreload` link, not only its `<script>` tag.
  writeFileSync(indexHtmlPath, html.replaceAll(src, newSrc), 'utf8');

  return distDir;
}

/**
 * Builds (from a cached template, unless `extraEnv` is given) and publishes
 * one production artifact for a managed channel into `workDir`'s retained
 * release tree.
 * @param options Build and publish inputs.
 * @param options.channel Managed channel: `'stable'` or `'develop'`.
 * @param options.basePath Vite `base` for this build, e.g. `/` or `/branch/develop/`.
 * @param options.appVersion `package.json`-style version to record for this release.
 * @param options.buildId Build identity to record for this release.
 * @param options.workDir The retained-release work directory to publish into.
 * @param [options.buildDate] Build timestamp to record for this release; defaults to the current time (this fixture's `buildId` is already a synthetic test-only identity, not a real commit SHA).
 * @param [options.extraEnv] Additional Vite build environment variables; when given, this release falls outside the three cached templates and triggers its own uncached `vite build`.
 * @returns The published `ReleaseDescriptor`.
 * @throws When the `vite build` step fails.
 */
export async function buildAndPublishManagedRelease({
  channel,
  basePath,
  appVersion,
  buildId,
  workDir,
  buildDate = new Date().toISOString(),
  extraEnv = {},
}) {
  if (Object.keys(extraEnv).length > 0) {
    const distDir = await buildViteArtifact({ channel, basePath, extraEnv });
    try {
      return publishManagedRelease({ workDir, distDir, channel, appVersion, buildId, buildDate });
    } finally {
      rmSync(distDir, { recursive: true, force: true });
    }
  }

  const templateDir = await getManagedTemplate(channel);
  const distDir = materializeManagedRelease({ templateDir, basePath, buildId });
  try {
    return publishManagedRelease({ workDir, distDir, channel, appVersion, buildId, buildDate });
  } finally {
    rmSync(distDir, { recursive: true, force: true });
  }
}

/**
 * Builds (from a cached template) and publishes a managed release whose
 * entry module script throws immediately on evaluation. Used only to prove
 * real boot-failure detection and rollback: the archived release's own
 * inline boot watchdog (injected by the real publisher, unmodified by this
 * fixture) is what detects the failure and reports it, not a test-side
 * reproduction of the private protocol.
 * @param options Build and publish inputs; see {@link buildAndPublishManagedRelease}.
 * @returns The published `ReleaseDescriptor`.
 * @throws When the `vite build` step fails.
 */
export async function buildAndPublishBrokenManagedRelease({
  channel,
  basePath,
  appVersion,
  buildId,
  workDir,
  buildDate = new Date().toISOString(),
  extraEnv = {},
}) {
  if (Object.keys(extraEnv).length > 0) {
    const distDir = await buildViteArtifact({ channel, basePath, extraEnv });
    try {
      const { relativePath } = locateEntryModule(distDir, basePath);
      writeFileSync(join(distDir, relativePath), 'throw new Error("simulated boot failure");');
      return publishManagedRelease({ workDir, distDir, channel, appVersion, buildId, buildDate });
    } finally {
      rmSync(distDir, { recursive: true, force: true });
    }
  }

  const templateDir = await getManagedTemplate(channel);
  const distDir = materializeManagedRelease({ templateDir, basePath, buildId, broken: true });
  try {
    return publishManagedRelease({ workDir, distDir, channel, appVersion, buildId, buildDate });
  } finally {
    rmSync(distDir, { recursive: true, force: true });
  }
}

/**
 * Applies the frozen legacy (pre-feature, plain `generateSW`) stable
 * artifact as an ordinary unmanaged stable publish — no retained release
 * tree, no watchdog — matching exactly what a real installed user's
 * browser already has before the managed pinned application updates
 * feature. Only for
 * `src/shared/service/appUpdate/managedUpdatesMigration.browser-integration.spec.ts`.
 *
 * Clones the cached legacy template before applying it: the template
 * itself must remain an exact, unmodified frozen production build across
 * every use.
 * @param options Build inputs.
 * @param options.workDir The Pages work directory to publish into.
 * @returns Nothing; the legacy artifact is applied directly into `workDir`.
 * @throws When the `vite build` step fails.
 */
export async function buildAndApplyLegacyStableDeploy({ workDir }) {
  const templateDir = await getLegacyStableTemplate();
  const distDir = mkdtempSync(join(tmpdir(), 'managed-release-legacy-clone-'));
  try {
    cpSync(templateDir, distDir, { recursive: true });
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
 * Reads one already-published release file's current on-disk bytes, so a
 * test can save them before {@link corruptPublishedReleaseFile} and restore
 * them later via {@link restorePublishedReleaseFile}.
 * @param workDir Pages staging working directory root.
 * @param channel Managed channel: `'stable'` or `'develop'`.
 * @param filePath One of the published release's own file paths.
 * @returns The file's current bytes.
 */
export function readPublishedReleaseFile(workDir, channel, filePath) {
  return readFileSync(join(resolveChannelBase(workDir, channel), filePath));
}

/**
 * Restores one already-published release file's on-disk bytes, undoing
 * {@link corruptPublishedReleaseFile}. Publication now validates every
 * retained release's complete physical bytes before allocating a next
 * release number or writing anything (see `releaseDescriptor.mjs`'s
 * `validateRetainedContent`), so a still-corrupt earlier release would
 * otherwise block any later publish in the same retained tree — a test that
 * intentionally corrupts a file to prove a browser-side install failure, and
 * then needs a further publish to succeed afterward, must restore it first.
 * @param workDir Pages staging working directory root.
 * @param channel Managed channel: `'stable'` or `'develop'`.
 * @param filePath One of the published release's own file paths.
 * @param content The original bytes to restore, from {@link readPublishedReleaseFile}.
 */
export function restorePublishedReleaseFile(workDir, channel, filePath, content) {
  writeFileSync(join(resolveChannelBase(workDir, channel), filePath), content);
}

/**
 * Appends executable, test-only marker code to an already-published
 * channel's deployed `sw.js`, changing its bytes without altering any
 * application release asset, descriptor, or persisted controller state, and
 * exposes a unique revision identity in the worker's own global scope so a
 * test can observe exactly when this byte-mutated worker becomes the active
 * controller. Used only to prove a controller-code (worker script) update is
 * independent of the managed application release it controls — never used
 * to build the real production artifact, only this test-only republish
 * step.
 * @param workDir Pages staging working directory root.
 * @param channel Managed channel: `'stable'` or `'develop'`.
 * @returns The unique revision identity appended into `sw.js`.
 */
export function mutateControllerWorkerBytes(workDir, channel) {
  const revision = `controller-upgrade-${randomUUID()}`;
  appendFileSync(
    join(resolveChannelBase(workDir, channel), 'sw.js'),
    `\nglobalThis.__MIOFRAME_TEST_CONTROLLER_REVISION__ = ${JSON.stringify(revision)};\n`,
  );
  return revision;
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
