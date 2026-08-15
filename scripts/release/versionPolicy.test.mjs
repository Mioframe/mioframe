import { describe, expect, it, vi } from 'vitest';

import {
  VERSION_IMPACT_LABELS,
  calculateExpectedVersion,
  compareSemver,
  formatSemver,
  getFlagValue,
  incrementSemver,
  isReleaseSyncBackBranch,
  parseSemver,
  readPackageVersion,
  readPrLabelNames,
  readVersionAtRef,
  resolveVersionImpactFromLabels,
} from './versionPolicy.mjs';

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

describe('formatSemver', () => {
  it('formats a parsed version back to X.Y.Z', () => {
    expect(formatSemver({ major: 0, minor: 3, patch: 16 })).toBe('0.3.16');
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

describe('incrementSemver', () => {
  it('increments PATCH', () => {
    expect(incrementSemver({ major: 0, minor: 3, patch: 16 }, 'patch')).toEqual({
      major: 0,
      minor: 3,
      patch: 17,
    });
  });

  it('increments MINOR and resets patch', () => {
    expect(incrementSemver({ major: 0, minor: 3, patch: 16 }, 'minor')).toEqual({
      major: 0,
      minor: 4,
      patch: 0,
    });
  });

  it('increments MAJOR and resets minor/patch', () => {
    expect(incrementSemver({ major: 0, minor: 3, patch: 16 }, 'major')).toEqual({
      major: 1,
      minor: 0,
      patch: 0,
    });
  });

  it('throws for an unknown impact', () => {
    expect(() => incrementSemver({ major: 0, minor: 0, patch: 0 }, 'unknown')).toThrow(
      'Unknown version impact',
    );
  });
});

describe('calculateExpectedVersion', () => {
  it('calculates the exact expected version for each impact', () => {
    expect(calculateExpectedVersion('0.3.16', 'patch')).toBe('0.3.17');
    expect(calculateExpectedVersion('0.3.16', 'minor')).toBe('0.4.0');
    expect(calculateExpectedVersion('0.3.16', 'major')).toBe('1.0.0');
  });

  it('returns null for an invalid base version', () => {
    expect(calculateExpectedVersion('not-a-version', 'patch')).toBeNull();
  });
});

describe('resolveVersionImpactFromLabels', () => {
  it('resolves exactly one valid version-impact label', () => {
    expect(resolveVersionImpactFromLabels(['version:patch'])).toEqual({
      ok: true,
      impact: 'patch',
    });
    expect(resolveVersionImpactFromLabels(['version:minor'])).toEqual({
      ok: true,
      impact: 'minor',
    });
    expect(resolveVersionImpactFromLabels(['version:major'])).toEqual({
      ok: true,
      impact: 'major',
    });
  });

  it('ignores unrelated labels', () => {
    expect(
      resolveVersionImpactFromLabels(['needs-review', 'version:patch', 'good-first-issue']),
    ).toEqual({
      ok: true,
      impact: 'patch',
    });
  });

  it('reports a missing version-impact label', () => {
    expect(resolveVersionImpactFromLabels(['needs-review'])).toEqual({
      ok: false,
      reason: 'missing',
    });
    expect(resolveVersionImpactFromLabels([])).toEqual({ ok: false, reason: 'missing' });
  });

  it('reports multiple version-impact labels', () => {
    expect(resolveVersionImpactFromLabels(['version:patch', 'version:minor'])).toEqual({
      ok: false,
      reason: 'multiple',
      impacts: ['patch', 'minor'],
    });
  });
});

describe('VERSION_IMPACT_LABELS', () => {
  it('names the three canonical labels', () => {
    expect(VERSION_IMPACT_LABELS).toEqual({
      patch: 'version:patch',
      minor: 'version:minor',
      major: 'version:major',
    });
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

describe('readPrLabelNames', () => {
  it('reads label names from a pull_request event payload', () => {
    const readFile = vi.fn().mockReturnValue(
      JSON.stringify({
        pull_request: { labels: [{ name: 'version:patch' }, { name: 'needs-review' }] },
      }),
    );
    expect(readPrLabelNames('/tmp/event.json', readFile)).toEqual([
      'version:patch',
      'needs-review',
    ]);
  });

  it('throws when eventPath is not set', () => {
    expect(() => readPrLabelNames(undefined, vi.fn())).toThrow('GITHUB_EVENT_PATH is not set');
  });

  it('throws when the payload has no pull_request.labels array', () => {
    const readFile = vi.fn().mockReturnValue(JSON.stringify({ pull_request: {} }));
    expect(() => readPrLabelNames('/tmp/event.json', readFile)).toThrow(
      'does not contain a pull_request.labels array',
    );
  });
});

describe('getFlagValue', () => {
  it('reads the value following a flag', () => {
    expect(getFlagValue(['--base', 'origin/develop'], '--base')).toBe('origin/develop');
  });

  it('returns undefined when the flag is absent', () => {
    expect(getFlagValue([], '--base')).toBeUndefined();
  });
});
