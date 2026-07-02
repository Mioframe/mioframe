import { describe, expect, it, vi } from 'vitest';

import {
  compareSemver,
  isReleaseSyncBackBranch,
  parseSemver,
  readPackageVersion,
  readVersionAtRef,
  resolveVersionContext,
  tagExists,
  validateRelease,
} from './validateVersion.mjs';

describe('parseSemver', () => {
  it('parses a valid X.Y.Z version', () => {
    expect(parseSemver('0.1.0')).toEqual({ major: 0, minor: 1, patch: 0 });
    expect(parseSemver('12.34.56')).toEqual({ major: 12, minor: 34, patch: 56 });
  });

  it('rejects a version with a pre-release or build suffix', () => {
    expect(parseSemver('0.1.0-beta.1')).toBeNull();
    expect(parseSemver('0.1.0+build.5')).toBeNull();
  });

  it('rejects a non-SemVer string', () => {
    expect(parseSemver('0.1')).toBeNull();
    expect(parseSemver('v0.1.0')).toBeNull();
    expect(parseSemver('not-a-version')).toBeNull();
  });
});

describe('compareSemver', () => {
  it('orders by major, then minor, then patch', () => {
    expect(compareSemver(parseSemver('1.0.0'), parseSemver('0.9.9'))).toBeGreaterThan(0);
    expect(compareSemver(parseSemver('0.2.0'), parseSemver('0.10.0'))).toBeLessThan(0);
    expect(compareSemver(parseSemver('0.1.1'), parseSemver('0.1.0'))).toBeGreaterThan(0);
    expect(compareSemver(parseSemver('0.1.0'), parseSemver('0.1.0'))).toBe(0);
  });
});

describe('readPackageVersion', () => {
  it('reads the version field from package.json content', () => {
    const readFile = vi.fn().mockReturnValue(JSON.stringify({ version: '0.1.0' }));
    expect(readPackageVersion('package.json', readFile)).toBe('0.1.0');
    expect(readFile).toHaveBeenCalledWith('package.json', 'utf8');
  });

  it('throws when the version field is missing', () => {
    const readFile = vi.fn().mockReturnValue(JSON.stringify({ name: 'mioframe' }));
    expect(() => readPackageVersion('package.json', readFile)).toThrow(
      'missing a string "version" field',
    );
  });
});

describe('readVersionAtRef', () => {
  it('reads the version from a git show result', () => {
    const spawn = vi.fn().mockReturnValue({
      status: 0,
      stdout: JSON.stringify({ version: '0.0.9' }),
    });
    expect(readVersionAtRef('origin/develop', 'package.json', spawn)).toBe('0.0.9');
    expect(spawn).toHaveBeenCalledWith(
      'git',
      ['show', 'origin/develop:package.json'],
      expect.any(Object),
    );
  });

  it('returns null when git show fails', () => {
    const spawn = vi.fn().mockReturnValue({ status: 1, stdout: '' });
    expect(readVersionAtRef('origin/develop', 'package.json', spawn)).toBeNull();
  });

  it('returns null when the output is not valid JSON', () => {
    const spawn = vi.fn().mockReturnValue({ status: 0, stdout: 'not json' });
    expect(readVersionAtRef('origin/develop', 'package.json', spawn)).toBeNull();
  });
});

describe('tagExists', () => {
  it('returns true when git rev-parse resolves the tag', () => {
    const spawn = vi.fn().mockReturnValue({ status: 0, stdout: 'abc123\n' });
    expect(tagExists('v0.1.0', spawn)).toBe(true);
    expect(spawn).toHaveBeenCalledWith(
      'git',
      ['rev-parse', '--verify', '--quiet', 'refs/tags/v0.1.0'],
      expect.any(Object),
    );
  });

  it('returns false when git rev-parse cannot resolve the tag', () => {
    const spawn = vi.fn().mockReturnValue({ status: 1, stdout: '' });
    expect(tagExists('v0.1.0', spawn)).toBe(false);
  });
});

