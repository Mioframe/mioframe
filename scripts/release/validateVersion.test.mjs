import { describe, expect, it, vi } from 'vitest';

import { resolveVersionContext, tagExists, validateRelease } from './validateVersion.mjs';

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

  describe('ordinary develop PRs: exact label-selected version', () => {
    it('passes an exact PATCH version', () => {
      const deps = baseDeps();
      deps.readFile = vi.fn().mockReturnValue(JSON.stringify({ version: '0.2.1' }));
      deps.spawn = makeCompareSpawn({ baseVersion: '0.2.0', tagFound: false });
      const result = validateRelease({
        argv: ['--base', 'origin/develop', '--target', 'develop', '--impact', 'patch'],
        env: {},
        deps,
      });
      expect(result).toBe(true);
      expect(deps.logError).not.toHaveBeenCalled();
    });

    it('passes an exact MINOR version', () => {
      const deps = baseDeps();
      deps.readFile = vi.fn().mockReturnValue(JSON.stringify({ version: '0.3.0' }));
      deps.spawn = makeCompareSpawn({ baseVersion: '0.2.0', tagFound: false });
      const result = validateRelease({
        argv: ['--base', 'origin/develop', '--target', 'develop', '--impact', 'minor'],
        env: {},
        deps,
      });
      expect(result).toBe(true);
    });

    it('passes an exact MAJOR version', () => {
      const deps = baseDeps();
      deps.readFile = vi.fn().mockReturnValue(JSON.stringify({ version: '1.0.0' }));
      deps.spawn = makeCompareSpawn({ baseVersion: '0.2.0', tagFound: false });
      const result = validateRelease({
        argv: ['--base', 'origin/develop', '--target', 'develop', '--impact', 'major'],
        env: {},
        deps,
      });
      expect(result).toBe(true);
    });

    it('fails a missing version-impact label (no --impact, no CI context)', () => {
      const deps = baseDeps();
      deps.readFile = vi.fn().mockReturnValue(JSON.stringify({ version: '0.2.1' }));
      deps.spawn = makeCompareSpawn({ baseVersion: '0.2.0', tagFound: false });
      const result = validateRelease({
        argv: ['--base', 'origin/develop', '--target', 'develop'],
        env: {},
        deps,
      });
      expect(result).toBe(false);
      expect(deps.logError).toHaveBeenCalledWith(
        expect.stringContaining('No version-impact label information available'),
      );
    });

    it('fails when the PR event payload carries no version-impact label', () => {
      const deps = baseDeps();
      deps.readFile = vi.fn((filePath) => {
        if (filePath === 'package.json') return JSON.stringify({ version: '0.2.1' });
        return JSON.stringify({ pull_request: { labels: [{ name: 'needs-review' }] } });
      });
      deps.spawn = makeCompareSpawn({ baseVersion: '0.2.0', tagFound: false });
      const result = validateRelease({
        argv: ['--base', 'origin/develop', '--target', 'develop'],
        env: { GITHUB_ACTIONS: 'true', GITHUB_EVENT_PATH: '/tmp/event.json' },
        deps,
      });
      expect(result).toBe(false);
      expect(deps.logError).toHaveBeenCalledWith(
        expect.stringContaining('Missing version-impact label'),
      );
    });

    it('fails when the PR event payload carries multiple version-impact labels', () => {
      const deps = baseDeps();
      deps.readFile = vi.fn((filePath) => {
        if (filePath === 'package.json') return JSON.stringify({ version: '0.2.1' });
        return JSON.stringify({
          pull_request: { labels: [{ name: 'version:patch' }, { name: 'version:major' }] },
        });
      });
      deps.spawn = makeCompareSpawn({ baseVersion: '0.2.0', tagFound: false });
      const result = validateRelease({
        argv: ['--base', 'origin/develop', '--target', 'develop'],
        env: { GITHUB_ACTIONS: 'true', GITHUB_EVENT_PATH: '/tmp/event.json' },
        deps,
      });
      expect(result).toBe(false);
      expect(deps.logError).toHaveBeenCalledWith(
        expect.stringContaining('Multiple version-impact labels present'),
      );
    });

    it('fails a version that is monotonically greater but belongs to the wrong impact class', () => {
      const deps = baseDeps();
      // labeled patch, but package.json carries a minor bump
      deps.readFile = vi.fn().mockReturnValue(JSON.stringify({ version: '0.3.0' }));
      deps.spawn = makeCompareSpawn({ baseVersion: '0.2.0', tagFound: false });
      const result = validateRelease({
        argv: ['--base', 'origin/develop', '--target', 'develop', '--impact', 'patch'],
        env: {},
        deps,
      });
      expect(result).toBe(false);
      expect(deps.logError).toHaveBeenCalledWith(
        expect.stringContaining('package.json version must be exactly 0.2.1'),
      );
    });

    it('fails a same-version ordinary develop PR even with a valid label', () => {
      const deps = baseDeps();
      deps.readFile = vi.fn().mockReturnValue(JSON.stringify({ version: '0.2.0' }));
      deps.spawn = makeCompareSpawn({ baseVersion: '0.2.0', tagFound: false });
      const result = validateRelease({
        argv: ['--base', 'origin/develop', '--target', 'develop', '--impact', 'patch'],
        env: {},
        deps,
      });
      expect(result).toBe(false);
      expect(deps.logError).toHaveBeenCalledWith(
        expect.stringContaining('package.json version must be exactly 0.2.1'),
      );
    });

    it('fails an ordinary feature branch carrying the same version as develop', () => {
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
          'feature/add-widget',
          '--impact',
          'patch',
        ],
        env: {},
        deps,
      });
      expect(result).toBe(false);
      expect(deps.logError).toHaveBeenCalledWith(
        expect.stringContaining('package.json version must be exactly 0.1.1'),
      );
    });

    it('rejects an invalid --impact value', () => {
      const deps = baseDeps();
      deps.readFile = vi.fn().mockReturnValue(JSON.stringify({ version: '0.2.1' }));
      deps.spawn = makeCompareSpawn({ baseVersion: '0.2.0', tagFound: false });
      const result = validateRelease({
        argv: ['--base', 'origin/develop', '--target', 'develop', '--impact', 'huge'],
        env: {},
        deps,
      });
      expect(result).toBe(false);
      expect(deps.logError).toHaveBeenCalledWith(expect.stringContaining('Invalid --impact'));
    });
  });

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
        '--impact',
        'patch',
      ],
      env: {},
      deps,
    });
    expect(result).toBe(false);
    expect(deps.logError).toHaveBeenCalledWith(
      expect.stringContaining('package.json version must be exactly 0.2.1'),
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
