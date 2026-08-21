import fs from 'node:fs';
import path from 'node:path';

import { isVisualRelevantPackageJsonChange } from './packageJsonImpact.ts';
import { isNonRuntimeRepositoryMetadataPath } from './repositoryMetadata.ts';

const LEGACY_VISUAL_SPEC_PREFIX = 'tests/e2e/visual/';
const PACKAGE_JSON_PATH = 'package.json';

/**
 * Root directory owner-local `*.visual.spec.ts` specs are discovered under,
 * matching `playwright.visual.config.ts`'s owner-local `testMatch` pattern.
 */
const COLOCATED_VISUAL_SPEC_ROOT_DIR = 'src';
const COLOCATED_VISUAL_SPEC_ROOT_PREFIX = `${COLOCATED_VISUAL_SPEC_ROOT_DIR}/`;
const COLOCATED_VISUAL_SPEC_SUFFIX = '.visual.spec.ts';
const COLOCATED_VISUAL_SNAPSHOT_MARKER = `${COLOCATED_VISUAL_SPEC_SUFFIX}-snapshots/`;

// Broad blast-radius paths: the visual Playwright config, the shared
// container runner, this resolver's own module, the visual lane
// execution/planning entry points, and the production-owned Storybook
// preview style dependency closure. A change here can affect every visual
// spec (legacy or colocated), so it always triggers a full lane run instead
// of relying on owner-local ownership.
const FULL_LANE_EXACT_FILES = new Set([
  'config/tooling.json',
  'playwright.visual.config.ts',
  'pnpm-lock.yaml',
  'scripts/lib/visualRisk.ts',
  'scripts/playwrightContainer.ts',
  'scripts/storybook.mjs',
  'scripts/visual.mjs',
  'scripts/verify.ts',
  'tsconfig.storybook.json',
  'vite.config.ts',
  'src/app/styles/base.css',
  'src/app/styles/fonts.css',
]);

// Safe non-visual proof suffixes that cannot affect Storybook rendering:
// colocated Vitest specs and Storybook browser-behavior specs. Markdown is
// deliberately not excluded by extension here -- confirmed non-runtime
// repository metadata is excluded via isNonRuntimeRepositoryMetadataPath
// instead, so unclassified Markdown keeps normal owner-local/full fallback.
// Checked ahead of owner-local and broad visual-relevant classification so
// these never select or force the visual lane, but after global
// infrastructure/package.json/spec/snapshot resolution, which stays
// independently authoritative.
const SAFE_VISUAL_EXCLUSION_SUFFIXES = ['.test.ts', '.browser.spec.ts'];

// Legacy central visual execution remains full-fallback for its entire
// subtree during S3: specs, snapshots, and shared visual helpers alike.
const FULL_LANE_PREFIXES = ['.storybook/', LEGACY_VISUAL_SPEC_PREFIX];

function uniqSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function isExistingFile(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function findFilesRecursive(dir: string, suffix: string): string[] {
  const matchedFiles: string[] = [];
  const pendingDirs: string[] = [dir];

  while (pendingDirs.length > 0) {
    const currentDir = pendingDirs.pop();

    if (currentDir === undefined) {
      continue;
    }

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.posix.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        pendingDirs.push(entryPath);
      } else if (entry.isFile() && entryPath.endsWith(suffix)) {
        matchedFiles.push(entryPath);
      }
    }
  }

  return uniqSorted(matchedFiles);
}

/**
 * Recursively discover owner-local `*.visual.spec.ts` files under `dir`,
 * matching `playwright.visual.config.ts`'s owner-local `testMatch` pattern.
 * Exported so tests can exercise recursive discovery directly against an OS
 * temporary directory instead of the real `src` tree.
 * @param [dir] Directory to walk, relative to the repository root or
 * absolute. Defaults to the real `src` tree.
 * @returns Sorted unique list of discovered colocated visual spec paths.
 */
export function findColocatedVisualSpecFiles(
  dir: string = COLOCATED_VISUAL_SPEC_ROOT_DIR,
): string[] {
  return findFilesRecursive(dir, COLOCATED_VISUAL_SPEC_SUFFIX);
}

/**
 * Check whether a changed file is an owner-local visual spec, discovered
 * beside its owner under `src/`.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is a colocated `*.visual.spec.ts` file.
 */
export function isColocatedVisualSpecPath(filePath: string): boolean {
  return (
    filePath.startsWith(COLOCATED_VISUAL_SPEC_ROOT_PREFIX) &&
    filePath.endsWith(COLOCATED_VISUAL_SPEC_SUFFIX)
  );
}