describe('isReleaseSyncBackBranch', () => {
  it('matches a sync-back branch whose embedded version matches', () => {
    expect(isReleaseSyncBackBranch('sync/main-0.1.0-back-to-develop', '0.1.0')).toBe(true);
  });

  it('rejects a sync-back branch whose embedded version does not match', () => {
    expect(isReleaseSyncBackBranch('sync/main-0.1.0-back-to-develop', '0.2.0')).toBe(false);
  });

  it('rejects an ordinary feature/fix branch name', () => {
    expect(isReleaseSyncBackBranch('feature/add-widget', '0.1.0')).toBe(false);
    expect(isReleaseSyncBackBranch('fix/broken-thing', '0.1.0')).toBe(false);
  });

  it('rejects an undefined branch name', () => {
    expect(isReleaseSyncBackBranch(undefined, '0.1.0')).toBe(false);
  });
});

describe('resolveVersionContext', () => {
  it('prefers an explicit --tag flag', () => {
    expect(resolveVersionContext({}, ['--tag', 'v0.1.0'])).toEqual({
      kind: 'tag',
      tag: 'v0.1.0',
    });
  });

  it('prefers an explicit --base flag over env', () => {
    expect(
      resolveVersionContext({ GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'push' }, [
        '--base',
        'origin/main',
        '--target',
        'main',
      ]),
    ).toEqual({ kind: 'compare', baseRef: 'origin/main', targetBranch: 'main' });
  });

  it('returns local outside CI with no explicit flags', () => {
    expect(resolveVersionContext({}, [])).toEqual({ kind: 'local' });
  });

  it('detects a tag push in GitHub Actions', () => {
    expect(
      resolveVersionContext({ GITHUB_ACTIONS: 'true', GITHUB_REF: 'refs/tags/v0.1.0' }, []),
    ).toEqual({ kind: 'tag', tag: 'v0.1.0' });
  });

  it('detects a pull_request context in GitHub Actions', () => {
    expect(
      resolveVersionContext(
        {
          GITHUB_ACTIONS: 'true',
          GITHUB_EVENT_NAME: 'pull_request',
          GITHUB_BASE_REF: 'develop',
        },
        [],
      ),
    ).toEqual({
      kind: 'compare',
      baseRef: 'origin/develop',
      targetBranch: 'develop',
      headBranch: undefined,
    });
  });

  it('carries the PR head branch from GITHUB_HEAD_REF in GitHub Actions', () => {
    expect(
      resolveVersionContext(
        {
          GITHUB_ACTIONS: 'true',
          GITHUB_EVENT_NAME: 'pull_request',
          GITHUB_BASE_REF: 'develop',
          GITHUB_HEAD_REF: 'sync/main-0.1.0-back-to-develop',
        },
        [],
      ),
    ).toEqual({
      kind: 'compare',
      baseRef: 'origin/develop',
      targetBranch: 'develop',
      headBranch: 'sync/main-0.1.0-back-to-develop',
    });
  });

  it('carries an explicit --head flag alongside --base', () => {
    expect(
      resolveVersionContext({}, [
        '--base',
        'origin/develop',
        '--target',
        'develop',
        '--head',
        'sync/main-0.1.0-back-to-develop',
      ]),
    ).toEqual({
      kind: 'compare',
      baseRef: 'origin/develop',
      targetBranch: 'develop',
      headBranch: 'sync/main-0.1.0-back-to-develop',
    });
  });

  it('detects a push to main in GitHub Actions', () => {
    expect(
      resolveVersionContext(
        { GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'push', GITHUB_REF: 'refs/heads/main' },
        [],
      ),
    ).toEqual({ kind: 'push-main' });
  });

  it('falls back to ci-other for an unrecognized CI event', () => {
    expect(
      resolveVersionContext(
        { GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'push', GITHUB_REF: 'refs/heads/develop' },
        [],
      ),
    ).toEqual({ kind: 'ci-other' });
  });
});

