import { describe, expect, it } from 'vitest';

import {
  buildSameOriginMatcher,
  buildWorkboxOptions,
  getPwaPlugins,
  isManagedChannel,
  resolveManagedAppUpdateChannel,
} from './pwa.ts';
// `buildChannelCacheNamespace`, `isForeignChannelPath`, and
// `buildForeignChannelDenylistPattern` are canonically owned and tested by
// channelContract.test.ts; used here only for this file's own composition
// assertions (e.g. that buildWorkboxOptions's cacheId matches the canonical
// namespace), never to re-prove the primitives' own matrix.
import { buildChannelCacheNamespace } from '../../src/shared/service/appUpdate/channelContract.ts';

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

describe('buildWorkboxOptions', () => {
  it('sets cacheId to the same per-channel namespace used by runtime cache names', () => {
    expect(buildWorkboxOptions({ base: '/', channel: 'stable' }).cacheId).toBe(
      buildChannelCacheNamespace('stable'),
    );
    expect(
      buildWorkboxOptions({ base: '/branch/develop/', channel: 'branch', channelId: 'develop' })
        .cacheId,
    ).toBe(buildChannelCacheNamespace('branch', 'develop'));
  });

  it('never shares a cacheId between stable and a branch channel, or between two branches', () => {
    const cacheIds = [
      buildWorkboxOptions({ base: '/', channel: 'stable' }).cacheId,
      buildWorkboxOptions({ base: '/branch/develop/', channel: 'branch', channelId: 'develop' })
        .cacheId,
      buildWorkboxOptions({ base: '/branch/feature-x/', channel: 'branch', channelId: 'feature-x' })
        .cacheId,
    ];

    expect(new Set(cacheIds).size).toBe(cacheIds.length);
  });

  // Workbox prepends `cacheId` to any cache name it derives itself (notably
  // its own default-named precache cache), so this proves the branch
  // tombstone cleanup prefix (`branch-<slug>-`, see
  // scripts/pages/lib/tombstoneContent.mjs) covers Workbox's precache too:
  // every explicit runtime cache name already lives under that same prefix.
  it('namespaces every explicit runtime cache name under the cacheId prefix', () => {
    const { cacheId, runtimeCaching } = buildWorkboxOptions({
      base: '/branch/develop/',
      channel: 'branch',
      channelId: 'develop',
    });

    expect(runtimeCaching?.length).toBeGreaterThan(0);
    for (const entry of runtimeCaching ?? []) {
      expect(entry.options?.cacheName?.startsWith(`${cacheId}-`)).toBe(true);
    }
  });

  it('throws when the branch channel is used without a channelId', () => {
    expect(() => buildWorkboxOptions({ base: '/branch/develop/', channel: 'branch' })).toThrow(
      'channelId is required',
    );
  });
});

describe('isManagedChannel', () => {
  it('is true for the stable channel', () => {
    expect(isManagedChannel('stable')).toBe(true);
  });

  it('is true for the develop branch channel', () => {
    expect(isManagedChannel('branch', 'develop')).toBe(true);
  });

  it('is false for any other branch channel', () => {
    expect(isManagedChannel('branch', 'feature-x')).toBe(false);
    expect(isManagedChannel('branch')).toBe(false);
  });
});

describe('resolveManagedAppUpdateChannel', () => {
  it('is "stable" for an enabled stable production build', () => {
    expect(resolveManagedAppUpdateChannel({ mode: 'production', isPreview: false })).toBe('stable');
  });

  it('is "develop" for an enabled develop branch production build', () => {
    expect(
      resolveManagedAppUpdateChannel({
        mode: 'production',
        isPreview: false,
        channel: 'branch',
        channelId: 'develop',
      }),
    ).toBe('develop');
  });

  it('is "stable" for an enabled stable preview build', () => {
    expect(resolveManagedAppUpdateChannel({ mode: 'development', isPreview: true })).toBe('stable');
  });

  it('is undefined for an ordinary (non-develop) branch build', () => {
    expect(
      resolveManagedAppUpdateChannel({
        mode: 'production',
        isPreview: false,
        channel: 'branch',
        channelId: 'feature-x',
      }),
    ).toBeUndefined();
  });

  it('is undefined for a PR preview build (disablePwa: true)', () => {
    expect(
      resolveManagedAppUpdateChannel({ mode: 'production', isPreview: false, disablePwa: true }),
    ).toBeUndefined();
  });

  it('is undefined when PWA is explicitly disabled even for an otherwise-managed preview build', () => {
    expect(
      resolveManagedAppUpdateChannel({ mode: 'development', isPreview: true, disablePwa: true }),
    ).toBeUndefined();
  });

  it('is undefined for a development build without preview', () => {
    expect(
      resolveManagedAppUpdateChannel({ mode: 'development', isPreview: false }),
    ).toBeUndefined();
  });

  it('is undefined for the branch channel used without a channelId (not "develop")', () => {
    expect(
      resolveManagedAppUpdateChannel({ mode: 'production', isPreview: false, channel: 'branch' }),
    ).toBeUndefined();
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

  it('returns plugins for the develop branch channel (managed, injectManifest)', () => {
    const plugins = getPwaPlugins({
      base: '/branch/develop/',
      isPreview: false,
      mode: 'production',
      channel: 'branch',
      channelId: 'develop',
    });
    expect(plugins.length).toBeGreaterThan(0);
  });

  it('returns plugins for an ordinary branch channel (unmanaged, generateSW)', () => {
    const plugins = getPwaPlugins({
      base: '/branch/feature-x/',
      isPreview: false,
      mode: 'production',
      channel: 'branch',
      channelId: 'feature-x',
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
