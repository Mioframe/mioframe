import path from 'node:path';
import { spawnSync } from 'node:child_process';
import toolingConfig from '../../config/tooling.json' with { type: 'json' };

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

function toPosixPath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}

function isIgnoredPath(filePath) {
  return IGNORED_PREFIXES.some(
    (prefix) => filePath === prefix.slice(0, -1) || filePath.startsWith(prefix),
  );
}

function uniqSortedStrings(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

/**
 * Read the verify base ref from the current process environment.
 * @param [processEnv] Environment object to read from.
 * @returns Base ref value, or `null` when `VERIFY_BASE` is unset.
 */
export function getVerifyBaseRef(processEnv = process.env) {
  return processEnv.VERIFY_BASE ?? null;
}

function runGit(args, { cwd = process.cwd(), allowFailure = false } = {}) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.status !== 0 && !allowFailure) {
    const command = ['git', ...args].join(' ');
    process.stdout.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    throw new Error(`Command failed: ${command}`);
  }

  return result;
}

function hasHeadParent(cwd) {
  return (
    runGit(['rev-parse', '--verify', '--quiet', 'HEAD~1'], { cwd, allowFailure: true }).status === 0
  );
}

function ensureBaseRefExists(baseRef, cwd) {
  const result = runGit(['rev-parse', '--verify', baseRef], { cwd, allowFailure: true });

  if (result.status === 0) {
    return;
  }

  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  throw new Error(
    [
      `Base ref does not exist: ${baseRef}`,
      'Fetch the branch and try again:',
      'git fetch origin',
      `pnpm verify --base ${baseRef}`,
    ].join('\n'),
  );
}

function getForkPoint(baseRef, cwd) {
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

function getMergeBase(leftRef, rightRef, cwd) {
  const mergeBase = runGit(['merge-base', leftRef, rightRef], { cwd }).stdout.trim();

  if (!mergeBase) {
    throw new Error(`Cannot determine merge base of ${leftRef} and ${rightRef}`);
  }

  return mergeBase;
}

function normalizeSimpleStatus(statusToken) {
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
export function parseGitDiffStatusOutput(rawOutput) {
  const tokens = rawOutput.split('\0').filter((token) => token.length > 0);
  const changes = [];
  let index = 0;

  while (index < tokens.length) {
    const statusToken = tokens[index];
    index += 1;

    if (RENAME_STATUS_PATTERN.test(statusToken)) {
      const oldPath = tokens[index];
      const newPath = tokens[index + 1];

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
    const filePath = tokens[index];

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
export function parseUntrackedFilesOutput(rawOutput) {
  return rawOutput
    .split('\0')
    .filter((token) => token.length > 0)
    .map((filePath) => ({ status: 'added', path: toPosixPath(filePath) }));
}

/**
 * Remove ignored paths from a ChangedPath list. A rename with exactly one
 * side ignored is normalized to `added`/`deleted` on its relevant side
 * instead of being dropped or leaking the ignored path.
 * @param changes ChangedPath records to normalize.
 * @returns ChangedPath records with ignored paths removed or normalized.
 */
export function filterIgnoredChangedPaths(changes) {
  const result = [];

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

function getChangedPathSortTuple(change) {
  return change.status === 'renamed'
    ? [change.oldPath, change.newPath, change.status]
    : [change.path, '', change.status];
}

function compareChangedPaths(left, right) {
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
export function sortAndDedupeChangedPaths(changes) {
  const seen = new Set();
  const deduped = [];

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

function diffNameStatus(refArgs, cwd) {
  const result = runGit(
    ['diff', '--name-status', '-z', '--find-renames', '--diff-filter=ADMRT', ...refArgs, '--'],
    { cwd },
  );

  return parseGitDiffStatusOutput(result.stdout ?? '');
}

function listUntrackedFiles(cwd) {
  const result = runGit(['ls-files', '--others', '--exclude-standard', '-z'], { cwd });

  return parseUntrackedFilesOutput(result.stdout ?? '');
}

function toGitDiffScope(changes, scope, baseRef, packageJsonOldRef) {
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

/**
 * Resolve the current verify changed-path scope: which Git comparison to
 * use, and the resulting status-aware changed paths.
 * @param [options] Scope resolution inputs.
 * @param [options.cliFilesOverride] Explicit `--files` override; bypasses
 * Git diff planning entirely when non-null.
 * @param [options.cliBaseRef] Explicit `--base` override.
 * @param [options.processEnv] Process environment read for `VERIFY_BASE` and `GITHUB_BASE_REF`.
 * @param [options.cwd] Repository working directory; defaults to `process.cwd()`, overridable for tests.
 * @returns Scope with an explicit `git-diff` or `explicit-files` input, a
 * human-readable scope label, resolved base ref, and `packageJsonOldRef`.
 */
export function resolveChangedPathsScope({
  cliFilesOverride = null,
  cliBaseRef = null,
  processEnv = process.env,
  cwd = process.cwd(),
} = {}) {
  if (cliFilesOverride !== null) {
    return {
      input: {
        kind: 'explicit-files',
        files: uniqSortedStrings(cliFilesOverride.map(toPosixPath)),
      },
      scope: 'explicit-files',
      baseRef: null,
      packageJsonOldRef: null,
    };
  }

  const githubBaseRef = processEnv.GITHUB_BASE_REF;
  const envBaseRef = getVerifyBaseRef(processEnv);

  if (githubBaseRef) {
    const baseRef = `origin/${githubBaseRef}`;
    const mergeBase = getMergeBase('HEAD', baseRef, cwd);
    const changes = diffNameStatus([mergeBase, 'HEAD'], cwd);

    return toGitDiffScope(changes, `github-base ${baseRef}`, baseRef, mergeBase);
  }

  if (cliBaseRef || envBaseRef) {
    const baseRef = cliBaseRef ?? envBaseRef;
    ensureBaseRefExists(baseRef, cwd);
    const forkPoint = getForkPoint(baseRef, cwd);
    const changes = [...diffNameStatus([forkPoint], cwd), ...listUntrackedFiles(cwd)];

    return toGitDiffScope(changes, `local-base ${baseRef}`, baseRef, forkPoint);
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
export function getChangedFileProjection(input) {
  if (input.kind === 'explicit-files') {
    return uniqSortedStrings(input.files.map(toPosixPath));
  }

  const paths = [];

  for (const change of input.changedPaths) {
    if (change.status === 'renamed') {
      paths.push(change.oldPath, change.newPath);
    } else {
      paths.push(change.path);
    }
  }

  return uniqSortedStrings(paths.map(toPosixPath));
}
