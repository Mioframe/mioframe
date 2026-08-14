import path from 'node:path';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import toolingConfig from '../../config/tooling.json' with { type: 'json' };
import type { VerifyInvocationScope } from './verifyInvocation.ts';

const storybookStaticDirPrefix = `${toolingConfig.storybook.staticDir}/`;
const IGNORED_PREFIXES = [
  'node_modules/',
  'dist/',
  storybookStaticDirPrefix,
  'coverage/',
  'reports/',
  'playwright-report/',
  'test-results/',
  '.stryker-tmp/',
];
const RENAME_STATUS_PATTERN = /^R\d*$/;

/** A simple (non-rename) changed-path status. */
export type SimpleChangeStatus = 'added' | 'modified' | 'deleted';

/** One changed path from a resolved verify scope, git-diff-derived or explicit. */
export type ChangedPath =
  | { status: SimpleChangeStatus; path: string }
  | { status: 'renamed'; oldPath: string; newPath: string };

/** Scope input a lane resolver consumes: either a git diff or an explicit file list. */
export type ChangedPathsScopeInput =
  | { kind: 'git-diff'; changedPaths: ChangedPath[] }
  | { kind: 'explicit-files'; files: string[] };

/** Resolved changed-path scope, with display/base-ref context for the summary. */
export interface ResolvedChangedPathsScope {
  input: ChangedPathsScopeInput;
  scope: string;
  baseRef: string | null;
  packageJsonOldRef: string | null;
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join(path.posix.sep);
}

function isIgnoredPath(filePath: string): boolean {
  return IGNORED_PREFIXES.some(
    (prefix) => filePath === prefix.slice(0, -1) || filePath.startsWith(prefix),
  );
}

function uniqSortedStrings(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

interface RunGitOptions {
  cwd?: string;
  allowFailure?: boolean;
}

function runGit(
  args: readonly string[],
  { cwd = process.cwd(), allowFailure = false }: RunGitOptions = {},
): SpawnSyncReturns<string> {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.status !== 0 && !allowFailure) {
    const command = ['git', ...args].join(' ');
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    throw new Error(`Command failed: ${command}`);
  }

  return result;
}

function hasHeadParent(cwd: string): boolean {
  return (
    runGit(['rev-parse', '--verify', '--quiet', 'HEAD~1'], { cwd, allowFailure: true }).status === 0
  );
}

function ensureBaseRefExists(baseRef: string, cwd: string): void {
  const result = runGit(['rev-parse', '--verify', baseRef], { cwd, allowFailure: true });

  if (result.status === 0) {
    return;
  }

  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  throw new Error(
    [
      `Base ref does not exist: ${baseRef}`,
      'Fetch the branch and try again:',
      'git fetch origin',
      `pnpm verify --base ${baseRef}`,
    ].join('\n'),
  );
}

function getForkPoint(baseRef: string, cwd: string): string {
  const forkPointResult = runGit(['merge-base', '--fork-point', baseRef, 'HEAD'], {
    cwd,
    allowFailure: true,
  });
  const forkPoint = forkPointResult.status === 0 ? forkPointResult.stdout.trim() : '';

  if (forkPoint) {
    return forkPoint;
  }

  const mergeBaseResult = runGit(['merge-base', baseRef, 'HEAD'], { cwd, allowFailure: true });
  const mergeBase = mergeBaseResult.status === 0 ? mergeBaseResult.stdout.trim() : '';

  if (mergeBase) {
    return mergeBase;
  }

  throw new Error(
    [
      `Cannot determine fork point for base ref: ${baseRef}`,
      'Both commands failed:',
      `git merge-base --fork-point ${baseRef} HEAD`,
      `git merge-base ${baseRef} HEAD`,
    ].join('\n'),
  );
}

function getMergeBase(leftRef: string, rightRef: string, cwd: string): string {
  const mergeBase = runGit(['merge-base', leftRef, rightRef], { cwd }).stdout.trim();

  if (!mergeBase) {
    throw new Error(`Cannot determine merge base of ${leftRef} and ${rightRef}`);
  }

  return mergeBase;
}

function normalizeSimpleStatus(statusToken: string): SimpleChangeStatus {
  switch (statusToken) {
    case 'A':
      return 'added';
    case 'M':
      return 'modified';
    case 'D':
      return 'deleted';
    case 'T':
      return 'modified';
    default:
      throw new Error(`Unsupported or malformed Git status output: ${JSON.stringify(statusToken)}`);
  }
}

