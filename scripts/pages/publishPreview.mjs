/**
 * Publish a PR preview build to pr/<PR_NUMBER>/ on the gh-pages staging branch.
 *
 * Only the target PR slot is touched; stable files, branch/* deployments,
 * and other pr/* directories are not modified, aside from refreshing the
 * shared root `404.html` SPA fallback invariant.
 *
 * When --output-dir is provided, the final staging content is also copied
 * there so the caller can upload it as a GitHub Pages artifact.
 *
 * Usage:
 *   node scripts/pages/publishPreview.mjs --dist ./dist --pr 42 [--output-dir ./pages-staging]
 *
 * Required env:
 *   GITHUB_TOKEN      - token with contents:write on the target Pages repository
 *   PAGES_REPOSITORY  - OWNER/REPO of the target Pages repository (never GITHUB_REPOSITORY,
 *                        which is the reserved Actions default pointing at the source repository)
 */

import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { withGhPagesBranch } from './lib/ghPagesBranch.mjs';
import { applyPrPublish } from './lib/pagesFs.mjs';
import { validatePrNumber } from './lib/slug.mjs';

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
  if (!existsSync(distDir)) {
    throw new Error(`dist directory does not exist: ${distDir}`);
  }
  const prNumber = validatePrNumber(argv[prIndex + 1]);

  const outputIndex = argv.indexOf('--output-dir');
  const outputDir = outputIndex !== -1 ? argv[outputIndex + 1] : undefined;

  const { GITHUB_TOKEN, PAGES_REPOSITORY } = env;
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required');
  if (!PAGES_REPOSITORY) throw new Error('PAGES_REPOSITORY is required');

  await withGhPagesBranch({
    token: GITHUB_TOKEN,
    repository: PAGES_REPOSITORY,
    commitMessage: `chore(pages): deploy preview for PR #${prNumber}`,
    outputDir,
    fn(workDir) {
      applyPrPublish(workDir, distDir, prNumber);
    },
  });

  console.log(`Preview for PR #${prNumber} published to pr/${prNumber}/.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await publishPreview();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
