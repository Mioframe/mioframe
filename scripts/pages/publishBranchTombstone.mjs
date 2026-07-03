/**
 * Publish a tombstone to branch/<slug>/ after that branch has been deleted.
 *
 * Every branch/<slug>/ deployment is PWA-enabled by construction (PR
 * previews are the only PWA-disabled channel, and they are cleaned up via a
 * separate `pull_request: closed` path, not this one) — so an existing
 * `/branch/<slug>/` slot is always eligible for tombstoning. If the slot
 * does not exist (the branch was never deployed), this is a clean no-op.
 *
 * The tombstone replaces the slot's content with a static removal notice
 * plus a service worker that clears only that branch's own cache namespace
 * (see `lib/tombstoneContent.mjs`). Only the target branch slot is touched;
 * stable files, other branch slots, and pr/* directories are not modified.
 *
 * When GITHUB_OUTPUT is set, writes a `tombstoned` output (`true`/`false`).
 *
 * Usage:
 *   node scripts/pages/publishBranchTombstone.mjs --slug develop [--output-dir ./pages-staging]
 *
 * Required env:
 *   GITHUB_TOKEN      - token with contents:write on the target Pages repository
 *   GITHUB_REPOSITORY - OWNER/REPO of the target Pages repository
 */

import { appendFileSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { buildDeploymentMetadata, writeDeploymentMetadataFile } from './lib/deploymentMetadata.mjs';
import { withGhPagesBranch } from './lib/ghPagesBranch.mjs';
import { applyBranchPublish } from './lib/pagesFs.mjs';
import { validateBranchSlug } from './lib/slug.mjs';
import { buildTombstoneFiles } from './lib/tombstoneContent.mjs';

function buildTombstoneDistDir(slug, baseUrl) {
  const distDir = mkdtempSync(join(tmpdir(), 'branch-tombstone-'));

  for (const [name, content] of Object.entries(buildTombstoneFiles(slug, baseUrl))) {
    writeFileSync(join(distDir, name), content, 'utf8');
  }

  writeDeploymentMetadataFile(
    distDir,
    buildDeploymentMetadata({ channel: 'branch', channelId: slug, baseUrl, slug, tombstone: true }),
  );

  return distDir;
}

/**
 * @param argv Process arguments (process.argv.slice(2)).
 * @param env Process environment.
 * @returns `true` if a tombstone was published; `false` if the branch slot did not exist.
 */
export async function publishBranchTombstone(argv = process.argv.slice(2), env = process.env) {
  const slugIndex = argv.indexOf('--slug');
  if (slugIndex === -1 || !argv[slugIndex + 1]) {
    throw new Error('Usage: publishBranchTombstone.mjs --slug <branch-slug>');
  }
  const slug = validateBranchSlug(argv[slugIndex + 1]);
  const baseUrl = `/branch/${slug}/`;

  const outputIndex = argv.indexOf('--output-dir');
  const outputDir = outputIndex !== -1 ? argv[outputIndex + 1] : undefined;

  const { GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_OUTPUT } = env;
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required');
  if (!GITHUB_REPOSITORY) throw new Error('GITHUB_REPOSITORY is required');

  let tombstoned = false;
  let tombstoneDistDir;

  try {
    await withGhPagesBranch({
      token: GITHUB_TOKEN,
      repository: GITHUB_REPOSITORY,
      commitMessage: `chore(pages): tombstone removed branch ${slug}`,
      outputDir,
      fn(workDir) {
        if (!existsSync(join(workDir, 'branch', slug))) {
          console.log(`Branch slot branch/${slug}/ not found, nothing to tombstone.`);
          return;
        }
        tombstoneDistDir = buildTombstoneDistDir(slug, baseUrl);
        applyBranchPublish(workDir, tombstoneDistDir, slug);
        tombstoned = true;
      },
    });
  } finally {
    if (tombstoneDistDir) {
      rmSync(tombstoneDistDir, { recursive: true, force: true });
    }
  }

  if (GITHUB_OUTPUT) {
    appendFileSync(GITHUB_OUTPUT, `tombstoned=${tombstoned}\n`);
  }

  console.log(tombstoned ? `Branch ${slug} tombstoned.` : `No tombstone published for ${slug}.`);

  return tombstoned;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await publishBranchTombstone();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