/**
 * Parse NUL-delimited `git diff --name-status -z` output into ChangedPath records.
 * @param rawOutput Raw NUL-delimited stdout from `git diff --name-status -z`.
 * @returns Parsed ChangedPath records, not yet ignore-normalized.
 */
export function parseGitDiffStatusOutput(rawOutput: string): ChangedPath[] {
  const tokens = rawOutput.split('\0').filter((token) => token.length > 0);
  const changes: ChangedPath[] = [];
  let index = 0;

  while (index < tokens.length) {
    const statusToken = tokens[index];
    index += 1;

    if (RENAME_STATUS_PATTERN.test(statusToken)) {
      const oldPath = tokens.at(index);
      const newPath = tokens.at(index + 1);

      if (oldPath === undefined || newPath === undefined) {
        throw new Error(`Malformed Git rename status output: ${JSON.stringify(rawOutput)}`);
      }

      changes.push({
        status: 'renamed',
        oldPath: toPosixPath(oldPath),
        newPath: toPosixPath(newPath),
      });
      index += 2;
      continue;
    }

    const status = normalizeSimpleStatus(statusToken);
    const filePath = tokens.at(index);

    if (filePath === undefined) {
      throw new Error(
        `Malformed Git status output: missing path for status ${JSON.stringify(statusToken)}`,
      );
    }

    changes.push({ status, path: toPosixPath(filePath) });
    index += 1;
  }

  return changes;
}

/**
 * Parse NUL-delimited `git ls-files --others -z` output into `added` ChangedPath records.
 * @param rawOutput Raw NUL-delimited stdout from `git ls-files --others --exclude-standard -z`.
 * @returns Untracked files represented as `added` ChangedPath records.
 */
export function parseUntrackedFilesOutput(rawOutput: string): ChangedPath[] {
  return rawOutput
    .split('\0')
    .filter((token) => token.length > 0)
    .map((filePath) => ({ status: 'added' as const, path: toPosixPath(filePath) }));
}

/**
 * Remove ignored paths from a ChangedPath list. A rename with exactly one
 * side ignored is normalized to `added`/`deleted` on its relevant side
 * instead of being dropped or leaking the ignored path.
 * @param changes ChangedPath records to normalize.
 * @returns ChangedPath records with ignored paths removed or normalized.
 */
export function filterIgnoredChangedPaths(changes: readonly ChangedPath[]): ChangedPath[] {
  const result: ChangedPath[] = [];

  for (const change of changes) {
    if (change.status !== 'renamed') {
      if (!isIgnoredPath(change.path)) {
        result.push(change);
      }

      continue;
    }

    const oldIgnored = isIgnoredPath(change.oldPath);
    const newIgnored = isIgnoredPath(change.newPath);

    if (oldIgnored && newIgnored) {
      continue;
    }

    if (!oldIgnored && !newIgnored) {
      result.push(change);
      continue;
    }

    result.push(
      oldIgnored
        ? { status: 'added', path: change.newPath }
        : { status: 'deleted', path: change.oldPath },
    );
  }

  return result;
}

function getChangedPathSortTuple(change: ChangedPath): [string, string, string] {
  return change.status === 'renamed'
    ? [change.oldPath, change.newPath, change.status]
    : [change.path, '', change.status];
}

function compareChangedPaths(left: ChangedPath, right: ChangedPath): number {
  const leftTuple = getChangedPathSortTuple(left);
  const rightTuple = getChangedPathSortTuple(right);

  for (let index = 0; index < leftTuple.length; index += 1) {
    const comparison = leftTuple[index].localeCompare(rightTuple[index]);

    if (comparison !== 0) {
      return comparison;
    }
  }

  return 0;
}

/**
 * Deterministically sort and deduplicate ChangedPath records.
 * @param changes ChangedPath records to normalize.
 * @returns Sorted, deduplicated ChangedPath records.
 */
export function sortAndDedupeChangedPaths(changes: readonly ChangedPath[]): ChangedPath[] {
  const seen = new Set<string>();
  const deduped: ChangedPath[] = [];

  for (const change of changes) {
    const key = JSON.stringify(change);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(change);
  }

  return deduped.sort(compareChangedPaths);
}

