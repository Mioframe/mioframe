/**
 * Test-only helper for `productionArtifactSmoke.spec.ts`'s managed-controller
 * capability proof (Correction 3): builds one real production artifact for
 * an ordinary, non-develop branch channel — which never gets a managed
 * controller worker, only the ordinary generated (`generateSW`) Workbox
 * worker — and serves it with the same static artifact server used by the
 * other release specs (`scripts/release/artifactServer.mjs`).
 *
 * Never used by the real application build or deploy pipeline.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runLocalCommand } from '../../../../scripts/lib/runLocalCommand.ts';
import { createArtifactServer } from '../../../../scripts/release/artifactServer.mjs';

const VITE_BIN = './node_modules/.bin/vite';

/**
 * Builds a real production artifact for an ordinary branch channel (not
 * `stable`, not the managed `develop` channel) and serves it locally.
 * @param options Build inputs.
 * @param options.channelId Non-`develop` branch channel identifier, e.g. `feature-x`.
 * @returns The running server handle. Caller owns its lifetime via `close()`.
 * @throws {Error} When the `vite build` step fails.
 */
export async function buildAndServeOrdinaryBranchArtifact({ channelId }) {
  const distDir = mkdtempSync(join(tmpdir(), 'ordinary-branch-dist-'));
  const basePath = '/';

  const result = await runLocalCommand({
    command: VITE_BIN,
    args: ['build', '--outDir', distDir, '--emptyOutDir'],
    env: {
      ...process.env,
      BASE_URL: basePath,
      VITE_RELEASE_CHANNEL: 'branch',
      VITE_RELEASE_CHANNEL_ID: channelId,
    },
  });
  if (result.status !== 0 || result.signal) {
    rmSync(distDir, { recursive: true, force: true });
    throw new Error(
      `vite build failed for ordinary branch channel "${channelId}" (status ${String(result.status)}, signal ${String(result.signal)})`,
    );
  }

  const server = await createArtifactServer({ distDir, basePath });
  return {
    url: server.url,
    close: async () => {
      await server.close();
      rmSync(distDir, { recursive: true, force: true });
    },
  };
}
