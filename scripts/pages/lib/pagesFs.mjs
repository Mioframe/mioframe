import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { validateBranchSlug, validatePrNumber } from './slug.mjs';
import { buildSpaFallbackHtml } from './spaFallback.mjs';

const PRESERVED_STABLE_ROOT_DIRS = new Set(['branch', 'pr']);

/**
 * Additionally preserved top-level directories for a managed channel's root
 * (stable) or slot (develop branch): `assets/` and `updates/` accumulate the
 * channel's retained immutable release archive across deploys and must never
 * be wiped by an ordinary publish. See `docs/release.md` and the managed
 * pinned application updates feature.
 */
const MANAGED_RELEASE_DIRS = new Set(['assets', 'updates']);

/**
 * Ensure the site-level GitHub Pages SPA fallback exists at the repository root.
 * @param workDir Path to the Pages staging working directory.
 */
function ensureRootSpaFallback(workDir) {
  writeFileSync(join(workDir, '404.html'), buildSpaFallbackHtml(), 'utf8');
}

/**
 * Removes every entry in `targetDir` except `.git` and `preservedNames`,
 * then copies `distDir`'s contents into `targetDir`. Directories in
 * `preservedNames` are never removed, so a fresh `dist` build's own copy of
 * that name (if any) is merged into, not replacing, what is already there.
 * @param targetDir Directory to replace the contents of.
 * @param distDir Built dist directory to copy in.
 * @param preservedNames Top-level entry names under `targetDir` to never remove.
 */
function replaceEntriesExcept(targetDir, distDir, preservedNames) {
  for (const entry of readdirSync(targetDir, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    if (entry.isDirectory() && preservedNames.has(entry.name)) continue;
    rmSync(join(targetDir, entry.name), { recursive: true, force: true });
  }
  cpSync(distDir, targetDir, { recursive: true });
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
  replaceEntriesExcept(workDir, distDir, PRESERVED_STABLE_ROOT_DIRS);
  ensureRootSpaFallback(workDir);
}

/**
 * Apply a managed stable build (see the managed pinned application updates
 * feature) to the root of a Pages work directory.
 *
 * Same as {@link applyStablePublish}, but also preserves the root-level
 * `assets/` and `updates/` directories so the channel's retained immutable
 * release archive accumulates across deploys instead of being wiped by
 * every publish.
 * @param workDir Path to the Pages staging working directory.
 * @param distDir Path to the built dist directory to publish.
 */
export function applyManagedStablePublish(workDir, distDir) {
  replaceEntriesExcept(
    workDir,
    distDir,
    new Set([...PRESERVED_STABLE_ROOT_DIRS, ...MANAGED_RELEASE_DIRS]),
  );
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
 * Apply a managed branch build (see the managed pinned application updates
 * feature; used only for the `develop` slot) to its `branch/<slug>/` slot in
 * a Pages work directory.
 *
 * Unlike {@link applyBranchPublish}, the slot's `assets/` and `updates/`
 * directories are preserved rather than wiped, so the channel's retained
 * immutable release archive accumulates across deploys.
 * @param workDir Path to the Pages staging working directory.
 * @param distDir Path to the built dist directory to publish.
 * @param slug Branch slug (see `slugifyBranch`/`validateBranchSlug`).
 */
export function applyManagedBranchPublish(workDir, distDir, slug) {
  validateBranchSlug(slug);
  const slotDir = join(workDir, 'branch', slug);
  mkdirSync(slotDir, { recursive: true });
  replaceEntriesExcept(slotDir, distDir, MANAGED_RELEASE_DIRS);
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
