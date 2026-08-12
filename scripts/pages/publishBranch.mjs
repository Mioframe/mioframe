/**
 * Publish a branch build to branch/<slug>/ on the gh-pages staging branch.
 *
 * Only the target branch slot is touched; stable files, other branch
 * slots, and pr/* directories are not modified, aside from refreshing the
 * shared root `404.html` SPA fallback invariant. Used both by the develop
 * push deployment and the manual branch-dispatch deployment.
 *
 * The `develop` slug is the one managed channel among branch deploys (see
 * the managed pinned application updates feature): it publishes a new
 * immutable release into its retained `updates/`/`assets/` archive and
 * requires `--app-version`, `--build-id`, and `--build-date`. Every other
 * branch slug keeps publishing as an ordinary, unmanaged branch slot.
 *
 * When --output-dir is provided, the final staging content is also copied
 * there so the caller can upload it as a GitHub Pages artifact.
 *
 * Usage:
 *   node scripts/pages/publishBranch.mjs --dist ./dist --slug develop \
 *     --app-version 1.2.3 --build-id <sha> --build-date <canonical-utc-committer-iso> \
 *     [--output-dir ./pages-staging]
 *   node scripts/pages/publishBranch.mjs --dist ./dist --slug my-branch [--output-dir ./pages-staging]
 *
 * Required env:
 *   GITHUB_TOKEN      - token with contents:write on the target Pages repository
 *   PAGES_REPOSITORY  - OWNER/REPO of the target Pages repository (never GITHUB_REPOSITORY,
 *                        which is the reserved Actions default pointing at the source repository)
 */

import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { withGhPagesBranch } from './lib/ghPagesBranch.mjs';
import { applyBranchPublish } from './lib/pagesFs.mjs';
import { publishManagedRelease } from './lib/releasePublish.mjs';
import { runManagedPublicationPreflight } from './lib/managedCompatibilityPreflight.mjs';
import { validateManagedArtifact } from './lib/managedArtifactSemantics.mjs';
import { validateBranchSlug } from './lib/slug.mjs';
import { resolveManagedChannel } from '../../src/shared/service/appUpdate/channelContract.ts';

function readFlag(argv, flag) {
  const index = argv.indexOf(flag);
  return index !== -1 ? argv[index + 1] : undefined;
}

/**
 * @param argv Process arguments (process.argv.slice(2)).
 * @param env Process environment.
 */
export async function publishBranch(argv = process.argv.slice(2), env = process.env) {
  const distDir = readFlag(argv, '--dist');
  const rawSlug = readFlag(argv, '--slug');

  if (!distDir) {
    throw new Error('Usage: publishBranch.mjs --dist <dist-dir> --slug <branch-slug>');
  }
  if (!rawSlug) {
    throw new Error('Usage: publishBranch.mjs --dist <dist-dir> --slug <branch-slug>');
  }

  const slug = validateBranchSlug(rawSlug);
  const managedChannel = resolveManagedChannel('branch', slug);
  const isManaged = managedChannel !== undefined;

  const appVersion = readFlag(argv, '--app-version');
  const buildId = readFlag(argv, '--build-id');
  const buildDate = readFlag(argv, '--build-date');
  if (isManaged && (!appVersion || !buildId || !buildDate)) {
    throw new Error(
      'Usage: publishBranch.mjs --dist <dist-dir> --slug develop --app-version <version> --build-id <id> --build-date <canonical-utc-committer-iso>',
    );
  }

  // The managed 'develop' slug delegates retained-tree planning to
  // publishManagedRelease(), which resolves a latest-build no-op before ever
  // requiring dist; only an ordinary unmanaged branch slug needs dist to
  // exist up front.
  if (!isManaged && !existsSync(distDir)) {
    throw new Error(`dist directory does not exist: ${distDir}`);
  }

  const outputDir = readFlag(argv, '--output-dir');

  const { GITHUB_TOKEN, PAGES_REPOSITORY } = env;
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required');
  if (!PAGES_REPOSITORY) throw new Error('PAGES_REPOSITORY is required');

  await withGhPagesBranch({
    token: GITHUB_TOKEN,
    repository: PAGES_REPOSITORY,
    commitMessage: `chore(pages): deploy branch ${slug}`,
    outputDir,
    async fn(workDir) {
      if (isManaged) {
        // Fails closed, before any real publication write, unless the
        // candidate dist itself actually matches the requested managed
        // deployment identity (see
        // scripts/pages/lib/managedArtifactSemantics.mjs) and, for a
        // genuinely new candidate, proves backward data compatibility (see
        // the managed pinned application updates feature's "Data
        // compatibility" invariant and
        // scripts/pages/lib/managedCompatibilityPreflight.mjs). Ordinary
        // unmanaged branch slugs never reach this branch at all.
        validateManagedArtifact({
          distDir,
          channel: managedChannel,
          appVersion,
          buildId,
          buildDate,
        });
        await runManagedPublicationPreflight({
          workDir,
          distDir,
          channel: managedChannel,
          appVersion,
          buildId,
          buildDate,
        });
        publishManagedRelease({
          workDir,
          distDir,
          channel: managedChannel,
          appVersion,
          buildId,
          buildDate,
        });
      } else {
        applyBranchPublish(workDir, distDir, slug);
      }
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
