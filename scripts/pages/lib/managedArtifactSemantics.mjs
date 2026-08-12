/**
 * Small, deterministic artifact-semantic validation for a managed channel's
 * built `dist`, run immediately before any real managed publication write
 * (see the managed release publication safety fix).
 *
 * Cross-checks the built artifact's actual bytes — never only its
 * `deployment.json` metadata claim — against the exact managed deployment
 * identity the publication request itself asked for: `dist/deployment.json`
 * fields, `index.html`'s local resource URLs, `manifest.webmanifest`'s
 * `scope`/`start_url`/`id`, `registerSW.js`'s registered worker URL/scope,
 * and `sw.js`'s presence. A broken build that would otherwise publish with
 * the wrong base path, a stale/mismatched `deployment.json`, or a missing
 * Service Worker is rejected here, before any real Pages write.
 *
 * Deliberately narrow: JSON field checks and local-path prefix checks only,
 * never a general HTML/manifest parser.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { isForeignChannelPath } from '../../../src/shared/service/appUpdate/channelContract.ts';

/**
 * Expected `dist/deployment.json` identity for each managed channel,
 * excluding the per-build fields (`sha`/`appVersion`/`buildDate`) validated
 * against the publication request itself. See `docs/release.md` and the CI
 * `writeDeploymentMetadata.mjs` invocations in `.github/workflows/release.yml`
 * (stable) and `.github/workflows/deploy-branch.yml` (develop).
 */
const MANAGED_DEPLOYMENT_IDENTITY = {
  stable: { channel: 'stable', channelId: 'main', baseUrl: '/' },
  develop: {
    channel: 'branch',
    channelId: 'develop',
    slug: 'develop',
    baseUrl: '/branch/develop/',
  },
};

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

/**
 * Validates `dist/deployment.json` matches the exact managed channel and
 * per-build identity the publication request itself asked for.
 * @param distDir Built `dist` directory for the candidate build.
 * @param channel Managed channel: `'stable'` or `'develop'`.
 * @param appVersion Requested `package.json` version.
 * @param buildId Requested exact source commit SHA.
 * @param buildDate Requested canonical UTC ISO 8601 committer timestamp.
 * @returns The expected `baseUrl` for this channel, for reuse by the artifact-content checks below.
 * @throws {Error} When `deployment.json` is missing, unreadable, or does not match.
 */
function assertDeploymentMetadataMatches(distDir, channel, appVersion, buildId, buildDate) {
  const deploymentJsonPath = join(distDir, 'deployment.json');
  if (!existsSync(deploymentJsonPath)) {
    throw new Error(`Managed artifact validation failed: missing ${deploymentJsonPath}.`);
  }

  let metadata;
  try {
    metadata = readJson(deploymentJsonPath);
  } catch (error) {
    throw new Error('Managed artifact validation failed: deployment.json is not valid JSON.', {
      cause: error,
    });
  }

  const expected = { ...MANAGED_DEPLOYMENT_IDENTITY[channel], sha: buildId, appVersion, buildDate };
  const mismatches = Object.entries(expected).filter(([key, value]) => metadata[key] !== value);

  if (mismatches.length > 0) {
    const detail = mismatches
      .map(([key, value]) => `${key}: expected "${value}", found "${String(metadata[key])}"`)
      .join('; ');
    throw new Error(
      `Managed artifact validation failed: deployment.json does not match the requested "${channel}" publication (${detail}).`,
    );
  }

  return expected.baseUrl;
}

/**
 * Extracts every root-relative `src`/`href` attribute value from raw HTML, without a full HTML parser.
 * @param html Raw `index.html` file contents.
 * @returns Every root-relative attribute value found.
 */
function extractLocalResourceUrls(html) {
  const urls = [];
  const attributePattern = /(?:src|href)="(\/[^"]*)"/g;
  for (const match of html.matchAll(attributePattern)) {
    urls.push(match[1]);
  }
  return urls;
}

/**
 * Fails closed when `url` does not use `base` — including the case where
 * `base` is `/` and `url` actually belongs to a different channel's
 * namespace (`/branch/*`, `/pr/*`), reusing the same foreign-channel check
 * the managed worker/PWA build config already use.
 * @param url The candidate URL/path read from the built artifact.
 * @param base The expected channel base path.
 * @param label Human-readable label for this check, used in the thrown error message.
 */
function assertUsesExpectedBase(url, base, label) {
  if (!url.startsWith(base) || isForeignChannelPath(url, base)) {
    throw new Error(
      `Managed artifact validation failed: ${label} "${url}" does not use the expected base "${base}".`,
    );
  }
}

