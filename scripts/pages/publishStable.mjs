/**
 * Publish a production build to the root of the gh-pages staging branch.
 *
 * Removes all root-level files and directories except pr-* preview slots,
 * then copies the dist contents in. Existing PR preview directories are
 * preserved so stable publishes never evict active previews.
 *
 * When --output-dir is provided, the final staging content is also copied
 * there so the caller can upload it as a GitHub Pages artifact.
 *
 * Usage:
 *   node scripts/pages/publishStable.mjs --dist ./dist [--output-dir ./pages-staging]
 *
 * Required env:
 *   GITHUB_TOKEN      - token with contents:write
 *   GITHUB_REPOSITORY - OWNER/REPO
 */

import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { withGhPagesBranch } from './lib/ghPagesBranch.mjs';
import { applyStablePublish } from './lib/pagesFs.mjs';

/**
 * @param argv Process arguments (process.argv.slice(2)).
 * @param env Process environment.
 */
export async function publishStable(argv = process.argv.slice(2), env = process.env) {
  const distIndex = argv.indexOf('--dist');
  if (distIndex === -1 || !argv[distIndex + 1]) {
    throw new Error('Usage: publishStable.mjs --dist <dist-dir>');
  }
  const distDir = argv[distIndex + 1];
  if (!existsSync(distDir)) {
    throw new Error(`dist directory does not exist: ${distDir}`);
  }

  const outputIndex = argv.indexOf('--output-dir');
  const outputDir = outputIndex !== -1 ? argv[outputIndex + 1] : undefined;

  const { GITHUB_TOKEN, GITHUB_REPOSITORY } = env;
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required');
  if (!GITHUB_REPOSITORY) throw new Error('GITHUB_REPOSITORY is required');

  await withGhPagesBranch({
    token: GITHUB_TOKEN,
    repository: GITHUB_REPOSITORY,
    commitMessage: 'chore(pages): deploy stable build',
    outputDir,
    fn(workDir) {
      applyStablePublish(workDir, distDir);
    },
  });

  console.log('Stable build published.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await publishStable();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
