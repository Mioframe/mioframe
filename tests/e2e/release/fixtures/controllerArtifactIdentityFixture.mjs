/**
 * Test-only helper for `managedUpdatesControllerArtifactIdentity.spec.ts`:
 * runs one real production `vite build` for the managed stable channel with
 * a given application release identity (`VITE_BUILD_ID`/`VITE_BUILD_DATE`),
 * so the spec can compare `dist/sw.js` bytes across two otherwise
 * equivalent builds that only differ in that identity.
 *
 * Never used by the real application build or deploy pipeline.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runLocalCommand } from '../../../../scripts/lib/runLocalCommand.mjs';

const VITE_BIN = './node_modules/.bin/vite';
const BASE_PATH = '/';

/**
 * Runs one real production `vite build` for the managed stable channel.
 * @param options Build inputs.
 * @param options.viteBuildId `VITE_BUILD_ID` for this build.
 * @param options.viteBuildDate `VITE_BUILD_DATE` for this build.
 * @returns The built dist directory. Caller owns its lifetime.
 * @throws {Error} When the `vite build` step fails.
 */
export async function buildManagedStableArtifact({ viteBuildId, viteBuildDate }) {
  const distDir = mkdtempSync(join(tmpdir(), 'managed-sw-identity-dist-'));
  const result = await runLocalCommand({
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
