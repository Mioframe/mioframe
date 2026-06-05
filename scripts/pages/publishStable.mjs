/**
 * Publish a production build to the root of the gh-pages branch.
 *
 * Removes all root-level files and directories except pr-* preview slots,
 * then copies the dist contents in. Existing PR preview directories are
 * preserved so stable publishes never evict active previews.
 *
 * Usage:
 *   node scripts/pages/publishStable.mjs --dist ./dist
 *
 * Required env:
 *   GITHUB_TOKEN      - token with contents:write
 *   GITHUB_REPOSITORY - OWNER/REPO
 */

import { cpSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { withGhPagesBranch } from './lib/ghPagesBranch.mjs';

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

  const { GITHUB_TOKEN, GITHUB_REPOSITORY } = env;
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required');
  if (!GITHUB_REPOSITORY) throw new Error('GITHUB_REPOSITORY is required');

  await withGhPagesBranch({
    token: GITHUB_TOKEN,
    repository: GITHUB_REPOSITORY,
    commitMessage: 'chore(pages): deploy stable build',
    fn(workDir) {
      // Remove everything at the root except pr-* directories.
      for (const entry of readdirSync(workDir, { withFileTypes: true })) {
        if (entry.name === '.git') continue;
        if (entry.isDirectory() && entry.name.startsWith('pr-')) continue;
        rmSync(join(workDir, entry.name), { recursive: true, force: true });
      }

      // Copy dist contents to the root.
      cpSync(distDir, workDir, { recursive: true });
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
