/**
 * Remove branch/<slug>/ tombstones whose retention period has elapsed.
 *
 * Only tombstones (deployment.json with `tombstone: true`) older than the
 * retention period are removed; live branch deployments and fresh
 * tombstones are left untouched. Stable files and pr/* directories are
 * never touched by this script.
 *
 * Usage:
 *   node scripts/pages/cleanupExpiredTombstones.mjs [--retention-days 14] [--output-dir ./pages-staging]
 *
 * Required env:
 *   GITHUB_TOKEN      - token with contents:write on the target Pages repository
 *   GITHUB_REPOSITORY - OWNER/REPO of the target Pages repository
 */

import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import toolingConfig from '../../config/tooling.json' with { type: 'json' };
import { withGhPagesBranch } from './lib/ghPagesBranch.mjs';
import { applyBranchRemoval } from './lib/pagesFs.mjs';
import { findExpiredTombstoneSlugs, validateRetentionDays } from './lib/tombstoneRetention.mjs';

/**
 * @param argv Process arguments (process.argv.slice(2)).
 * @param env Process environment.
 * @returns Branch slugs whose expired tombstone was removed.
 */
export async function cleanupExpiredTombstones(argv = process.argv.slice(2), env = process.env) {
  const retentionIndex = argv.indexOf('--retention-days');
  const retentionDays =
    retentionIndex !== -1 && argv[retentionIndex + 1]
      ? validateRetentionDays(argv[retentionIndex + 1], '--retention-days')
      : validateRetentionDays(
          toolingConfig.pages.tombstoneRetentionDays,
          'config/tooling.json pages.tombstoneRetentionDays',
        );

  const outputIndex = argv.indexOf('--output-dir');
  const outputDir = outputIndex !== -1 ? argv[outputIndex + 1] : undefined;

  const { GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_OUTPUT } = env;
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required');
  if (!GITHUB_REPOSITORY) throw new Error('GITHUB_REPOSITORY is required');

  const removedSlugs = [];

  await withGhPagesBranch({
    token: GITHUB_TOKEN,
    repository: GITHUB_REPOSITORY,
    commitMessage: 'chore(pages): remove expired branch tombstones',
    outputDir,
    fn(workDir) {
      const expiredSlugs = findExpiredTombstoneSlugs({ workDir, retentionDays });
      for (const slug of expiredSlugs) {
        if (applyBranchRemoval(workDir, slug)) {
          removedSlugs.push(slug);
        }
      }
    },
  });

  if (GITHUB_OUTPUT) {
    appendFileSync(GITHUB_OUTPUT, `removed-count=${removedSlugs.length}\n`);
  }

  console.log(
    removedSlugs.length > 0
      ? `Removed ${removedSlugs.length} expired branch tombstone(s): ${removedSlugs.join(', ')}.`
      : 'No expired branch tombstones found.',
  );

  return removedSlugs;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await cleanupExpiredTombstones();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
