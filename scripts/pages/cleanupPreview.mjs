/**
 * Remove the pr-<PR_NUMBER>/ slot from the gh-pages branch after a PR is closed.
 *
 * Stable files and other pr-* directories are not touched.
 * If the slot does not exist, the script exits cleanly without committing.
 *
 * Usage:
 *   node scripts/pages/cleanupPreview.mjs --pr 42
 *
 * Required env:
 *   GITHUB_TOKEN      - token with contents:write
 *   GITHUB_REPOSITORY - OWNER/REPO
 */

import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { withGhPagesBranch } from './lib/ghPagesBranch.mjs';

/**
 * @param argv Process arguments (process.argv.slice(2)).
 * @param env Process environment.
 */
export async function cleanupPreview(argv = process.argv.slice(2), env = process.env) {
  const prIndex = argv.indexOf('--pr');
  if (prIndex === -1 || !argv[prIndex + 1]) {
    throw new Error('Usage: cleanupPreview.mjs --pr <number>');
  }

  const prNumber = argv[prIndex + 1];
  if (!/^\d+$/.test(prNumber)) {
    throw new Error(`Invalid PR number: ${prNumber}`);
  }

  const { GITHUB_TOKEN, GITHUB_REPOSITORY } = env;
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required');
  if (!GITHUB_REPOSITORY) throw new Error('GITHUB_REPOSITORY is required');

  const previewSlot = `pr-${prNumber}`;

  await withGhPagesBranch({
    token: GITHUB_TOKEN,
    repository: GITHUB_REPOSITORY,
    commitMessage: `chore(pages): remove preview for PR #${prNumber}`,
    fn(workDir) {
      const slotDir = join(workDir, previewSlot);
      if (!existsSync(slotDir)) {
        console.log(`Preview slot ${previewSlot}/ not found, nothing to remove.`);
        return;
      }
      rmSync(slotDir, { recursive: true, force: true });
    },
  });

  console.log(`Preview for PR #${prNumber} cleaned up.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await cleanupPreview();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
