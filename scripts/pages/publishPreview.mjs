/**
 * Publish a PR preview build to pr-<PR_NUMBER>/ on the gh-pages branch.
 *
 * Only the target PR slot is touched; stable files and other pr-* directories
 * are not modified.
 *
 * Usage:
 *   node scripts/pages/publishPreview.mjs --dist ./dist --pr 42
 *
 * Required env:
 *   GITHUB_TOKEN      - token with contents:write
 *   GITHUB_REPOSITORY - OWNER/REPO
 */

import { cpSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { withGhPagesBranch } from './lib/ghPagesBranch.mjs';

/**
 * @param argv Process arguments (process.argv.slice(2)).
 * @param env Process environment.
 */
export async function publishPreview(argv = process.argv.slice(2), env = process.env) {
  const distIndex = argv.indexOf('--dist');
  const prIndex = argv.indexOf('--pr');

  if (distIndex === -1 || !argv[distIndex + 1]) {
    throw new Error('Usage: publishPreview.mjs --dist <dist-dir> --pr <number>');
  }
  if (prIndex === -1 || !argv[prIndex + 1]) {
    throw new Error('Usage: publishPreview.mjs --dist <dist-dir> --pr <number>');
  }

  const distDir = argv[distIndex + 1];
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
    commitMessage: `chore(pages): deploy preview for PR #${prNumber}`,
    fn(workDir) {
      const slotDir = join(workDir, previewSlot);

      // Remove old preview slot if it exists.
      rmSync(slotDir, { recursive: true, force: true });

      // Copy dist into the PR slot.
      cpSync(distDir, slotDir, { recursive: true });
    },
  });

  console.log(`Preview for PR #${prNumber} published to ${previewSlot}/.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await publishPreview();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
