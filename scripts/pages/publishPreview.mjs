/**
 * Publish a PR preview build to pr-<PR_NUMBER>/ on the gh-pages staging branch.
 *
 * Only the target PR slot is touched; stable files and other pr-* directories
 * are not modified.
 *
 * When --output-dir is provided, the final staging content is also copied
 * there so the caller can upload it as a GitHub Pages artifact.
 *
 * Usage:
 *   node scripts/pages/publishPreview.mjs --dist ./dist --pr 42 [--output-dir ./pages-staging]
 *
 * Required env:
 *   GITHUB_TOKEN      - token with contents:write
 *   GITHUB_REPOSITORY - OWNER/REPO
 */

import { pathToFileURL } from 'node:url';

import { withGhPagesBranch } from './lib/ghPagesBranch.mjs';
import { applyPreviewPublish, validatePrNumber } from './lib/pagesFs.mjs';

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
  const prNumber = validatePrNumber(argv[prIndex + 1]);

  const outputIndex = argv.indexOf('--output-dir');
  const outputDir = outputIndex !== -1 ? argv[outputIndex + 1] : undefined;

  const { GITHUB_TOKEN, GITHUB_REPOSITORY } = env;
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required');
  if (!GITHUB_REPOSITORY) throw new Error('GITHUB_REPOSITORY is required');

  await withGhPagesBranch({
    token: GITHUB_TOKEN,
    repository: GITHUB_REPOSITORY,
    commitMessage: `chore(pages): deploy preview for PR #${prNumber}`,
    outputDir,
    fn(workDir) {
      applyPreviewPublish(workDir, distDir, prNumber);
    },
  });

  console.log(`Preview for PR #${prNumber} published to pr-${prNumber}/.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await publishPreview();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