function assertIndexHtmlUsesExpectedBase(distDir, base) {
  const indexPath = join(distDir, 'index.html');
  if (!existsSync(indexPath)) {
    throw new Error(`Managed artifact validation failed: missing ${indexPath}.`);
  }
  const html = readFileSync(indexPath, 'utf8');
  const urls = extractLocalResourceUrls(html);
  if (urls.length === 0) {
    throw new Error(
      'Managed artifact validation failed: index.html has no local resource URLs to validate.',
    );
  }
  for (const url of urls) {
    assertUsesExpectedBase(url, base, 'index.html resource URL');
  }
}

/**
 * `scope`, `start_url`, and `id` each identify the PWA's own root: a value
 * that is merely a path *under* the expected base (e.g. `/branch/develop/foo/`
 * when the expected base is `/branch/develop/`) is a different, narrower PWA
 * identity, not the managed channel's own — so these three fields require
 * exact equality with `base`, not the prefix check used for individual
 * resource URLs below.
 * @param distDir Built `dist` directory for the candidate build.
 * @param base The expected channel base path.
 */
function assertManifestUsesExpectedBase(distDir, base) {
  const manifestPath = join(distDir, 'manifest.webmanifest');
  if (!existsSync(manifestPath)) {
    throw new Error(`Managed artifact validation failed: missing ${manifestPath}.`);
  }

  let manifest;
  try {
    manifest = readJson(manifestPath);
  } catch (error) {
    throw new Error('Managed artifact validation failed: manifest.webmanifest is not valid JSON.', {
      cause: error,
    });
  }

  for (const field of ['scope', 'start_url', 'id']) {
    const value = manifest[field];
    if (typeof value !== 'string') {
      throw new Error(
        `Managed artifact validation failed: manifest.webmanifest is missing "${field}".`,
      );
    }
    if (value !== base) {
      throw new Error(
        `Managed artifact validation failed: manifest.webmanifest "${field}" "${value}" must exactly equal the expected base "${base}", not merely be a path under it.`,
      );
    }
  }
}

/**
 * Validates `registerSW.js` registers `<base>sw.js` with scope `base`,
 * matching the exact literal content `vite-plugin-pwa` generates for a
 * production build (`navigator.serviceWorker.register('<url>', { scope: '<scope>' })`).
 * @param distDir Built `dist` directory for the candidate build.
 * @param base The expected channel base path.
 */
function assertRegisterSwUsesExpectedBase(distDir, base) {
  const registerSwPath = join(distDir, 'registerSW.js');
  if (!existsSync(registerSwPath)) {
    throw new Error(`Managed artifact validation failed: missing ${registerSwPath}.`);
  }
  const content = readFileSync(registerSwPath, 'utf8');
  const expectedSwUrl = `${base}sw.js`;

  if (!content.includes(`register('${expectedSwUrl}'`)) {
    throw new Error(
      `Managed artifact validation failed: registerSW.js does not register the expected worker URL "${expectedSwUrl}".`,
    );
  }
  if (!content.includes(`scope: '${base}'`)) {
    throw new Error(
      `Managed artifact validation failed: registerSW.js does not register the expected scope "${base}".`,
    );
  }
}

function assertServiceWorkerExists(distDir) {
  if (!existsSync(join(distDir, 'sw.js'))) {
    throw new Error('Managed artifact validation failed: missing dist/sw.js.');
  }
}

/**
 * Validates a managed channel's built `dist` against the exact deployment
 * identity the publication request itself asked for, before any real
 * publication write (see this module's own doc comment).
 * @param options Validation inputs — the same inputs the real publication
 * (`runManagedPublicationPreflight`/`publishManagedRelease`) is called with.
 * @param options.distDir Built `dist` directory for the candidate build.
 * @param options.channel Managed channel: `'stable'` or `'develop'`.
 * @param options.appVersion Requested `package.json` version.
 * @param options.buildId Requested exact source commit SHA.
 * @param options.buildDate Requested canonical UTC ISO 8601 committer timestamp.
 * @throws {Error} When the artifact does not match the requested managed deployment identity.
 */
export function validateManagedArtifact({ distDir, channel, appVersion, buildId, buildDate }) {
  const base = assertDeploymentMetadataMatches(distDir, channel, appVersion, buildId, buildDate);
  assertIndexHtmlUsesExpectedBase(distDir, base);
  assertManifestUsesExpectedBase(distDir, base);
  assertRegisterSwUsesExpectedBase(distDir, base);
  assertServiceWorkerExists(distDir);
}
