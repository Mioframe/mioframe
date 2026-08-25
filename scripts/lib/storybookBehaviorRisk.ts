import fs from 'node:fs';
import path from 'node:path';

import { isPackageJsonRuntimeRelevantChange } from './packageJsonImpact.ts';

const PACKAGE_JSON_PATH = 'package.json';

/**
 * Root directory owner-local `*.behavior.spec.ts` specs are discovered
 * under, matching `playwright.storybook.config.ts`'s owner-local `testMatch`
 * pattern.
 */
const COLOCATED_BEHAVIOR_SPEC_ROOT_DIR = 'src';
const COLOCATED_BEHAVIOR_SPEC_ROOT_PREFIX = `${COLOCATED_BEHAVIOR_SPEC_ROOT_DIR}/`;
const COLOCATED_BEHAVIOR_SPEC_SUFFIX = '.behavior.spec.ts';

// Broad blast-radius paths: the Storybook build/runtime, the behavior
// Playwright config, the shared container runner, this resolver's own
// module, the remaining cross-owner Storybook test helper, and the
// production-owned Storybook preview style dependency closure. A change here
// can affect every behavior spec, so it always triggers a full lane run
// instead of relying on owner-local ownership.
const FULL_LANE_EXACT_FILES = new Set([
  'config/tooling.json',
  'playwright.storybook.config.ts',
  'pnpm-lock.yaml',
  'scripts/lib/storybookBehaviorRisk.ts',
  'scripts/playwrightContainer.ts',
  'scripts/storybook.mjs',
  'scripts/storybookBehavior.mjs',
  'scripts/verify.ts',
  'tsconfig.storybook.json',
  // Cross-owner `openStory()` helper: every owner-local behavior spec
  // imports it, so a change here is not safely attributable to one owner.
  'tests/e2e/storybook/storybook.testUtils.ts',
  // FabContainer/MDMenu behavior specs reuse the visual lane's stabilizing
  // `openStory()` for deterministic geometry/focus assertions (see those
  // specs' own comments); a change here is not safely attributable to one
  // owner either.
  'tests/e2e/visual/storybook.ts',
  // Preview style dependency closure imported by .storybook/preview.ts via
  // src/app/styles/base.css.
  'src/app/styles/base.css',
  'src/app/styles/fonts.css',
  'src/shared/ui/material/foundation/index.css',
  'src/shared/ui/material/foundation/tokens.css',
  'src/shared/ui/material/foundation/theme.css',
  'src/shared/lib/md/index.css',
  'src/shared/lib/md/typography.css',
  'src/shared/lib/md/space.css',
]);

// The Storybook runtime/harness infrastructure directory: also holds a
// colocated behavior spec (routerHarness.behavior.spec.ts) alongside its
// owner, but any change under it can affect Storybook itself, so it stays a
// full-lane prefix rather than owner-local ownership.
const FULL_LANE_PREFIXES = ['.storybook/'];

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
 * Recursively discover owner-local `*.behavior.spec.ts` files under `dir`,
 * matching `playwright.storybook.config.ts`'s owner-local `testMatch`
 * pattern. Exported so tests can exercise recursive discovery directly
 * against an OS temporary directory instead of the real `src` tree.
 * @param [dir] Directory to walk, relative to the repository root or
 * absolute. Defaults to the real `src` tree.
 * @returns Sorted unique list of discovered colocated behavior spec paths.
 */
export function findColocatedBehaviorSpecFiles(
  dir: string = COLOCATED_BEHAVIOR_SPEC_ROOT_DIR,
): string[] {
  return findFilesRecursive(dir, COLOCATED_BEHAVIOR_SPEC_SUFFIX);
}

/**
 * Check whether a changed file is an owner-local Storybook behavior spec,
 * discovered beside its owner under `src/`.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is a colocated `*.behavior.spec.ts` file.
 */
export function isColocatedBehaviorSpecPath(filePath: string): boolean {
  return (
    filePath.startsWith(COLOCATED_BEHAVIOR_SPEC_ROOT_PREFIX) &&
    filePath.endsWith(COLOCATED_BEHAVIOR_SPEC_SUFFIX)
  );
}

/**
 * Check whether a changed file is a broad blast-radius path that must
 * trigger the full Storybook behavior lane regardless of owner-local
 * ownership.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is Storybook/Playwright infrastructure risk.
 */