describe('validateRelease', () => {
  const baseDeps = () => ({
    readFile: vi.fn().mockReturnValue(JSON.stringify({ version: '0.2.0' })),
    fileExists: vi.fn().mockReturnValue(true),
    log: vi.fn(),
    logError: vi.fn(),
  });

  it('passes locally when package.json version is valid and docs exist', () => {
    const deps = baseDeps();
    const result = validateRelease({ argv: [], env: {}, deps });
    expect(result).toBe(true);
    expect(deps.logError).not.toHaveBeenCalled();
  });

  it('fails when package.json version is not valid SemVer', () => {
    const deps = baseDeps();
    deps.readFile = vi.fn().mockReturnValue(JSON.stringify({ version: '0.2' }));
    const result = validateRelease({ argv: [], env: {}, deps });
    expect(result).toBe(false);
  });

  it('passes a PR-to-develop context when the version increased', () => {
    const deps = baseDeps();
    deps.spawn = vi.fn().mockReturnValue({
      status: 0,
      stdout: JSON.stringify({ version: '0.1.0' }),
    });
    const result = validateRelease({
      argv: ['--base', 'origin/develop', '--target', 'develop'],
      env: {},
      deps,
    });
    expect(result).toBe(true);
  });

  it('fails a PR-to-develop context when the version did not increase', () => {
    const deps = baseDeps();
    deps.spawn = vi.fn().mockReturnValue({
      status: 0,
      stdout: JSON.stringify({ version: '0.2.0' }),
    });
    const result = validateRelease({
      argv: ['--base', 'origin/develop', '--target', 'develop'],
      env: {},
      deps,
    });
    expect(result).toBe(false);
    expect(deps.logError).toHaveBeenCalledWith(
      expect.stringContaining('Version must increase for this PR'),
    );
  });

  function makeCompareSpawn({ baseVersion, tagFound }) {
    return vi.fn((_command, args) => {
      if (args[0] === 'show') {
        return { status: 0, stdout: JSON.stringify({ version: baseVersion }) };
      }
      if (args[0] === 'rev-parse') {
        return { status: tagFound ? 0 : 1, stdout: tagFound ? 'abc123\n' : '' };
      }
      throw new Error(`unexpected git command: ${args.join(' ')}`);
    });
  }

  it('passes a same-version PR-to-main context as a pre-tag release repair when the tag does not exist yet', () => {
    const deps = baseDeps();
    deps.fileExists = vi.fn(() => true);
    deps.spawn = makeCompareSpawn({ baseVersion: '0.2.0', tagFound: false });
    const result = validateRelease({
      argv: ['--base', 'origin/main', '--target', 'main'],
      env: {},
      deps,
    });
    expect(result).toBe(true);
    expect(deps.logError).not.toHaveBeenCalled();
  });

  it('fails a same-version PR-to-main context when the matching tag already exists', () => {
    const deps = baseDeps();
    deps.fileExists = vi.fn(() => true);
    deps.spawn = makeCompareSpawn({ baseVersion: '0.2.0', tagFound: true });
    const result = validateRelease({
      argv: ['--base', 'origin/main', '--target', 'main'],
      env: {},
      deps,
    });
    expect(result).toBe(false);
    expect(deps.logError).toHaveBeenCalledWith(
      expect.stringContaining('tag v0.2.0 already exists'),
    );
  });

  it('fails a same-version PR-to-develop context regardless of tag state', () => {
    const deps = baseDeps();
    deps.spawn = makeCompareSpawn({ baseVersion: '0.2.0', tagFound: false });
    const result = validateRelease({
      argv: ['--base', 'origin/develop', '--target', 'develop'],
      env: {},
      deps,
    });
    expect(result).toBe(false);
    expect(deps.logError).toHaveBeenCalledWith(
      expect.stringContaining('Version must increase for this PR'),
    );
  });

  it('passes a same-version release sync-back PR from main into develop', () => {
    const deps = baseDeps();
    deps.readFile = vi.fn().mockReturnValue(JSON.stringify({ version: '0.1.0' }));
    deps.spawn = makeCompareSpawn({ baseVersion: '0.1.0', tagFound: false });
    const result = validateRelease({
      argv: [
        '--base',
        'origin/develop',
        '--target',
        'develop',
        '--head',
        'sync/main-0.1.0-back-to-develop',
      ],
      env: {},
      deps,
    });
    expect(result).toBe(true);
    expect(deps.logError).not.toHaveBeenCalled();
  });

  it('fails a same-version PR into develop from an ordinary feature branch', () => {
    const deps = baseDeps();
    deps.readFile = vi.fn().mockReturnValue(JSON.stringify({ version: '0.1.0' }));
    deps.spawn = makeCompareSpawn({ baseVersion: '0.1.0', tagFound: false });
    const result = validateRelease({
      argv: ['--base', 'origin/develop', '--target', 'develop', '--head', 'feature/add-widget'],
      env: {},
      deps,
    });
    expect(result).toBe(false);
    expect(deps.logError).toHaveBeenCalledWith(
      expect.stringContaining('Version must increase for this PR'),
    );
  });

  it('fails a same-version PR into develop from an ordinary fix branch', () => {
    const deps = baseDeps();
    deps.readFile = vi.fn().mockReturnValue(JSON.stringify({ version: '0.1.0' }));
    deps.spawn = makeCompareSpawn({ baseVersion: '0.1.0', tagFound: false });
    const result = validateRelease({
      argv: ['--base', 'origin/develop', '--target', 'develop', '--head', 'fix/broken-thing'],
      env: {},
      deps,
    });
    expect(result).toBe(false);
    expect(deps.logError).toHaveBeenCalledWith(
      expect.stringContaining('Version must increase for this PR'),
    );
  });

  it('fails a release sync-back branch whose embedded version does not match package.json', () => {
    const deps = baseDeps();
    deps.readFile = vi.fn().mockReturnValue(JSON.stringify({ version: '0.2.0' }));
    deps.spawn = makeCompareSpawn({ baseVersion: '0.2.0', tagFound: false });
    const result = validateRelease({
      argv: [
        '--base',
        'origin/develop',
        '--target',
        'develop',
        '--head',
        'sync/main-0.1.0-back-to-develop',
      ],
      env: {},
      deps,
    });
    expect(result).toBe(false);
    expect(deps.logError).toHaveBeenCalledWith(
      expect.stringContaining('Version must increase for this PR'),
    );
  });

  it('passes a PR-to-main context when the version increased, independent of tag state', () => {
    const deps = baseDeps();
    deps.spawn = makeCompareSpawn({ baseVersion: '0.1.0', tagFound: true });
    const result = validateRelease({
      argv: ['--base', 'origin/main', '--target', 'main'],
      env: {},
      deps,
    });
    expect(result).toBe(true);
  });

  it('fails a PR-to-main context and requires release notes when the version increased', () => {
    const deps = baseDeps();
    deps.spawn = vi.fn().mockReturnValue({
      status: 0,
      stdout: JSON.stringify({ version: '0.1.0' }),
    });
    deps.fileExists = vi.fn((filePath) => filePath !== 'docs/releases/0.2.0.md');
    const result = validateRelease({
      argv: ['--base', 'origin/main', '--target', 'main'],
      env: {},
      deps,
    });
    expect(result).toBe(false);
    expect(deps.logError).toHaveBeenCalledWith(expect.stringContaining('Missing release notes'));
  });

  it('passes a matching tag context', () => {
    const deps = baseDeps();
    const result = validateRelease({ argv: ['--tag', 'v0.2.0'], env: {}, deps });
    expect(result).toBe(true);
  });

  it('fails a tag context that does not match package.json version', () => {
    const deps = baseDeps();
    const result = validateRelease({ argv: ['--tag', 'v0.9.9'], env: {}, deps });
    expect(result).toBe(false);
    expect(deps.logError).toHaveBeenCalledWith(
      expect.stringContaining('does not match package.json version'),
    );
  });

  it('fails a tag context with a malformed tag', () => {
    const deps = baseDeps();
    const result = validateRelease({ argv: ['--tag', 'release-1'], env: {}, deps });
    expect(result).toBe(false);
  });

  it('fails when required docs are missing', () => {
    const deps = baseDeps();
    deps.fileExists = vi.fn().mockReturnValue(false);
    const result = validateRelease({ argv: [], env: {}, deps });
    expect(result).toBe(false);
    expect(deps.logError).toHaveBeenCalledWith(
      expect.stringContaining('Missing docs/release-checklist.md'),
    );
    expect(deps.logError).toHaveBeenCalledWith(expect.stringContaining('Missing docs/release.md'));
  });
});