function diffNameStatus(refArgs: readonly string[], cwd: string): ChangedPath[] {
  const result = runGit(
    ['diff', '--name-status', '-z', '--find-renames', '--diff-filter=ADMRT', ...refArgs, '--'],
    { cwd },
  );

  return parseGitDiffStatusOutput(result.stdout);
}

function listUntrackedFiles(cwd: string): ChangedPath[] {
  const result = runGit(['ls-files', '--others', '--exclude-standard', '-z'], { cwd });

  return parseUntrackedFilesOutput(result.stdout);
}

function toGitDiffScope(
  changes: readonly ChangedPath[],
  scope: string,
  baseRef: string | null,
  packageJsonOldRef: string | null,
): ResolvedChangedPathsScope {
  return {
    input: {
      kind: 'git-diff',
      changedPaths: sortAndDedupeChangedPaths(filterIgnoredChangedPaths(changes)),
    },
    scope,
    baseRef,
    packageJsonOldRef,
  };
}

/** Inputs for {@link resolveChangedPathsScope}. */
export interface ResolveChangedPathsScopeOptions {
  /** Resolved invocation scope. */
  invocationScope?: VerifyInvocationScope;
  /** Repository working directory; defaults to process.cwd(). */
  cwd?: string;
}

/**
 * Execute changed-path planning from the already resolved verify invocation scope.
 * Base/environment precedence is owned by verifyInvocation.ts and is not repeated here.
 * @param [options] Scope execution inputs.
 * @returns Scope with an explicit git-diff or explicit-files input, a human-readable
 * scope label, resolved base ref, and packageJsonOldRef.
 */
export function resolveChangedPathsScope({
  invocationScope,
  cwd = process.cwd(),
}: ResolveChangedPathsScopeOptions = {}): ResolvedChangedPathsScope {
  if (!invocationScope || typeof invocationScope !== 'object') {
    throw new Error('Resolved verify invocation scope is required.');
  }

  if (invocationScope.kind === 'explicit-files') {
    return {
      input: {
        kind: 'explicit-files',
        files: uniqSortedStrings(invocationScope.files.map(toPosixPath)),
      },
      scope: 'explicit-files',
      baseRef: null,
      packageJsonOldRef: null,
    };
  }

  if (invocationScope.kind === 'github-base') {
    const { baseRef } = invocationScope;
    const mergeBase = getMergeBase('HEAD', baseRef, cwd);
    const changes = diffNameStatus([mergeBase, 'HEAD'], cwd);

    return toGitDiffScope(changes, `github-base ${baseRef}`, baseRef, mergeBase);
  }

  if (invocationScope.kind === 'local-base') {
    const { baseRef } = invocationScope;
    ensureBaseRefExists(baseRef, cwd);
    const forkPoint = getForkPoint(baseRef, cwd);
    const changes = [...diffNameStatus([forkPoint], cwd), ...listUntrackedFiles(cwd)];

    return toGitDiffScope(changes, `local-base ${baseRef}`, baseRef, forkPoint);
  }

  if (invocationScope.kind !== 'local') {
    throw new Error(
      `Unsupported resolved verify invocation scope: ${JSON.stringify(invocationScope)}`,
    );
  }

  const rawChanges = [...diffNameStatus(['HEAD'], cwd), ...listUntrackedFiles(cwd)];

  if (rawChanges.length === 0 && hasHeadParent(cwd)) {
    const fallbackChanges = diffNameStatus(['HEAD~1..HEAD'], cwd);

    return toGitDiffScope(fallbackChanges, 'local-last-commit', null, 'HEAD~1');
  }

  return toGitDiffScope(rawChanges, 'local-changes', null, 'HEAD');
}

/**
 * Project a changed-path scope input into the flat, deduplicated,
 * POSIX-normalized string path list existing command planners consume.
 * Transitional: current planners are not yet status-aware. Renamed entries
 * project both `oldPath` and `newPath`.
 * @param input Scope input: `git-diff` or `explicit-files`.
 * @returns Sorted, deduplicated, POSIX-normalized path list.
 */
export function getChangedFileProjection(input: ChangedPathsScopeInput): string[] {
  if (input.kind === 'explicit-files') {
    return uniqSortedStrings(input.files.map(toPosixPath));
  }

  const paths: string[] = [];

  for (const change of input.changedPaths) {
    if (change.status === 'renamed') {
      paths.push(change.oldPath, change.newPath);
    } else {
      paths.push(change.path);
    }
  }

  return uniqSortedStrings(paths.map(toPosixPath));
}