export function isFullStorybookBehaviorLanePath(filePath: string): boolean {
  if (FULL_LANE_EXACT_FILES.has(filePath)) {
    return true;
  }

  return FULL_LANE_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

/** Resolved Storybook behavior lane plan, discriminated by `mode`. */
export type StorybookBehaviorPlan =
  | { mode: 'full'; specs: string[]; reasons: string[] }
  | { mode: 'focused'; specs: string[]; reasons: string[] }
  | { mode: 'none'; specs: string[]; reasons: string[] };

/** The owner root a colocated behavior spec's local ownership applies to: the
 * directory containing the spec. A changed path starting with this root
 * (including the spec itself) belongs to the spec's owner.
 * @param specPath Repository-relative colocated behavior spec path.
 * @returns The owner root, as a directory path with a trailing slash.
 */
function getColocatedBehaviorSpecOwnerRoot(specPath: string): string {
  return `${path.posix.dirname(specPath)}/`;
}

/**
 * Resolve every existing colocated behavior spec that owns a changed path:
 * every spec whose owner root (its containing directory) is a prefix of
 * `filePath`. This also matches a spec's own path, since a directory is a
 * prefix of the files inside it. A changed path can fall under more than one
 * owner root at once — an owner directory can hold multiple behavior specs,
 * and a nested owner directory's specs can also sit under a parent owner
 * directory's root — so every matching spec is returned instead of only the
 * first discovered one, keeping selection independent of filesystem/spec
 * discovery order.
 * @param filePath Repository-relative changed file path.
 * @param colocatedSpecs Existing colocated behavior spec paths.
 * @returns Every owning spec path; empty when no owner root matches.
 */
function findColocatedBehaviorSpecOwners(
  filePath: string,
  colocatedSpecs: readonly string[],
): string[] {
  return colocatedSpecs.filter((specPath) =>
    filePath.startsWith(getColocatedBehaviorSpecOwnerRoot(specPath)),
  );
}

/** Resolution options for {@link resolveStorybookBehaviorPlan}. */
export interface ResolveStorybookBehaviorPlanOptions {
  /**
   * Git ref to compare the current `package.json` against, for the
   * version-only impact refinement. Pass `null` when no reliable base ref is
   * known; that fails closed to runtime-relevant (full lane).
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
   * Test-only override for the discovered owner-local `*.behavior.spec.ts`
   * paths, bypassing filesystem discovery under `src/`. Production callers
   * should omit this so real colocated ownership is resolved against the
   * repository state.
   */
  colocatedSpecFiles?: string[] | null;
}

/**
 * Resolve the Storybook behavior lane mode for the given changed files, in
 * priority order: full (global infrastructure risk, a removed or renamed
 * directly changed colocated spec, or a Storybook/Playwright-relevant
 * `package.json` change), focused (changed colocated behavior specs and/or
 * colocated owner-local relations), or none (no relevant changes).
 * @param changedFiles Sorted unique list of repository-relative changed file paths.
 * @param [options] Resolution options.
 * @returns Plan with `mode`, candidate `specs`, and human-readable `reasons`.
 */
export function resolveStorybookBehaviorPlan(
  changedFiles: readonly string[],
  {
    packageJsonOldRef = null,
    fileExists = isExistingFile,
    colocatedSpecFiles = null,
  }: ResolveStorybookBehaviorPlanOptions = {},
): StorybookBehaviorPlan {
  const fullLaneHit = changedFiles.find(isFullStorybookBehaviorLanePath);
  const missingColocatedSpecHit = changedFiles.find(
    (filePath) => isColocatedBehaviorSpecPath(filePath) && !fileExists(filePath),
  );
  const isPackageJsonRelevant =
    changedFiles.includes(PACKAGE_JSON_PATH) &&
    isPackageJsonRuntimeRelevantChange({ oldRef: packageJsonOldRef });
  const fullReasons: string[] = [];

  if (fullLaneHit) {
    fullReasons.push(
      `Storybook/Playwright infrastructure path ${fullLaneHit} -> full behavior lane`,
    );
  }

  if (isPackageJsonRelevant) {
    fullReasons.push(`runtime-relevant package.json change -> full behavior lane`);
  }

  if (missingColocatedSpecHit) {
    fullReasons.push(
      `removed or renamed colocated behavior spec ${missingColocatedSpecHit} -> full behavior lane`,
    );
  }

  if (fullReasons.length > 0) {
    return { mode: 'full', specs: [], reasons: fullReasons };
  }

  const existingColocatedSpecs = colocatedSpecFiles ?? findColocatedBehaviorSpecFiles();
  const focusedSpecs = new Set<string>();
  const focusedReasons: string[] = [];

  for (const filePath of changedFiles) {
    const colocatedOwners = findColocatedBehaviorSpecOwners(filePath, existingColocatedSpecs);

    for (const colocatedOwner of colocatedOwners) {
      focusedSpecs.add(colocatedOwner);
      focusedReasons.push(
        filePath === colocatedOwner
          ? `changed colocated behavior spec ${filePath} -> ${filePath}`
          : `colocated owner-local relation ${filePath} -> ${colocatedOwner}`,
      );
    }
  }

  if (focusedSpecs.size > 0) {
    return {
      mode: 'focused',
      specs: uniqSorted([...focusedSpecs]),
      reasons: uniqSorted(focusedReasons),
    };
  }

  return { mode: 'none', specs: [], reasons: ['empty storybook behavior scope'] };
}
