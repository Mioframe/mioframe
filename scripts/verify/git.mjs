import { spawnSync } from 'node:child_process';
import { isIgnored, toPosixPath, uniqSorted } from './files.mjs';

export function hasHeadParent() {
  const result = spawnSync('git', ['rev-parse', '--verify', '--quiet', 'HEAD~1'], {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  return result.status === 0;
}

export function runGitCommand(args, options = {}) {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  if (result.status !== 0 && options.allowFailure !== true) {
    const command = ['git', ...args].join(' ');
    process.stdout.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    throw new Error(`Command failed: ${command}`);
  }

  return (result.stdout ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function ensureBaseRefExists(baseRef) {
  const result = spawnSync('git', ['rev-parse', '--verify', baseRef], {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe'],
  });

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

export function getForkPoint(baseRef) {
  const forkPoint = runGitCommand(['merge-base', '--fork-point', baseRef, 'HEAD'], {
    allowFailure: true,
  })[0];

  if (forkPoint) {
    return forkPoint;
  }

  const mergeBase = runGitCommand(['merge-base', baseRef, 'HEAD'], {
    allowFailure: true,
  })[0];

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

export function getChangedFiles({ cliBaseRef }) {
  const githubBaseRef = process.env.GITHUB_BASE_REF;
  const envBaseRef = process.env.VERIFY_BASE;
  let changedFiles = [];
  let scope = 'local-changes';

  if (githubBaseRef) {
    const mergeBase = runGitCommand(['merge-base', 'HEAD', `origin/${githubBaseRef}`], {
      allowFailure: false,
    })[0];

    changedFiles = runGitCommand([
      'diff',
      '--name-only',
      '--diff-filter=ACMR',
      `${mergeBase}...HEAD`,
      '--',
    ]);
    scope = `github-base origin/${githubBaseRef}`;
  } else if (cliBaseRef || envBaseRef) {
    const baseRef = cliBaseRef ?? envBaseRef;
    ensureBaseRefExists(baseRef);
    const forkPoint = getForkPoint(baseRef);

    changedFiles = [
      ...runGitCommand(['diff', '--name-only', '--diff-filter=ACMR', `${forkPoint}...HEAD`, '--']),
      ...runGitCommand(['diff', '--name-only', '--diff-filter=ACMR', 'HEAD', '--']),
      ...runGitCommand(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '--']),
      ...runGitCommand(['ls-files', '--others', '--exclude-standard']),
    ];
    scope = `local-base ${baseRef}`;
  } else {
    changedFiles = [
      ...runGitCommand(['diff', '--name-only', '--diff-filter=ACMR', 'HEAD', '--']),
      ...runGitCommand(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '--']),
      ...runGitCommand(['ls-files', '--others', '--exclude-standard']),
    ];

    if (changedFiles.length === 0 && hasHeadParent()) {
      changedFiles = runGitCommand([
        'diff',
        '--name-only',
        '--diff-filter=ACMR',
        'HEAD~1..HEAD',
        '--',
      ]);
      scope = 'local-last-commit';
    }
  }

  return {
    changedFiles: uniqSorted(
      changedFiles.map(toPosixPath).filter((filePath) => !isIgnored(filePath)),
    ),
    scope,
  };
}
