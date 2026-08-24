/**
 * Static production-artifact proof: the deterministic emitted-file/manifest/
 * generated-artifact assertions split out of the historical
 * `productionArtifactSmoke.spec.ts` Playwright suite (see
 * docs/testing/verify-redesign-implementation-preflight.md's "Production
 * artifact split"). These never load a page or a browser, so they run as
 * plain Node tooling proof against the built `dist/` directory instead of
 * through Playwright. Browser-loaded page, service-worker/runtime, SPA
 * fallback, and managed-controller-capability assertions remain in that
 * Playwright spec as browser-integration proof.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { runLocalCommand } from '../lib/runLocalCommand.ts';

const DIST_DIR = 'dist';
const FORBIDDEN_JS_PATTERNS = [
  'RELEASE_TEST_LEGACY_PWA_FIXTURE',
  'legacyGeneratedWorkboxPwaConfig',
  '__RELEASE_ID__',
  '__RELEASE_SEQUENCE__',
];

function collectJsFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return collectJsFiles(full);
    return entry.isFile() && ['.js', '.mjs'].includes(extname(entry.name)) ? [full] : [];
  });
}

/**
 * Validates the deterministic emitted-file/manifest/generated-artifact
 * invariants against an already-built production artifact:
 *
 * - no emitted JS chunk embeds the release-test-only legacy migration
 *   fixture or application release identity (managed pinned application
 *   updates feature: the normal production artifact must never embed the
 *   release-test-only `RELEASE_TEST_LEGACY_PWA_FIXTURE` fixture, reachable
 *   only via that release-test-only env var; nor may it embed application
 *   release identity under any name);
 * - the built managed controller worker (`dist/sw.js`, compiled from
 *   `src/sw.ts` via the injectManifest strategy) never calls
 *   `skipWaiting()` or `clients.claim()` — it must never manage its own
 *   code's lifecycle.
 * @param [distDir] Built artifact directory to validate.
 * @returns Validation errors; empty when the artifact passes.
 */
export function validateProductionArtifactStatic(distDir = DIST_DIR) {
  const errors = [];

  if (!existsSync(distDir)) {
    return [`Production artifact directory not found at ${distDir}.`];
  }

  const jsFiles = collectJsFiles(distDir);

  if (jsFiles.length === 0) {
    errors.push(`No .js/.mjs chunks found under ${distDir}.`);
  }

  for (const file of jsFiles) {
    const content = readFileSync(file, 'utf8');
    for (const pattern of FORBIDDEN_JS_PATTERNS) {
      if (content.includes(pattern)) {
        errors.push(`${file} embeds forbidden pattern "${pattern}".`);
      }
    }
  }

  const swPath = join(distDir, 'sw.js');

  if (!existsSync(swPath)) {
    errors.push(`Managed controller worker artifact not found at ${swPath}.`);
  } else {
    const swSource = readFileSync(swPath, 'utf8');

    if (/\bskipWaiting\s*\(/.test(swSource)) {
      errors.push(`${swPath} must never call skipWaiting().`);
    }

    if (/\bclients\s*\.\s*claim\s*\(/.test(swSource)) {
      errors.push(`${swPath} must never call clients.claim().`);
    }
  }

  return errors;
}

const defaultDeps = { runLocalCommand };

/**
 * Runs the static production-artifact proof: builds the production artifact
 * (reusing `RELEASE_ARTIFACT_SKIP_BUILD=1` the same way every other
 * artifact-consuming release check does), then validates it with
 * {@link validateProductionArtifactStatic}.
 * @param [deps] Test seam for child-process execution.
 */
export async function runProductionArtifactStaticProof(deps = defaultDeps) {
  const buildResult = await deps.runLocalCommand({
    command: 'node',
    args: ['scripts/release/buildArtifact.mjs'],
    env: process.env,
  });

  if (buildResult.status !== 0 || buildResult.signal) {
    console.error('[artifact-static] production artifact build failed.');
    process.exitCode = 1;
    return;
  }

  const errors = validateProductionArtifactStatic();

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`[artifact-static] ERROR: ${error}`);
    }

    process.exitCode = 1;
    return;
  }

  console.log('[artifact-static] passed');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await runProductionArtifactStaticProof();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
