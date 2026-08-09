import { describe, expect, it } from 'vitest';
import {
  buildBranchCacheNamePrefix,
  buildChannelCacheNamespace,
  buildForeignChannelDenylistPattern,
  buildManagedCacheNamespace,
  isForeignChannelPath,
  MANAGED_CHANNELS,
} from './channelContract';

describe('MANAGED_CHANNELS', () => {
  it('is exactly the canonical managed-channel value set', () => {
    expect(MANAGED_CHANNELS).toStrictEqual(['stable', 'develop']);
  });
});

describe('buildChannelCacheNamespace', () => {
  it('returns "stable" for the stable channel', () => {
    expect(buildChannelCacheNamespace('stable')).toBe('stable');
  });

  it('returns a branch-prefixed namespace including the channel id', () => {
    expect(buildChannelCacheNamespace('branch', 'develop')).toBe('branch-develop');
    expect(buildChannelCacheNamespace('branch', 'feature-x')).toBe('branch-feature-x');
  });

  it('produces different namespaces for different branch channel ids', () => {
    expect(buildChannelCacheNamespace('branch', 'develop')).not.toBe(
      buildChannelCacheNamespace('branch', 'feature-x'),
    );
  });

  it('throws when the branch channel is used without a channelId', () => {
    expect(() => buildChannelCacheNamespace('branch')).toThrow('channelId is required');
  });
});

describe('buildManagedCacheNamespace', () => {
  it('returns "stable" for the stable managed channel', () => {
    expect(buildManagedCacheNamespace('stable')).toBe('stable');
  });

  it('returns the develop branch namespace for the develop managed channel', () => {
    expect(buildManagedCacheNamespace('develop')).toBe('branch-develop');
  });

  it('produces distinct namespaces for stable and develop', () => {
    expect(buildManagedCacheNamespace('stable')).not.toBe(buildManagedCacheNamespace('develop'));
  });

  it('agrees with the general channel cache namespace for both managed channels', () => {
    expect(buildManagedCacheNamespace('stable')).toBe(buildChannelCacheNamespace('stable'));
    expect(buildManagedCacheNamespace('develop')).toBe(
      buildChannelCacheNamespace('branch', 'develop'),
    );
  });
});

describe('buildBranchCacheNamePrefix', () => {
  it('builds a branch-scoped cache prefix', () => {
    expect(buildBranchCacheNamePrefix('develop')).toBe('branch-develop-');
    expect(buildBranchCacheNamePrefix('feature-x')).toBe('branch-feature-x-');
  });

  it('is exactly the general branch cache namespace plus a trailing dash', () => {
    expect(buildBranchCacheNamePrefix('develop')).toBe(
      `${buildChannelCacheNamespace('branch', 'develop')}-`,
    );
  });
});

describe('isForeignChannelPath', () => {
  describe('foreign channel paths return true (stable base)', () => {
    it('matches a branch path', () => {
      expect(isForeignChannelPath('/branch/develop/', '/')).toBe(true);
      expect(isForeignChannelPath('/branch/develop/assets/app.js', '/')).toBe(true);
    });

    it('matches a PR preview path', () => {
      expect(isForeignChannelPath('/pr/86/', '/')).toBe(true);
      expect(isForeignChannelPath('/pr/86/assets/app.js', '/')).toBe(true);
    });
  });

  describe('own-channel paths return false', () => {
    it('does not match the stable root path', () => {
      expect(isForeignChannelPath('/', '/')).toBe(false);
    });

    it('does not match stable asset paths', () => {
      expect(isForeignChannelPath('/assets/app.js', '/')).toBe(false);
    });

    it('does not match a path that starts with "branch" but has no separator', () => {
      expect(isForeignChannelPath('/branchfoo', '/')).toBe(false);
    });

    it('does not match paths outside the configured base', () => {
      expect(isForeignChannelPath('/other/branch/x', '/mioframe/')).toBe(false);
    });
  });

  it('is scoped relative to a non-root base too', () => {
    expect(isForeignChannelPath('/branch/develop/branch/nested/', '/branch/develop/')).toBe(true);
    expect(isForeignChannelPath('/branch/develop/assets/app.js', '/branch/develop/')).toBe(false);
  });
});

describe('buildForeignChannelDenylistPattern', () => {
  it('matches branch and pr paths under the stable root', () => {
    const pattern = buildForeignChannelDenylistPattern('/');
    expect(pattern.test('/branch/develop/')).toBe(true);
    expect(pattern.test('/pr/86/')).toBe(true);
  });

  it('does not match stable paths', () => {
    const pattern = buildForeignChannelDenylistPattern('/');
    expect(pattern.test('/')).toBe(false);
    expect(pattern.test('/assets/app.js')).toBe(false);
  });
});