/**
 * Check whether a changed file belongs to the legacy central visual location,
 * which remains full-fallback for its entire subtree during S3.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is under `tests/e2e/visual/`.
 */
export function isLegacyVisualPath(filePath: string): boolean {
  return filePath.startsWith(LEGACY_VISUAL_SPEC_PREFIX);
}

/**
 * Check whether a changed file is a broad blast-radius path that must
 * trigger the full visual lane regardless of owner-local ownership.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is visual/Playwright/Storybook infrastructure risk.
 */
export function isFullVisualLanePath(filePath: string): boolean {
  if (FULL_LANE_EXACT_FILES.has(filePath)) {
    return true;
  }

  return FULL_LANE_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

/**
 * Check whether a changed file is a currently visual-relevant shared
 * UI/story path. Unmigrated owners under this definition must preserve safe
 * full visual fallback when they resolve to no colocated visual owner, so
 * S3 does not cause visual checks to silently disappear.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is a broad visual-relevant UI/story path.
 */
export function isBroadVisualRelevantPath(filePath: string): boolean {
  return (
    filePath.startsWith('src/shared/ui/') ||
    filePath.startsWith('src/shared/lib/md/') ||
    /\.stories\.(ts|tsx|js|jsx|mjs|vue)$/.test(filePath)
  );
}

/**
 * Check whether a changed file is a safe non-visual proof/documentation
 * path that cannot affect Storybook rendering, regardless of which owner
 * directory it lives in: a colocated Vitest spec, a Storybook
 * browser-behavior spec, or plain Markdown documentation.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is a safe non-visual exclusion.
 */
export function isSafeVisualExclusionPath(filePath: string): boolean {
  return SAFE_VISUAL_EXCLUSION_SUFFIXES.some((suffix) => filePath.endsWith(suffix));
}

/**
 * The owner root a colocated visual spec's local ownership applies to: the
 * directory containing the spec. A changed path starting with this root
 * (including the spec itself) belongs to the spec's owner.
 * @param specPath Repository-relative colocated visual spec path.
 * @returns The owner root, as a directory path with a trailing slash.
 */
function getColocatedVisualSpecOwnerRoot(specPath: string): string {
  return `${path.posix.dirname(specPath)}/`;
}

/**
 * Resolve every existing colocated visual spec that owns a changed path:
 * every spec whose owner root (its containing directory) is a prefix of
 * `filePath`. A changed path can fall under more than one owner root at
 * once, so every matching spec is returned instead of only the first
 * discovered one, keeping selection independent of filesystem/spec
 * discovery order.
 * @param filePath Repository-relative changed file path.
 * @param colocatedSpecs Existing colocated visual spec paths.
 * @returns Every owning spec path; empty when no owner root matches.
 */
function findColocatedVisualSpecOwners(
  filePath: string,
  colocatedSpecs: readonly string[],
): string[] {
  return colocatedSpecs.filter((specPath) =>
    filePath.startsWith(getColocatedVisualSpecOwnerRoot(specPath)),
  );
}

/**
 * Resolve the colocated visual spec a changed baseline path belongs to,
 * using the documented `<Owner>.visual.spec.ts-snapshots/` convention. This
 * is exact per-spec ownership (unlike the directory-wide owner-root relation
 * used for source changes), so multiple visual specs in one owner directory
 * do not cross-attribute each other's baselines.
 * @param filePath Repository-relative changed file path.
 * @returns The owning spec path, or `null` when `filePath` is not a
 * colocated visual baseline path.
 */
function getColocatedVisualSnapshotSpecCandidate(filePath: string): string | null {
  if (!filePath.startsWith(COLOCATED_VISUAL_SPEC_ROOT_PREFIX)) {
    return null;
  }

  const markerIndex = filePath.indexOf(COLOCATED_VISUAL_SNAPSHOT_MARKER);

  if (markerIndex === -1) {
    return null;
  }

  return filePath.slice(0, markerIndex + COLOCATED_VISUAL_SPEC_SUFFIX.length);
}

/** Resolved visual lane plan, discriminated by `mode`. */
export type VisualPlan =
  | { mode: 'full'; specs: string[]; reasons: string[] }
  | { mode: 'focused'; specs: string[]; reasons: string[] }
  | { mode: 'skip'; specs: string[]; reasons: string[] };

/** Resolution options for {@link resolveVisualPlan}. */
export interface ResolveVisualPlanOptions {
  /**
   * Git ref to compare the current `package.json` against, for the
   * version-only impact refinement. Pass `null` when no reliable base ref is
   * known; that fails closed to visual-relevant.
   */
  packageJsonOldRef?: string | null;
  /**
   * Test-only override for the directly changed spec existence check,
   * bypassing the real filesystem. Production callers should omit this so a
   * deleted or renamed-away spec is detected against the real repository
   * state.
   */
  fileExists?: (filePath: string) => boolean;
  /**
   * Test-only override for the discovered owner-local `*.visual.spec.ts`
   * paths, bypassing filesystem discovery under `src/`. Production callers
   * should omit this so real colocated ownership is resolved against the
   * repository state.
   */
  colocatedSpecFiles?: string[] | null;
}

/**
 * Resolve the visual lane mode for the given changed files, in priority
 * order: full (global infrastructure risk, legacy central visual paths,
 * a removed/renamed directly changed colocated spec, unresolved/orphan
 * colocated baseline ownership, an unmigrated visual-relevant path with no
 * resolvable colocated owner, or a Storybook/Playwright-relevant
 * `package.json` change), focused (changed colocated visual specs,
 * colocated owner-local source relations, and/or colocated baseline
 * relations), or skip (safe non-visual proof/documentation paths, or no
 * relevant changes). Safe non-visual proof/documentation paths never widen
 * to full and never narrow an independently full or focused result.
 * @param changedFiles Sorted unique list of repository-relative changed file paths.
 * @param [options] Resolution options.
 * @returns Plan with `mode`, candidate `specs`, and human-readable `reasons`.
 */
export function resolveVisualPlan(
  changedFiles: readonly string[],
  {
    packageJsonOldRef = null,
    fileExists = isExistingFile,
    colocatedSpecFiles = null,
  }: ResolveVisualPlanOptions = {},
): VisualPlan {
  const fullReasons: string[] = [];

  const infraHit = changedFiles.find(isFullVisualLanePath);

  if (infraHit) {
    fullReasons.push(`visual infrastructure path ${infraHit} -> full visual lane`);
  }

  const isPackageJsonRelevant =
    changedFiles.includes(PACKAGE_JSON_PATH) &&
    isVisualRelevantPackageJsonChange({ oldRef: packageJsonOldRef });

  if (isPackageJsonRelevant) {
    fullReasons.push(`runtime-relevant package.json change -> full visual lane`);
  }

  const missingColocatedSpecHit = changedFiles.find(
    (filePath) => isColocatedVisualSpecPath(filePath) && !fileExists(filePath),
  );

  if (missingColocatedSpecHit) {
    fullReasons.push(
      `removed or renamed colocated visual spec ${missingColocatedSpecHit} -> full visual lane`,
    );
  }

  const existingColocatedSpecs = colocatedSpecFiles ?? findColocatedVisualSpecFiles();
  const focusedSpecs = new Set<string>();
  const focusedReasons: string[] = [];

  for (const filePath of changedFiles) {
    const snapshotSpecCandidate = getColocatedVisualSnapshotSpecCandidate(filePath);

    if (snapshotSpecCandidate !== null) {
      if (existingColocatedSpecs.includes(snapshotSpecCandidate)) {
        focusedSpecs.add(snapshotSpecCandidate);
        focusedReasons.push(
          `colocated visual baseline relation ${filePath} -> ${snapshotSpecCandidate}`,
        );
      } else {
        fullReasons.push(
          `unresolved colocated visual baseline ownership ${filePath} -> full visual lane`,
        );
      }

      continue;
    }

    if (isSafeVisualExclusionPath(filePath)) {
      continue;
    }

    if (isNonRuntimeRepositoryMetadataPath(filePath)) {
      continue;
    }

    const colocatedOwners = findColocatedVisualSpecOwners(filePath, existingColocatedSpecs);

    if (colocatedOwners.length > 0) {
      for (const colocatedOwner of colocatedOwners) {
        focusedSpecs.add(colocatedOwner);
      }

      focusedReasons.push(
        colocatedOwners.length === 1 && colocatedOwners[0] === filePath
          ? `changed colocated visual spec ${filePath} -> ${filePath}`
          : `colocated owner-local relation ${filePath} -> ${colocatedOwners.join(', ')}`,
      );

      continue;
    }

    if (isBroadVisualRelevantPath(filePath)) {
      fullReasons.push(
        `visual-relevant path ${filePath} has no resolvable colocated visual owner -> full visual lane`,
      );
    }
  }

  if (fullReasons.length > 0) {
    return { mode: 'full', specs: [], reasons: uniqSorted(fullReasons) };
  }

  if (focusedSpecs.size > 0) {
    return {
      mode: 'focused',
      specs: uniqSorted([...focusedSpecs]),
      reasons: uniqSorted(focusedReasons),
    };
  }

  return { mode: 'skip', specs: [], reasons: ['empty visual scope'] };
}
