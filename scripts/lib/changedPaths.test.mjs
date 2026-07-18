import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

import {
  filterIgnoredChangedPaths,
  getChangedFileProjection,
  getVerifyBaseRef,
  parseGitDiffStatusOutput,
  parseUntrackedFilesOutput,
  resolveChangedPathsScope,
  sortAndDedupeChangedPaths,
} from './changedPaths.mjs';

const createdDirs = [];

function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });

  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);
  }

  return result.stdout;
}

function createTempRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'changed-paths-test-'));
  createdDirs.push(dir);
  git(dir, ['init', '-q', '--initial-branch=main']);
  git(dir, ['config', 'user.email', 'test@example.com']);
  git(dir, ['config', 'user.name', 'Test']);
  return dir;
}

function writeFile(dir, relativePath, content = 'content\n') {
  const fullPath = path.join(dir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}

function commitAll(dir, message = 'commit') {
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-qm', message]);
  return git(dir, ['rev-parse', 'HEAD']).trim();
}

afterEach(() => {
  for (const dir of createdDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('parseGitDiffStatusOutput', () => {
  it('parses added, modified, deleted, and type-change records', () => {
    const raw =
      ['A', 'added.txt', 'M', 'modified.txt', 'D', 'deleted.txt', 'T', 'retyped.txt'].join('\0') +
      '\0';

    expect(parseGitDiffStatusOutput(raw)).toEqual([
      { status: 'added', path: 'added.txt' },
      { status: 'modified', path: 'modified.txt' },
      { status: 'deleted', path: 'deleted.txt' },
      { status: 'modified', path: 'retyped.txt' },
    ]);
  });

  it('parses a rename record with both old and new paths', () => {
    const raw = ['R100', 'old.txt', 'new.txt'].join('\0') + '\0';

    expect(parseGitDiffStatusOutput(raw)).toEqual([
      { status: 'renamed', oldPath: 'old.txt', newPath: 'new.txt' },
    ]);
  });

  it('handles paths containing spaces from NUL-delimited output', () => {
    const raw = ['A', 'a file.txt', 'R100', 'old name.txt', 'new name.txt'].join('\0') + '\0';

    expect(parseGitDiffStatusOutput(raw)).toEqual([
      { status: 'added', path: 'a file.txt' },
      { status: 'renamed', oldPath: 'old name.txt', newPath: 'new name.txt' },
    ]);
  });

  it('fails clearly for an unsupported status token', () => {
    const raw = ['X', 'somefile.txt'].join('\0') + '\0';

    expect(() => parseGitDiffStatusOutput(raw)).toThrow(/Unsupported or malformed Git status/);
  });

  it('fails clearly when a normal record is missing its path', () => {
    expect(() => parseGitDiffStatusOutput('A\0')).toThrow(/Malformed Git status output/);
  });

  it('fails clearly when a rename record is missing its new path', () => {
    const raw = ['R100', 'old.txt'].join('\0') + '\0';

    expect(() => parseGitDiffStatusOutput(raw)).toThrow(/Malformed Git rename status output/);
  });
});

describe('parseUntrackedFilesOutput', () => {
  it('represents untracked paths, including ones with spaces, as added', () => {
    const raw = ['untracked with spaces.txt', 'second.txt'].join('\0') + '\0';

    expect(parseUntrackedFilesOutput(raw)).toEqual([
      { status: 'added', path: 'untracked with spaces.txt' },
      { status: 'added', path: 'second.txt' },
    ]);
  });

  it('returns an empty list for empty output', () => {
    expect(parseUntrackedFilesOutput('')).toEqual([]);
  });
});

describe('filterIgnoredChangedPaths', () => {
  it('omits an ignored added/modified/deleted record', () => {
    expect(
      filterIgnoredChangedPaths([
        { status: 'modified', path: 'dist/app.js' },
        { status: 'modified', path: 'src/app.ts' },
      ]),
    ).toEqual([{ status: 'modified', path: 'src/app.ts' }]);
  });

  it('omits a rename where both sides are ignored', () => {
    expect(
      filterIgnoredChangedPaths([
        { status: 'renamed', oldPath: 'dist/a.js', newPath: 'dist/b.js' },
      ]),
    ).toEqual([]);
  });

  it('preserves a rename where neither side is ignored', () => {
    const change = { status: 'renamed', oldPath: 'src/a.ts', newPath: 'src/b.ts' };

    expect(filterIgnoredChangedPaths([change])).toEqual([change]);
  });

  it('normalizes an ignored-old to relevant-new rename to added', () => {
    expect(
      filterIgnoredChangedPaths([
        { status: 'renamed', oldPath: 'dist/old.js', newPath: 'src/new.ts' },
      ]),
    ).toEqual([{ status: 'added', path: 'src/new.ts' }]);
  });

  it('normalizes a relevant-old to ignored-new rename to deleted', () => {
    expect(
      filterIgnoredChangedPaths([
        { status: 'renamed', oldPath: 'src/old.ts', newPath: 'dist/new.js' },
      ]),
    ).toEqual([{ status: 'deleted', path: 'src/old.ts' }]);
  });
});

describe('sortAndDedupeChangedPaths', () => {
  it('sorts and deduplicates changed paths deterministically', () => {
    const changes = [
      { status: 'modified', path: 'b.ts' },
      { status: 'added', path: 'a.ts' },
      { status: 'modified', path: 'b.ts' },
      { status: 'deleted', path: 'c.ts' },
    ];

    expect(sortAndDedupeChangedPaths(changes)).toEqual([
      { status: 'added', path: 'a.ts' },
      { status: 'modified', path: 'b.ts' },
      { status: 'deleted', path: 'c.ts' },
    ]);
  });

  it('does not collapse a rename and an unrelated add/delete on the same path', () => {
    const changes = [
      { status: 'renamed', oldPath: 'a.ts', newPath: 'b.ts' },
      { status: 'added', path: 'a.ts' },
    ];

    expect(sortAndDedupeChangedPaths(changes)).toHaveLength(2);
  });
});

describe('getChangedFileProjection', () => {
  it('projects explicit-files input as-is, sorted and deduplicated', () => {
    expect(
      getChangedFileProjection({ kind: 'explicit-files', files: ['b.ts', 'a.ts', 'a.ts'] }),
    ).toEqual(['a.ts', 'b.ts']);
  });

  it('projects added/modified/deleted records to their single path', () => {
    const input = {
      kind: 'git-diff',
      changedPaths: [
        { status: 'added', path: 'a.ts' },
        { status: 'modified', path: 'b.ts' },
        { status: 'deleted', path: 'c.ts' },
      ],
    };

    expect(getChangedFileProjection(input)).toEqual(['a.ts', 'b.ts', 'c.ts']);
  });

  it('projects a renamed record to both old and new paths', () => {
    const input = {
      kind: 'git-diff',
      changedPaths: [{ status: 'renamed', oldPath: 'old.ts', newPath: 'new.ts' }],
    };

    expect(getChangedFileProjection(input)).toEqual(['new.ts', 'old.ts']);
  });

  it('deduplicates overlapping paths across records', () => {
    const input = {
      kind: 'git-diff',
      changedPaths: [
        { status: 'renamed', oldPath: 'a.ts', newPath: 'b.ts' },
        { status: 'added', path: 'b.ts' },
      ],
    };

    expect(getChangedFileProjection(input)).toEqual(['a.ts', 'b.ts']);
  });
});

describe('getVerifyBaseRef', () => {
  it('reads VERIFY_BASE from process env', () => {
    expect(getVerifyBaseRef({ VERIFY_BASE: 'origin/develop' })).toBe('origin/develop');
  });

  it('returns null when VERIFY_BASE is unset', () => {
    expect(getVerifyBaseRef({})).toBeNull();
  });
});

describe('resolveChangedPathsScope explicit-files mode', () => {
  it('bypasses Git entirely and does not invent statuses', () => {
    const scope = resolveChangedPathsScope({ cliFilesOverride: ['b.ts', 'a.ts'] });

    expect(scope).toEqual({
      input: { kind: 'explicit-files', files: ['a.ts', 'b.ts'] },
      scope: 'explicit-files',
      baseRef: null,
      packageJsonOldRef: null,
    });
  });
});

describe('resolveChangedPathsScope local mode', () => {
  it('represents ordinary local working-tree changes', () => {
    const dir = createTempRepo();
    writeFile(dir, 'src/a.ts');
    commitAll(dir, 'init');
    writeFile(dir, 'src/a.ts', 'changed\n');

    const scope = resolveChangedPathsScope({ cwd: dir, processEnv: {} });

    expect(scope.scope).toBe('local-changes');
    expect(scope.baseRef).toBeNull();
    expect(scope.packageJsonOldRef).toBe('HEAD');
    expect(scope.input).toEqual({
      kind: 'git-diff',
      changedPaths: [{ status: 'modified', path: 'src/a.ts' }],
    });
  });

  it('represents staged and unstaged tracked changes via one effective comparison', () => {
    const dir = createTempRepo();
    writeFile(dir, 'x.ts');
    writeFile(dir, 'y.ts');
    commitAll(dir, 'init');
    writeFile(dir, 'x.ts', 'staged change\n');
    git(dir, ['add', 'x.ts']);
    writeFile(dir, 'y.ts', 'unstaged change\n');

    const scope = resolveChangedPathsScope({ cwd: dir, processEnv: {} });

    expect(scope.input.changedPaths).toEqual([
      { status: 'modified', path: 'x.ts' },
      { status: 'modified', path: 'y.ts' },
    ]);
  });

  it('represents untracked files as added', () => {
    const dir = createTempRepo();
    writeFile(dir, 'tracked.ts');
    commitAll(dir, 'init');
    writeFile(dir, 'untracked.ts');

    const scope = resolveChangedPathsScope({ cwd: dir, processEnv: {} });

    expect(scope.input.changedPaths).toEqual([{ status: 'added', path: 'untracked.ts' }]);
  });

  it('keeps deleted paths present', () => {
    const dir = createTempRepo();
    writeFile(dir, 'gone.ts');
    commitAll(dir, 'init');
    fs.rmSync(path.join(dir, 'gone.ts'));

    const scope = resolveChangedPathsScope({ cwd: dir, processEnv: {} });

    expect(scope.input.changedPaths).toEqual([{ status: 'deleted', path: 'gone.ts' }]);
  });

  it('preserves both old and new paths for a rename', () => {
    const dir = createTempRepo();
    writeFile(dir, 'old.ts');
    commitAll(dir, 'init');
    git(dir, ['mv', 'old.ts', 'renamed.ts']);

    const scope = resolveChangedPathsScope({ cwd: dir, processEnv: {} });

    expect(scope.input.changedPaths).toEqual([
      { status: 'renamed', oldPath: 'old.ts', newPath: 'renamed.ts' },
    ]);
  });

  it('falls back to HEAD~1..HEAD when there are no working-tree changes', () => {
    const dir = createTempRepo();
    writeFile(dir, 'a.ts');
    commitAll(dir, 'first');
    writeFile(dir, 'b.ts');
    commitAll(dir, 'second');

    const scope = resolveChangedPathsScope({ cwd: dir, processEnv: {} });

    expect(scope.scope).toBe('local-last-commit');
    expect(scope.baseRef).toBeNull();
    expect(scope.packageJsonOldRef).toBe('HEAD~1');
    expect(scope.input).toEqual({
      kind: 'git-diff',
      changedPaths: [{ status: 'added', path: 'b.ts' }],
    });
  });
});

describe('resolveChangedPathsScope local-base mode', () => {
  it('compares the fork point with the current working tree', () => {
    const dir = createTempRepo();
    writeFile(dir, 'shared.ts');
    const forkPoint = commitAll(dir, 'init');
    git(dir, ['checkout', '-b', 'feature']);
    writeFile(dir, 'feature-only.ts');
    commitAll(dir, 'feature commit');
    writeFile(dir, 'uncommitted.ts');

    const scope = resolveChangedPathsScope({ cliBaseRef: 'main', cwd: dir, processEnv: {} });

    expect(scope.scope).toBe('local-base main');
    expect(scope.baseRef).toBe('main');
    expect(scope.packageJsonOldRef).toBe(forkPoint);
    expect(scope.input).toEqual({
      kind: 'git-diff',
      changedPaths: [
        { status: 'added', path: 'feature-only.ts' },
        { status: 'added', path: 'uncommitted.ts' },
      ],
    });
  });

  it('throws clearly when the base ref does not exist', () => {
    const dir = createTempRepo();
    writeFile(dir, 'a.ts');
    commitAll(dir, 'init');

    expect(() =>
      resolveChangedPathsScope({ cliBaseRef: 'origin/does-not-exist', cwd: dir, processEnv: {} }),
    ).toThrow(/Base ref does not exist/);
  });
});

describe('resolveChangedPathsScope GitHub Actions mode', () => {
  it('compares the merge base of HEAD and origin/$GITHUB_BASE_REF with HEAD', () => {
    const dir = createTempRepo();
    writeFile(dir, 'shared.ts');
    const mergeBase = commitAll(dir, 'init');
    git(dir, ['update-ref', 'refs/remotes/origin/develop', mergeBase]);
    writeFile(dir, 'pr-only.ts');
    commitAll(dir, 'pr commit');
    writeFile(dir, 'shared.ts', 'uncommitted working tree change\n');

    const scope = resolveChangedPathsScope({
      processEnv: { GITHUB_BASE_REF: 'develop' },
      cwd: dir,
    });

    expect(scope.scope).toBe('github-base origin/develop');
    expect(scope.baseRef).toBe('origin/develop');
    expect(scope.packageJsonOldRef).toBe(mergeBase);
    expect(scope.input).toEqual({
      kind: 'git-diff',
      changedPaths: [{ status: 'added', path: 'pr-only.ts' }],
    });
  });
});
