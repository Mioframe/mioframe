/**
 * Publish a branch build to branch/<slug>/ on the gh-pages staging branch.
 *
 * Only the target branch slot is touched; stable files, other branch
 * slots, and pr/* directories are not modified. Used both by the develop
 * push deployment and the manual branch-dispatch deployment.
 *
 * When --output-dir is provided, the final staging content is also copied
 * there so the caller can upload it as a GitHub Pages artifact.
 *
 * Usage:
 *   node scripts/pages/publishBranch.mjs --dist ./dist --slug develop [--output-dir ./pages-staging]
 *
 * Required env:
 *   GITHUB_TOKEN      - token with contents:write on the target Pages repository
 *   GITHUB_REPOSITORY - OWNER/REPO of the target Pages repository
 */

import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { withGhPagesBranch } from './lib/ghPagesBranch.mjs';
import { applyBranchPublish } from './lib/pagesFs.mjs';
import { validateBranchSlug } from './lib/slug.mjs';

/**
 * @param argv Process arguments (process.argv.slice(2)).
 * @param env Process environment.
 */
export async function publishBranch(argv = process.argv.slice(2), env = process.env) {
  const distIndex = argv.indexOf('--dist');
  const slugIndex = argv.indexOf('--slug');

  if (distIndex === -1 || !argv[distIndex + 1]) {
    throw new Error('Usage: publishBranch.mjs --dist <dist-dir> --slug <branch-slug>');
  }
  if (slugIndex === -1 || !argv[slugIndex + 1]) {
    throw new Error('Usage: publishBranch.mjs --dist <dist-dir> --slug <branch-slug>');
  }

  const distDir = argv[distIndex + 1];
  if (!existsSync(distDir)) {
    throw new Error(`dist directory does not exist: ${distDir}`);
  }
  const slug = validateBranchSlug(argv[slugIndex + 1]);

  const outputIndex = argv.indexOf('--output-dir');
  const outputDir = outputIndex !== -1 ? argv[outputIndex + 1] : undefined;

  const { GITHUB_TOKEN, GITHUB_REPOSITORY } = env;
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required');
  if (!GITHUB_REPOSITORY) throw new Error('GITHUB_REPOSITORY is required');

  await withGhPagesBranch({
    token: GITHUB_TOKEN,
    repository: GITHUB_REPOSITORY,
    commitMessage: `chore(pages): deploy branch ${slug}`,
    outputDir,
    fn(workDir) {
      applyBranchPublish(workDir, distDir, slug);
    },
  });

  console.log(`Branch ${slug} published to branch/${slug}/.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await publishBranch();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
