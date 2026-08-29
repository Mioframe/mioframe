/**
 * Static production-artifact proof: the deterministic emitted-file/manifest/
 * generated-artifact assertions that belong beside
 * `productionArtifactSmoke.browser-integration.spec.ts`'s Playwright suite.
 * These never load a page or a browser, so they run as
 * plain Node tooling proof against the built `dist/` directory instead of
 * through Playwright. Browser-loaded page, service-worker/runtime, SPA
 * fallback, and managed-controller-capability assertions remain in that
 * Playwright spec as browser-integration proof.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runLocalCommand } from '../lib/runLocalCommand.ts';
import { resolveArtifactBasePath } from './buildArtifact.mjs';

const DIST_DIR = 'dist';
const FORBIDDEN_JS_PATTERNS = [
  'RELEASE_TEST_LEGACY_PWA_FIXTURE',
  'legacyGeneratedWorkboxPwaConfig',
  '__RELEASE_ID__',
  '__RELEASE_SEQUENCE__',
];

function collectJsFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return collectJsFiles(full);
    return entry.isFile() && ['.js', '.mjs'].includes(extname(entry.name)) ? [full] : [];
  });
}

/**
 * Validates the deterministic generated PWA manifest (`dist/manifest.webmanifest`)
 * against the configured release base path, matching the manifest-content
 * meaning also asserted in the browser-integration
 * `productionArtifactSmoke.browser-integration.spec.ts` suite: the manifest
 * is valid JSON, `name` is a string, and `start_url` or `scope` is scoped to
 * the configured base path. Browser
 * proof (page manifest link + fetchability) remains in that Playwright spec.
 * @param distDir - Built artifact directory to validate.
 * @param basePath - Configured release base path (e.g. `/`).
 * @returns Validation errors; empty when the manifest passes.
 */
export function validateProductionArtifactManifest(distDir: string, basePath: string): string[] {
  const manifestPath = join(distDir, 'manifest.webmanifest');

  if (!existsSync(manifestPath)) {
    return [`Generated PWA manifest not found at ${manifestPath}.`];
  }

  let manifest: Record<string, unknown>;

  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    return [
      `${manifestPath} is not valid JSON: ${error instanceof Error ? error.message : String(error)}.`,
    ];
  }

  const errors: string[] = [];

  if (typeof manifest.name !== 'string') {
    errors.push(`${manifestPath} "name" must be a string.`);
  }

  const scopedUrl =
    typeof manifest.start_url === 'string'
      ? manifest.start_url
      : typeof manifest.scope === 'string'
        ? manifest.scope
        : '';

  if (!scopedUrl.includes(basePath)) {
    errors.push(
      `${manifestPath} "start_url"/"scope" ("${scopedUrl}") must be scoped to the configured release base path "${basePath}".`,
    );
  }

  return errors;
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
 *   code's lifecycle;
 * - the generated PWA manifest is scoped to the configured release base
 *   path (see {@link validateProductionArtifactManifest}).
 * @param distDir - Built artifact directory to validate.
 * @param basePath - Configured release base path used for the build.
 * @returns Validation errors; empty when the artifact passes.
 */
export function validateProductionArtifactStatic(
  distDir: string = DIST_DIR,
  basePath: string = resolveArtifactBasePath(),
): string[] {
  const errors: string[] = [];

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

  errors.push(...validateProductionArtifactManifest(distDir, basePath));

  return errors;
}

/** Test-only dependencies for {@link runProductionArtifactStaticProof}. */
export interface RunProductionArtifactStaticProofDeps {
  /** Test seam for child-process execution. */
  runLocalCommand?: typeof runLocalCommand;
}

const defaultDeps: Required<RunProductionArtifactStaticProofDeps> = { runLocalCommand };

/**
 * Runs the static production-artifact proof: builds the production artifact
 * (reusing `RELEASE_ARTIFACT_SKIP_BUILD=1` the same way every other
 * artifact-consuming release check does), then validates it with
 * {@link validateProductionArtifactStatic}.
 * @param deps - Test seam for child-process execution.
 */
export async function runProductionArtifactStaticProof(
  deps: RunProductionArtifactStaticProofDeps = defaultDeps,
): Promise<void> {
  const runCommand = deps.runLocalCommand ?? defaultDeps.runLocalCommand;
  const buildResult = await runCommand({
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await runProductionArtifactStaticProof();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
