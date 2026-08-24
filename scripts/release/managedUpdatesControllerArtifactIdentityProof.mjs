/**
 * Static build/artifact invariant, extracted from the historical Playwright
 * `managedUpdatesControllerArtifactIdentity.spec.ts` (see
 * docs/testing/verify-redesign-implementation-preflight.md's managed-updates
 * grouping: "controller artifact byte identity is static proof and no
 * longer requires Playwright classification"): the managed controller
 * worker artifact (`dist/sw.js`) must never embed application release
 * identity. Proves this by comparing `dist/sw.js` bytes across two
 * otherwise equivalent managed builds that differ only in
 * VITE_BUILD_ID/VITE_BUILD_DATE — the application's own release identity
 * inputs (see src/shared/config.ts's APP_BUILD_ID/APP_BUILD_DATE). See
 * src/sw.ts's own "must never identify itself as, or embed, a particular
 * application release" invariant.
 *
 * Never invoked by the real application build or deploy pipeline.
 */

import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { runLocalCommand } from '../lib/runLocalCommand.ts';

const VITE_BIN = './node_modules/.bin/vite';
const BASE_PATH = '/';

const defaultDeps = { runLocalCommand };

/**
 * Runs one real production `vite build` for the managed stable channel with
 * a given application release identity.
 * @param options Build inputs.
 * @param options.viteBuildId `VITE_BUILD_ID` for this build.
 * @param options.viteBuildDate `VITE_BUILD_DATE` for this build.
 * @param [deps] Test seam for child-process execution.
 * @returns The built dist directory. Caller owns its lifetime.
 * @throws {Error} When the `vite build` step fails.
 */
export async function buildManagedStableArtifact(
  { viteBuildId, viteBuildDate },
  deps = defaultDeps,
) {
  const distDir = mkdtempSync(join(tmpdir(), 'managed-sw-identity-dist-'));
  const result = await deps.runLocalCommand({
    command: VITE_BIN,
    args: ['build', '--outDir', distDir, '--emptyOutDir'],
    env: {
      ...process.env,
      BASE_URL: BASE_PATH,
      VITE_RELEASE_CHANNEL: 'stable',
      VITE_BUILD_ID: viteBuildId,
      VITE_BUILD_DATE: viteBuildDate,
    },
  });

  if (result.status !== 0 || result.signal) {
    rmSync(distDir, { recursive: true, force: true });
    throw new Error(
      `vite build failed (status ${String(result.status)}, signal ${String(result.signal)})`,
    );
  }

  return distDir;
}

/**
 * Runs the controller artifact byte-identity proof: builds two managed
 * stable-channel artifacts with different application release identity and
 * asserts their `dist/sw.js` bytes are byte-identical. A primary
 * byte-equality assertion, not a check for known strings: any future
 * accidental reintroduction of application-release-specific bytes — under
 * any name — fails this, without needing to predict its shape.
 * @param [deps] Test seam for child-process execution.
 */
export async function runManagedUpdatesControllerArtifactIdentityProof(deps = defaultDeps) {
  const distA = await buildManagedStableArtifact(
    {
      viteBuildId: 'controller-artifact-identity-a',
      viteBuildDate: '2020-01-01T00:00:00.000Z',
    },
    deps,
  );
  const distB = await buildManagedStableArtifact(
    {
      viteBuildId: 'controller-artifact-identity-b',
      viteBuildDate: '2030-06-15T12:00:00.000Z',
    },
    deps,
  );

  try {
    const swBytesA = readFileSync(join(distA, 'sw.js'));
    const swBytesB = readFileSync(join(distB, 'sw.js'));

    if (!swBytesA.equals(swBytesB)) {
      console.error(
        '[managed-updates-static] ERROR: dist/sw.js differs between managed builds with ' +
          'different application release identity (VITE_BUILD_ID/VITE_BUILD_DATE).',
      );
      process.exitCode = 1;
      return;
    }

    console.log('[managed-updates-static] passed');
  } finally {
    rmSync(distA, { recursive: true, force: true });
    rmSync(distB, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await runManagedUpdatesControllerArtifactIdentityProof();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
