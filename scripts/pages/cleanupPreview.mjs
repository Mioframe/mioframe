/**
 * Remove the pr/<PR_NUMBER>/ slot from the gh-pages staging branch after a PR is closed.
 *
 * Stable files, branch/* deployments, and other pr/* directories are not touched.
 * If the slot does not exist, the script exits cleanly without committing.
 *
 * When --output-dir is provided, the final staging content is also copied
 * there so the caller can upload it as a GitHub Pages artifact.
 *
 * When GITHUB_OUTPUT is set, writes a `changed` output (`true`/`false`) so
 * callers can skip Pages publishing steps when the cleanup was a no-op.
 *
 * Usage:
 *   node scripts/pages/cleanupPreview.mjs --pr 42 [--output-dir ./pages-staging]
 *
 * Required env:
 *   GITHUB_TOKEN      - token with contents:write on the target Pages repository
 *   PAGES_REPOSITORY  - OWNER/REPO of the target Pages repository (never GITHUB_REPOSITORY,
 *                        which is the reserved Actions default pointing at the source repository)
 */

import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { withGhPagesBranch } from './lib/ghPagesBranch.mjs';
import { applyPrCleanup } from './lib/pagesFs.mjs';
import { validatePrNumber } from './lib/slug.mjs';

/**
 * @param argv Process arguments (process.argv.slice(2)).
 * @param env Process environment.
 * @returns `true` if the preview slot existed and was removed; `false` if it was already absent.
 */
export async function cleanupPreview(argv = process.argv.slice(2), env = process.env) {
  const prIndex = argv.indexOf('--pr');
  if (prIndex === -1 || !argv[prIndex + 1]) {
    throw new Error('Usage: cleanupPreview.mjs --pr <number>');
  }

  const prNumber = validatePrNumber(argv[prIndex + 1]);

  const outputIndex = argv.indexOf('--output-dir');
  const outputDir = outputIndex !== -1 ? argv[outputIndex + 1] : undefined;

  const { GITHUB_TOKEN, PAGES_REPOSITORY, GITHUB_OUTPUT } = env;
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required');
  if (!PAGES_REPOSITORY) throw new Error('PAGES_REPOSITORY is required');

  let removed = false;

  await withGhPagesBranch({
    token: GITHUB_TOKEN,
    repository: PAGES_REPOSITORY,
    commitMessage: `chore(pages): remove preview for PR #${prNumber}`,
    outputDir,
    fn(workDir) {
      removed = applyPrCleanup(workDir, prNumber);
      if (!removed) {
        console.log(`Preview slot pr/${prNumber}/ not found, nothing to remove.`);
      }
    },
  });

  if (GITHUB_OUTPUT) {
    appendFileSync(GITHUB_OUTPUT, `changed=${removed}\n`);
  }

  console.log(`Preview for PR #${prNumber} cleaned up.`);

  return removed;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await cleanupPreview();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
