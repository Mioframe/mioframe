import { describe, expect, it } from 'vitest';

import {
  buildChannelCacheNamespace,
  buildForeignChannelDenylistPattern,
  buildSameOriginMatcher,
  getPwaPlugins,
  isForeignChannelPath,
} from './pwa.ts';

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

describe('buildSameOriginMatcher', () => {
  it('excludes foreign-channel paths for the stable channel', () => {
    const matcher = buildSameOriginMatcher(/\.woff2$/i, '/', 'stable');
    expect(matcher({ url: new URL('https://example.com/assets/font.woff2') })).toBe(true);
    expect(matcher({ url: new URL('https://example.com/branch/develop/assets/font.woff2') })).toBe(
      false,
    );
    expect(matcher({ url: new URL('https://example.com/pr/86/assets/font.woff2') })).toBe(false);
  });

  it('does not need foreign-channel exclusion for the branch channel (scope already contains it)', () => {
    const matcher = buildSameOriginMatcher(/\.woff2$/i, '/branch/develop/', 'branch');
    expect(matcher({ url: new URL('https://example.com/branch/develop/assets/font.woff2') })).toBe(
      true,
    );
  });

  it('excludes a path that does not match the pattern', () => {
    const matcher = buildSameOriginMatcher(/\.woff2$/i, '/', 'stable');
    expect(matcher({ url: new URL('https://example.com/assets/app.js') })).toBe(false);
  });
});

describe('getPwaPlugins', () => {
  it('returns empty array when disablePwa is true (PR preview builds)', () => {
    const plugins = getPwaPlugins({
      base: '/pr/42/',
      isPreview: false,
      mode: 'production',
      disablePwa: true,
    });
    expect(plugins).toHaveLength(0);
  });

  it('returns plugins for the stable channel in production mode without a channelId', () => {
    const plugins = getPwaPlugins({
      base: '/',
      isPreview: false,
      mode: 'production',
    });
    expect(plugins.length).toBeGreaterThan(0);
  });

  it('returns plugins for the branch channel when a channelId is provided', () => {
    const plugins = getPwaPlugins({
      base: '/branch/develop/',
      isPreview: false,
      mode: 'production',
      channel: 'branch',
      channelId: 'develop',
    });
    expect(plugins.length).toBeGreaterThan(0);
  });

  it('throws when the branch channel is used without a channelId', () => {
    expect(() =>
      getPwaPlugins({
        base: '/branch/develop/',
        isPreview: false,
        mode: 'production',
        channel: 'branch',
      }),
    ).toThrow('channelId is required');
  });

  it('returns empty array in development mode without isPreview', () => {
    const plugins = getPwaPlugins({
      base: '/',
      isPreview: false,
      mode: 'development',
    });
    expect(plugins).toHaveLength(0);
  });
});
