/**
 * Remove the pr-<PR_NUMBER>/ slot from the gh-pages staging branch after a PR is closed.
 *
 * Stable files and other pr-* directories are not touched.
 * If the slot does not exist, the script exits cleanly without committing.
 *
 * When --output-dir is provided, the final staging content is also copied
 * there so the caller can upload it as a GitHub Pages artifact.
 *
 * Usage:
 *   node scripts/pages/cleanupPreview.mjs --pr 42 [--output-dir ./pages-staging]
 *
 * Required env:
 *   GITHUB_TOKEN      - token with contents:write
 *   GITHUB_REPOSITORY - OWNER/REPO
 */

import { pathToFileURL } from 'node:url';

import { withGhPagesBranch } from './lib/ghPagesBranch.mjs';
import { applyPreviewCleanup, validatePrNumber } from './lib/pagesFs.mjs';

/**
 * @param argv Process arguments (process.argv.slice(2)).
 * @param env Process environment.
 */
export async function cleanupPreview(argv = process.argv.slice(2), env = process.env) {
  const prIndex = argv.indexOf('--pr');
  if (prIndex === -1 || !argv[prIndex + 1]) {
    throw new Error('Usage: cleanupPreview.mjs --pr <number>');
  }

  const prNumber = validatePrNumber(argv[prIndex + 1]);

  const outputIndex = argv.indexOf('--output-dir');
  const outputDir = outputIndex !== -1 ? argv[outputIndex + 1] : undefined;

  const { GITHUB_TOKEN, GITHUB_REPOSITORY } = env;
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required');
  if (!GITHUB_REPOSITORY) throw new Error('GITHUB_REPOSITORY is required');

  await withGhPagesBranch({
    token: GITHUB_TOKEN,
    repository: GITHUB_REPOSITORY,
    commitMessage: `chore(pages): remove preview for PR #${prNumber}`,
    outputDir,
    fn(workDir) {
      const removed = applyPreviewCleanup(workDir, prNumber);
      if (!removed) {
        console.log(`Preview slot pr-${prNumber}/ not found, nothing to remove.`);
      }
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
