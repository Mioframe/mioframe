import { beforeEach, describe, expect, it, vi } from 'vitest';

import { materializePrVersion, resolveMaterializationContext } from './materializePrVersion.mjs';

beforeEach(() => {
  process.exitCode = undefined;
});

function makeDeps({
  packageVersion = '0.3.16',
  spawnBaseVersion = '0.3.16',
  spawnStatus = 0,
} = {}) {
  return {
    readFile: vi.fn().mockReturnValue(JSON.stringify({ version: packageVersion })),
    writeFile: vi.fn(),
    spawn: vi.fn().mockReturnValue({
      status: spawnStatus,
      stdout: JSON.stringify({ version: spawnBaseVersion }),
    }),
    log: vi.fn(),
    logError: vi.fn(),
  };
}

function eventPayload(labelNames) {
  return JSON.stringify({ pull_request: { labels: labelNames.map((name) => ({ name })) } });
}

describe('resolveMaterializationContext', () => {
  it('prefers explicit --base/--impact flags over CI env', () => {
    expect(
      resolveMaterializationContext(
        { GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'pull_request', GITHUB_BASE_REF: 'develop' },
        ['--base', 'origin/develop', '--impact', 'patch'],
      ),
    ).toEqual({
      kind: 'materialize',
      baseRef: 'origin/develop',
      impact: 'patch',
      headBranch: undefined,
    });
  });

  it('rejects an invalid explicit --impact value', () => {
    expect(
      resolveMaterializationContext({}, ['--base', 'origin/develop', '--impact', 'huge']),
    ).toEqual({ kind: 'error', message: expect.stringContaining('Invalid --impact') });
  });

  it('skips outside a GitHub Actions pull_request context', () => {
    expect(resolveMaterializationContext({}, [])).toEqual({
      kind: 'skip',
      reason: expect.stringContaining('not running in a GitHub Actions pull_request context'),
    });
  });

  it('skips when the PR base branch is not develop', () => {
    expect(
      resolveMaterializationContext(
        {
          GITHUB_ACTIONS: 'true',
          GITHUB_EVENT_NAME: 'pull_request',
          GITHUB_BASE_REF: 'feature/other',
        },
        [],
      ),
    ).toEqual({
      kind: 'skip',
      reason: expect.stringContaining('is not develop'),
    });
  });

  it('resolves the impact and base ref from the event payload for a same-repo develop PR', () => {
    const readFile = vi.fn().mockReturnValue(eventPayload(['version:minor']));
    expect(
      resolveMaterializationContext(
        {
          GITHUB_ACTIONS: 'true',
          GITHUB_EVENT_NAME: 'pull_request',
          GITHUB_BASE_REF: 'develop',
          GITHUB_HEAD_REF: 'feature/add-widget',
          GITHUB_EVENT_PATH: '/tmp/event.json',
        },
        [],
        { readFile },
      ),
    ).toEqual({
      kind: 'materialize',
      baseRef: 'origin/develop',
      impact: 'minor',
      headBranch: 'feature/add-widget',
    });
  });

  it('skips with a notice when no version-impact label is present', () => {
    const readFile = vi.fn().mockReturnValue(eventPayload(['needs-review']));
    expect(
      resolveMaterializationContext(
        {
          GITHUB_ACTIONS: 'true',
          GITHUB_EVENT_NAME: 'pull_request',
          GITHUB_BASE_REF: 'develop',
          GITHUB_EVENT_PATH: '/tmp/event.json',
        },
        [],
        { readFile },
      ),
    ).toEqual({ kind: 'skip', reason: expect.stringContaining('no version-impact label present') });
  });

  it('skips with a notice when multiple version-impact labels are present', () => {
    const readFile = vi.fn().mockReturnValue(eventPayload(['version:patch', 'version:major']));
    expect(
      resolveMaterializationContext(
        {
          GITHUB_ACTIONS: 'true',
          GITHUB_EVENT_NAME: 'pull_request',
          GITHUB_BASE_REF: 'develop',
          GITHUB_EVENT_PATH: '/tmp/event.json',
        },
        [],
        { readFile },
      ),
    ).toEqual({
      kind: 'skip',
      reason: expect.stringContaining('multiple version-impact labels present'),
    });
  });

  it('errors when the event payload cannot be read', () => {
    const readFile = vi.fn().mockImplementation(() => {
      throw new Error('ENOENT');
    });
    expect(
      resolveMaterializationContext(
        {
          GITHUB_ACTIONS: 'true',
          GITHUB_EVENT_NAME: 'pull_request',
          GITHUB_BASE_REF: 'develop',
          GITHUB_EVENT_PATH: '/tmp/event.json',
        },
        [],
        { readFile },
      ),
    ).toEqual({
      kind: 'error',
      message: expect.stringContaining('Unable to read PR labels from the GitHub event payload'),
    });
  });
});

