import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Validate a PR number string and return it.
 * @param prNumber PR number as a string from CLI or event context.
 * @returns The validated PR number string.
 */
export function validatePrNumber(prNumber) {
  if (!/^\d+$/.test(prNumber) || prNumber === '0') {
    throw new Error(`Invalid PR number: ${prNumber}`);
  }
  return prNumber;
}

/**
 * Apply a stable build to a Pages work directory.
 *
 * Removes all root entries except `.git` and `pr-*` directories, then copies
 * dist. Existing PR preview directories are preserved so stable publishes
 * never evict active previews.
 * @param workDir Path to the Pages staging working directory.
 * @param distDir Path to the built dist directory to publish.
 */
export function applyStablePublish(workDir, distDir) {
  for (const entry of readdirSync(workDir, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    if (entry.isDirectory() && /^pr-\d+$/.test(entry.name)) continue;
    rmSync(join(workDir, entry.name), { recursive: true, force: true });
  }
  cpSync(distDir, workDir, { recursive: true });
}

/**
 * Apply a PR preview build to a Pages work directory.
 *
 * Only the `pr-<prNumber>/` slot is replaced; stable files and other PR
 * preview directories are not touched.
 * @param workDir Path to the Pages staging working directory.
 * @param distDir Path to the built dist directory to publish.
 * @param prNumber PR number string.
 */
export function applyPreviewPublish(workDir, distDir, prNumber) {
  validatePrNumber(prNumber);
  const slotDir = join(workDir, `pr-${prNumber}`);
  rmSync(slotDir, { recursive: true, force: true });
  cpSync(distDir, slotDir, { recursive: true });
}

/**
 * Remove a PR preview slot from a Pages work directory.
 * @param workDir Path to the Pages staging working directory.
 * @param prNumber PR number string.
 * @returns `true` if the slot existed and was removed; `false` if already absent.
 */
export function applyPreviewCleanup(workDir, prNumber) {
  validatePrNumber(prNumber);
  const slotDir = join(workDir, `pr-${prNumber}`);
  if (!existsSync(slotDir)) {
    return false;
  }
  rmSync(slotDir, { recursive: true, force: true });
  return true;
}
