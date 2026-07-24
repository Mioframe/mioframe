import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { validateBranchSlug, validatePrNumber } from './slug.mjs';
import { buildSpaFallbackHtml } from './spaFallback.mjs';
import { applyManagedStablePublish } from './stableRelease.mjs';

/**
 * Ensure the site-level GitHub Pages SPA fallback exists at the repository root.
 * @param workDir Path to the Pages staging working directory.
 */
function ensureRootSpaFallback(workDir) {
  writeFileSync(join(workDir, '404.html'), buildSpaFallbackHtml(), 'utf8');
}

/**
 * Apply a stable build to the root of a Pages work directory.
 *
 * Removes all root entries except `.git`, `branch/`, and `pr/`, then copies
 * dist into the root. The `branch/` and `pr/` namespaces are preserved so a
 * stable publish never evicts develop, manual branch, or PR preview
 * deployments. Also rewrites the site-level root `404.html` SPA fallback.
 * @param workDir Path to the Pages staging working directory.
 * @param distDir Path to the built dist directory to publish.
 */
export function applyStablePublish(workDir, distDir) {
  applyManagedStablePublish(workDir, distDir);
  ensureRootSpaFallback(workDir);
}

/**
 * Apply a branch build to its `branch/<slug>/` slot in a Pages work
 * directory. Only that slot is replaced; stable files, other branch slots,
 * and PR preview slots are not touched, aside from rewriting the shared
 * root `404.html` SPA fallback invariant.
 * @param workDir Path to the Pages staging working directory.
 * @param distDir Path to the built dist directory to publish.
 * @param slug Branch slug (see `slugifyBranch`/`validateBranchSlug`).
 */
export function applyBranchPublish(workDir, distDir, slug) {
  validateBranchSlug(slug);
  const slotDir = join(workDir, 'branch', slug);
  rmSync(slotDir, { recursive: true, force: true });
  mkdirSync(slotDir, { recursive: true });
  cpSync(distDir, slotDir, { recursive: true });
  ensureRootSpaFallback(workDir);
}

/**
 * Remove a branch's `branch/<slug>/` slot entirely from a Pages work
 * directory. Used by the tombstone retention cleanup once a tombstone has
 * expired; not used for the tombstone publish itself (which replaces the
 * slot's content in place instead of removing it).
 * @param workDir Path to the Pages staging working directory.
 * @param slug Branch slug.
 * @returns `true` if the slot existed and was removed; `false` if already absent.
 */
export function applyBranchRemoval(workDir, slug) {
  validateBranchSlug(slug);
  const slotDir = join(workDir, 'branch', slug);
  if (!existsSync(slotDir)) {
    return false;
  }
  rmSync(slotDir, { recursive: true, force: true });
  return true;
}

/**
 * Apply a PR preview build to its `pr/<number>/` slot in a Pages work
 * directory. Only that slot is replaced; stable files, branch slots, and
 * other PR preview slots are not touched, aside from rewriting the shared
 * root `404.html` SPA fallback invariant.
 * @param workDir Path to the Pages staging working directory.
 * @param distDir Path to the built dist directory to publish.
 * @param prNumber PR number string.
 */
export function applyPrPublish(workDir, distDir, prNumber) {
  validatePrNumber(prNumber);
  const slotDir = join(workDir, 'pr', prNumber);
  rmSync(slotDir, { recursive: true, force: true });
  mkdirSync(slotDir, { recursive: true });
  cpSync(distDir, slotDir, { recursive: true });
  ensureRootSpaFallback(workDir);
}

/**
 * Remove a PR preview's `pr/<number>/` slot from a Pages work directory.
 * @param workDir Path to the Pages staging working directory.
 * @param prNumber PR number string.
 * @returns `true` if the slot existed and was removed; `false` if already absent.
 */
export function applyPrCleanup(workDir, prNumber) {
  validatePrNumber(prNumber);
  const slotDir = join(workDir, 'pr', prNumber);
  if (!existsSync(slotDir)) {
    return false;
  }
  rmSync(slotDir, { recursive: true, force: true });
  return true;
}