describe('materializePrVersion', () => {
  it('materializes a PATCH bump', () => {
    const deps = makeDeps({ packageVersion: '0.3.16', spawnBaseVersion: '0.3.16' });
    const result = materializePrVersion({
      argv: ['--base', 'origin/develop', '--impact', 'patch'],
      env: {},
      deps,
    });
    expect(result).toEqual({ status: 'materialized', from: '0.3.16', to: '0.3.17' });
    expect(deps.writeFile).toHaveBeenCalledWith(
      'package.json',
      expect.stringContaining('"version": "0.3.17"'),
      'utf8',
    );
    expect(process.exitCode).not.toBe(1);
  });

  it('materializes a MINOR bump', () => {
    const deps = makeDeps({ packageVersion: '0.3.16', spawnBaseVersion: '0.3.16' });
    const result = materializePrVersion({
      argv: ['--base', 'origin/develop', '--impact', 'minor'],
      env: {},
      deps,
    });
    expect(result).toEqual({ status: 'materialized', from: '0.3.16', to: '0.4.0' });
  });

  it('materializes a MAJOR bump', () => {
    const deps = makeDeps({ packageVersion: '0.3.16', spawnBaseVersion: '0.3.16' });
    const result = materializePrVersion({
      argv: ['--base', 'origin/develop', '--impact', 'major'],
      env: {},
      deps,
    });
    expect(result).toEqual({ status: 'materialized', from: '0.3.16', to: '1.0.0' });
  });

  it('is idempotent when package.json already has the expected version', () => {
    const deps = makeDeps({ packageVersion: '0.3.17', spawnBaseVersion: '0.3.16' });
    const result = materializePrVersion({
      argv: ['--base', 'origin/develop', '--impact', 'patch'],
      env: {},
      deps,
    });
    expect(result).toEqual({ status: 'unchanged', version: '0.3.17' });
    expect(deps.writeFile).not.toHaveBeenCalled();
  });

  it('does not write and exits successfully when no version-impact label is present', () => {
    const readFile = vi.fn((filePath) => {
      if (filePath === 'package.json') return JSON.stringify({ version: '0.3.16' });
      return eventPayload(['needs-review']);
    });
    const deps = { readFile, writeFile: vi.fn(), spawn: vi.fn(), log: vi.fn(), logError: vi.fn() };
    const result = materializePrVersion({
      argv: [],
      env: {
        GITHUB_ACTIONS: 'true',
        GITHUB_EVENT_NAME: 'pull_request',
        GITHUB_BASE_REF: 'develop',
        GITHUB_EVENT_PATH: '/tmp/event.json',
      },
      deps,
    });
    expect(result.status).toBe('skipped');
    expect(deps.writeFile).not.toHaveBeenCalled();
    expect(deps.logError).not.toHaveBeenCalled();
    expect(process.exitCode).not.toBe(1);
  });

  it('does not write and exits successfully when multiple version-impact labels are present', () => {
    const readFile = vi.fn((filePath) => {
      if (filePath === 'package.json') return JSON.stringify({ version: '0.3.16' });
      return eventPayload(['version:patch', 'version:minor']);
    });
    const deps = { readFile, writeFile: vi.fn(), spawn: vi.fn(), log: vi.fn(), logError: vi.fn() };
    const result = materializePrVersion({
      argv: [],
      env: {
        GITHUB_ACTIONS: 'true',
        GITHUB_EVENT_NAME: 'pull_request',
        GITHUB_BASE_REF: 'develop',
        GITHUB_EVENT_PATH: '/tmp/event.json',
      },
      deps,
    });
    expect(result.status).toBe('skipped');
    expect(deps.writeFile).not.toHaveBeenCalled();
    expect(deps.logError).not.toHaveBeenCalled();
    expect(process.exitCode).not.toBe(1);
  });

  it('does not materialize a release sync-back PR', () => {
    const readFile = vi.fn((filePath) => {
      if (filePath === 'package.json') return JSON.stringify({ version: '0.1.0' });
      return eventPayload(['version:patch']);
    });
    const deps = { readFile, writeFile: vi.fn(), spawn: vi.fn(), log: vi.fn(), logError: vi.fn() };
    const result = materializePrVersion({
      argv: [],
      env: {
        GITHUB_ACTIONS: 'true',
        GITHUB_EVENT_NAME: 'pull_request',
        GITHUB_BASE_REF: 'develop',
        GITHUB_HEAD_REF: 'sync/main-0.1.0-back-to-develop',
        GITHUB_EVENT_PATH: '/tmp/event.json',
      },
      deps,
    });
    expect(result).toEqual({ status: 'skipped', reason: 'sync-back' });
    expect(deps.writeFile).not.toHaveBeenCalled();
  });

  it('fails when the base version cannot be read', () => {
    const deps = makeDeps({ packageVersion: '0.3.16' });
    deps.spawn = vi.fn().mockReturnValue({ status: 1, stdout: '' });
    const result = materializePrVersion({
      argv: ['--base', 'origin/develop', '--impact', 'patch'],
      env: {},
      deps,
    });
    expect(result).toEqual({ status: 'error' });
    expect(process.exitCode).toBe(1);
  });

  it('fails when the base version is not valid SemVer', () => {
    const deps = makeDeps({ packageVersion: '0.3.16', spawnBaseVersion: 'not-a-version' });
    const result = materializePrVersion({
      argv: ['--base', 'origin/develop', '--impact', 'patch'],
      env: {},
      deps,
    });
    expect(result).toEqual({ status: 'error' });
    expect(process.exitCode).toBe(1);
  });

  it('resolves CI event context end to end for a same-repo develop PR', () => {
    const readFile = vi.fn((filePath) => {
      if (filePath === 'package.json') return JSON.stringify({ version: '0.3.16' });
      return eventPayload(['version:patch']);
    });
    const spawn = vi
      .fn()
      .mockReturnValue({ status: 0, stdout: JSON.stringify({ version: '0.3.16' }) });
    const deps = { readFile, writeFile: vi.fn(), spawn, log: vi.fn(), logError: vi.fn() };
    const result = materializePrVersion({
      argv: [],
      env: {
        GITHUB_ACTIONS: 'true',
        GITHUB_EVENT_NAME: 'pull_request',
        GITHUB_BASE_REF: 'develop',
        GITHUB_HEAD_REF: 'feature/add-widget',
        GITHUB_EVENT_PATH: '/tmp/event.json',
      },
      deps,
    });
    expect(result).toEqual({ status: 'materialized', from: '0.3.16', to: '0.3.17' });
    expect(spawn).toHaveBeenCalledWith(
      'git',
      ['show', 'origin/develop:package.json'],
      expect.any(Object),
    );
  });

  it('supports explicit local base + impact mode without a GitHub event', () => {
    const deps = makeDeps({ packageVersion: '0.3.16', spawnBaseVersion: '0.3.16' });
    const result = materializePrVersion({
      argv: ['--base', 'origin/develop', '--impact', 'major'],
      env: {},
      deps,
    });
    expect(result).toEqual({ status: 'materialized', from: '0.3.16', to: '1.0.0' });
    expect(deps.spawn).toHaveBeenCalledWith(
      'git',
      ['show', 'origin/develop:package.json'],
      expect.any(Object),
    );
  });
});
