/**
 * Print the branch slug for a given branch name to stdout, for capturing
 * into a GitHub Actions step output.
 *
 * Usage:
 *   node scripts/pages/computeBranchSlug.mjs --branch feature/My-Thing
 */

import { pathToFileURL } from 'node:url';

import { slugifyBranch } from './lib/slug.mjs';

/**
 * @param argv Process arguments (process.argv.slice(2)).
 * @returns The computed branch slug.
 */
export function computeBranchSlug(argv = process.argv.slice(2)) {
  const branchIndex = argv.indexOf('--branch');
  if (branchIndex === -1 || !argv[branchIndex + 1]) {
    throw new Error('Usage: computeBranchSlug.mjs --branch <branch-name>');
  }

  return slugifyBranch(argv[branchIndex + 1]);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(computeBranchSlug());
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
