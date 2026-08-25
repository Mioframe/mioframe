import fs from 'node:fs';
import path from 'node:path';
import type { ChangedPath, ChangedPathsScopeInput } from './changedPaths.ts';

// Global unit infrastructure: a change here can alter every unit test's
// resolution/execution, so it always widens to full unit instead of relying
// on Vitest's own related/changed analysis (see
// docs/testing/verify-redesign-pass-e-implementation.md's "Git-diff/default
// scopes"). Keep this narrow and infrastructure-owned; it is not a
// source-to-test registry.
const UNIT_GLOBAL_INFRA_PATHS: ReadonlySet<string> = new Set([
  'vitest.config.ts',
  'src/setupVitest.ts',
  'package.json',
  'pnpm-lock.yaml',
  // Configuration modules vitest.config.ts imports directly (or
  // transitively) to define Vue/plugin resolution for every unit test.
  'config/alias.ts',
  'config/plugins/base.ts',
  'config/vueCustomElements.ts',
]);

const SNAPSHOT_DIR_SEGMENT = '/__snapshots__/';
const UNIT_TEST_SUFFIX = '.test.ts';
const SNAPSHOT_SUFFIX = '.snap';

function isExistingFile(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

/**
 * Check whether a changed path is unit-global infrastructure whose effect on
 * unit tests is not a normal module relation (see {@link UNIT_GLOBAL_INFRA_PATHS}).
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is registered unit-global infrastructure.
 */
export function isUnitGlobalInfraPath(filePath: string): boolean {
  return UNIT_GLOBAL_INFRA_PATHS.has(filePath);
}

/**
 * Check whether a changed path is a Vitest-discovered unit test file, per
 * `vitest.config.ts`'s `include` patterns.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path matches a target unit-test location/suffix.
 */
export function isUnitTestPath(filePath: string): boolean {
  if (filePath.startsWith('src/') && filePath.endsWith(UNIT_TEST_SUFFIX)) {
    return true;
  }

  if (filePath.startsWith('config/') && filePath.endsWith(UNIT_TEST_SUFFIX)) {
    return true;
  }

  if (
    filePath.startsWith('scripts/') &&
    (filePath.endsWith(UNIT_TEST_SUFFIX) || filePath.endsWith('.test.mjs'))
  ) {
    return true;
  }

  if (filePath.startsWith('tests/e2e/') && filePath.endsWith('.test.mjs')) {
    return true;
  }

  const baseName = path.posix.basename(filePath);

  if (
    !filePath.includes('/') &&
    baseName.startsWith('playwright.') &&
    baseName.endsWith(UNIT_TEST_SUFFIX)
  ) {
    return true;
  }

  return filePath === 'eslint.config.test.ts';
}

/**
 * Check whether a changed path is unit source/test-support that Vitest's own
 * related/changed module-dependency analysis can reason about: a unit test
 * itself, or an ordinary source/support file under a root Vitest resolves
 * (`src/`, `config/`, `scripts/`, `tests/e2e/` support `.mjs`). Every other
 * private Playwright suffix (`.spec.ts`) is excluded regardless of directory,
 * since `vitest.config.ts` never collects it.
 * @param filePath Repository-relative changed file path.
 * @returns True when Vitest could plausibly relate this path to a unit test.
 */
export function isUnitSourceOrSupportPath(filePath: string): boolean {
  if (filePath.endsWith('.spec.ts') || filePath.endsWith('.spec.mjs')) {
    return false;
  }

  if (isUnitTestPath(filePath)) {
    return true;
  }

  const extension = path.posix.extname(filePath);

  if (filePath.startsWith('src/') && (extension === '.ts' || extension === '.vue')) {
    return true;
  }

  if (
    filePath.startsWith('config/') &&
    (extension === '.ts' || extension === '.mjs' || extension === '.json')
  ) {
    return true;
  }

  if (filePath.startsWith('scripts/') && (extension === '.ts' || extension === '.mjs')) {
    return true;
  }

  if (filePath.startsWith('tests/e2e/') && extension === '.mjs') {
    return true;
  }

  return false;
}

/**
 * Resolve the owning unit test for a standard Vitest snapshot path
 * (`<dir>/__snapshots__/<testFile>.snap`), when deterministically derivable.
 * @param filePath Repository-relative changed file path.
 * @returns The owning `*.test.ts` path, or `null` when `filePath` is not a
 * standard snapshot path.
 */
export function getSnapshotOwningTestPath(filePath: string): string | null {
  if (!filePath.endsWith(SNAPSHOT_SUFFIX)) {
    return null;
  }

  const segmentIndex = filePath.indexOf(SNAPSHOT_DIR_SEGMENT);

  if (segmentIndex === -1) {
    return null;
  }

  const dirPath = filePath.slice(0, segmentIndex);
  const snapshotFileName = filePath.slice(segmentIndex + SNAPSHOT_DIR_SEGMENT.length);
  const testFileName = snapshotFileName.slice(0, -SNAPSHOT_SUFFIX.length);

  if (!testFileName.endsWith(UNIT_TEST_SUFFIX)) {
    return null;
  }

  return `${dirPath}/${testFileName}`;
}

function uniqSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

/** Resolved unit affected plan, discriminated by `mode` (and `strategy` for `focused`). */
export type UnitPlan =
  | { mode: 'skip'; reasons: string[] }
  | { mode: 'full'; reasons: string[] }
  | {
      mode: 'focused';
      strategy: 'changed';
      baseRef: string;
      reasons: string[];
    }
  | {
      mode: 'focused';
      strategy: 'explicit';
      directTests: string[];
      relatedPaths: string[];
      reasons: string[];
    };

/** Resolution options for {@link resolveUnitPlan}. */
export interface ResolveUnitPlanOptions {
  /** Resolved diff base for a git-diff scope's native `--changed` strategy. */
  packageJsonOldRef?: string | null;
  /**
   * Test-only override for existence checks, bypassing the real filesystem.
   * Production callers should omit this so a removed/moved path is detected
   * against the real repository state.
   */
  fileExists?: (filePath: string) => boolean;
}

function resolveGitDiffUnitPlan(
  changedPaths: readonly ChangedPath[],
  packageJsonOldRef: string | null,
): UnitPlan {
  const fullReasons: string[] = [];

  for (const change of changedPaths) {
    if (change.status === 'renamed') {
      if (isUnitGlobalInfraPath(change.oldPath) || isUnitGlobalInfraPath(change.newPath)) {
        fullReasons.push(
          `unit-global infrastructure rename ${change.oldPath} -> ${change.newPath} cannot be safely represented -> full unit`,
        );
        continue;
      }

      if (isUnitSourceOrSupportPath(change.oldPath) || isUnitSourceOrSupportPath(change.newPath)) {
        fullReasons.push(
          `renamed unit-relevant path ${change.oldPath} -> ${change.newPath} cannot be safely represented -> full unit`,
        );
      }

      continue;
    }

    if (isUnitGlobalInfraPath(change.path)) {
      fullReasons.push(`unit-global infrastructure change ${change.path} -> full unit`);
      continue;
    }

    if (change.status === 'deleted' && isUnitSourceOrSupportPath(change.path)) {
      fullReasons.push(
        `removed unit-relevant path ${change.path} cannot be safely represented -> full unit`,
      );
    }
  }

  if (fullReasons.length > 0) {
    return { mode: 'full', reasons: uniqSorted(fullReasons) };
  }

  const hasUnitRelevantChange = changedPaths.some((change) =>
    change.status === 'renamed'
      ? isUnitSourceOrSupportPath(change.newPath)
      : isUnitSourceOrSupportPath(change.path),
  );

  if (!hasUnitRelevantChange) {
    return { mode: 'skip', reasons: ['no unit-relevant changed paths'] };
  }

  if (packageJsonOldRef === null) {
    return {
      mode: 'full',
      reasons: [
        'missing resolved diff base for a unit-relevant git-diff scope -> full unit safety fallback',
      ],
    };
  }

  return {
    mode: 'focused',
    strategy: 'changed',
    baseRef: packageJsonOldRef,
    reasons: [`unit-relevant git-diff scope -> vitest run --changed ${packageJsonOldRef}`],
  };
}

function resolveExplicitFilesUnitPlan(
  files: readonly string[],
  fileExists: (filePath: string) => boolean,
): UnitPlan {
  const fullReasons: string[] = [];
  const directTests = new Set<string>();
  const relatedPaths = new Set<string>();
  const focusedReasons: string[] = [];
  let hasRelevantInput = false;

  for (const filePath of files) {
    if (isUnitGlobalInfraPath(filePath)) {
      hasRelevantInput = true;
      fullReasons.push(`unit-global infrastructure path ${filePath} -> full unit`);
      continue;
    }

    const exists = fileExists(filePath);
    const snapshotOwner = getSnapshotOwningTestPath(filePath);

    if (isUnitTestPath(filePath)) {
      hasRelevantInput = true;

      if (!exists) {
        fullReasons.push(
          `removed or unreadable unit test path ${filePath} cannot be safely represented -> full unit`,
        );
        continue;
      }

      directTests.add(filePath);
      focusedReasons.push(`direct unit test ${filePath}`);
      continue;
    }

    if (snapshotOwner !== null) {
      hasRelevantInput = true;

      if (!exists || !fileExists(snapshotOwner)) {
        fullReasons.push(`snapshot path ${filePath} has no resolvable owning test -> full unit`);
        continue;
      }

      directTests.add(snapshotOwner);
      focusedReasons.push(`snapshot ownership ${filePath} -> ${snapshotOwner}`);
      continue;
    }

    if (isUnitSourceOrSupportPath(filePath)) {
      hasRelevantInput = true;

      if (!exists) {
        fullReasons.push(
          `removed or moved unit-relevant path ${filePath} cannot be safely represented -> full unit`,
        );
        continue;
      }

      relatedPaths.add(filePath);
      focusedReasons.push(`related unit source/support ${filePath}`);
      continue;
    }

    // Deterministically irrelevant path: does not select unit.
  }

  if (fullReasons.length > 0) {
    return { mode: 'full', reasons: uniqSorted(fullReasons) };
  }

  if (!hasRelevantInput) {
    return { mode: 'skip', reasons: ['no unit-relevant explicit paths'] };
  }

  return {
    mode: 'focused',
    strategy: 'explicit',
    directTests: uniqSorted([...directTests]),
    relatedPaths: uniqSorted([...relatedPaths]),
    reasons: uniqSorted(focusedReasons),
  };
}

/**
 * Resolve the unit affected plan for a resolved changed-path scope input.
 * Vitest itself owns the actual dependency/affected relation for `changed`
 * and `explicit`'s `relatedPaths`; this planner only classifies which native
 * Vitest strategy is safe to use (see
 * docs/testing/verify-redesign-pass-e-implementation.md).
 * @param input Resolved changed-path scope input (`git-diff` or
 * `explicit-files`), or `null` when no scope applies (for example full mode).
 * @param [options] Resolution options.
 * @returns The resolved {@link UnitPlan}.
 */
export function resolveUnitPlan(
  input: ChangedPathsScopeInput | null,
  { packageJsonOldRef = null, fileExists = isExistingFile }: ResolveUnitPlanOptions = {},
): UnitPlan {
  if (input === null) {
    return { mode: 'skip', reasons: ['no changed-path scope resolved for this invocation'] };
  }

  if (input.kind === 'git-diff') {
    return resolveGitDiffUnitPlan(input.changedPaths, packageJsonOldRef);
  }

  return resolveExplicitFilesUnitPlan(input.files, fileExists);
}
