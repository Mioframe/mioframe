/**
 * Frozen, release-test-only snapshot of `config/plugins/pwa.ts` exactly as
 * it existed on `develop` immediately before the managed pinned application
 * updates feature (fully generated `generateSW` Workbox worker, no managed
 * controller). Used only by `tests/e2e/release/managedUpdatesMigration.spec.ts`
 * to build the "old" artifact a real user would already have installed, so
 * migration to the new `injectManifest` controller worker can be proven
 * against the exact previous generated behavior — not an approximation.
 *
 * Never imported by the real application build. `vite.config.ts` only
 * selects this module when the release-test-only
 * `RELEASE_TEST_LEGACY_PWA_FIXTURE=1` environment variable is set, which no
 * normal dev, build, or deploy path ever sets.
 *
 * Keep this file byte-for-byte frozen. Do not "fix" or refactor it to match
 * the current live `config/plugins/pwa.ts` — the entire point is that it
 * stays exactly what real installed users already have.
 */

import type { PluginOption } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import type { VitePWAOptions } from 'vite-plugin-pwa';

type ReleaseChannel = 'stable' | 'branch';

type WorkboxOptions = VitePWAOptions['workbox'];

type GetPwaPluginsParams = {
  base: string;
  isPreview: boolean;
  mode: string;
  disablePwa?: boolean;
  channel?: ReleaseChannel;
  channelId?: string;
};

const daysToSeconds = (days: number) => 24 * 60 * 60 * days;

/** Frozen legacy copy of `buildChannelCacheNamespace`. */
export function buildLegacyChannelCacheNamespace(
  channel: ReleaseChannel,
  channelId?: string,
): string {
  if (channel === 'branch') {
    if (!channelId) {
      throw new Error('channelId is required for the "branch" release channel.');
    }
    return `branch-${channelId}`;
  }
  return 'stable';
}

/** Frozen legacy copy of `isForeignChannelPath`. */
export function isLegacyForeignChannelPath(pathname: string, base: string): boolean {
  if (!pathname.startsWith(base)) return false;
  const rest = pathname.slice(base.length);
  return /^(?:branch|pr)\/.*$/.test(rest);
}

/** Frozen legacy copy of `buildForeignChannelDenylistPattern`. */
export function buildLegacyForeignChannelDenylistPattern(base: string): RegExp {
  const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escapedBase}(?:branch|pr)\\/`);
}

/** Frozen legacy copy of `buildSameOriginMatcher`. */
export function buildLegacySameOriginMatcher(
  pattern: RegExp,
  base: string,
  channel: ReleaseChannel,
): (context: { url: URL }) => boolean {
  if (channel !== 'stable') {
    return ({ url }: { url: URL }) => pattern.test(url.pathname);
  }
  return ({ url }: { url: URL }) =>
    pattern.test(url.pathname) && !isLegacyForeignChannelPath(url.pathname, base);
}

function buildLegacyManifestIdentity(channel: ReleaseChannel, channelId?: string) {
  if (channel === 'branch' && channelId) {
    const label = channelId === 'develop' ? 'Develop' : channelId;
    return { name: `Mioframe ${label}`, short_name: `Mioframe ${label}` };
  }
  return { name: 'Mioframe', short_name: 'Mioframe' };
}

/** Frozen legacy copy of `buildWorkboxOptions`. */
export function buildLegacyWorkboxOptions({
  base,
  channel,
  channelId,
}: {
  base: string;
  channel: ReleaseChannel;
  channelId?: string | undefined;
}): WorkboxOptions {
  const cacheNamespace = buildLegacyChannelCacheNamespace(channel, channelId);
  const cacheName = (name: string) => `${cacheNamespace}-${name}`;
  const matcher = (pattern: RegExp) => buildLegacySameOriginMatcher(pattern, base, channel);

  return {
    cacheId: cacheNamespace,
    ...(channel === 'stable'
      ? { navigateFallbackDenylist: [buildLegacyForeignChannelDenylistPattern(base)] }
      : {}),
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: cacheName('google-fonts'),
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: daysToSeconds(365),
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: matcher(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i),
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: cacheName('static-font-assets'),
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: daysToSeconds(30),
          },
        },
      },
      {
        urlPattern: matcher(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i),
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: cacheName('static-image-assets'),
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: daysToSeconds(14),
          },
        },
      },
      {
        urlPattern: matcher(/\.(?:json|xml|csv)$/i),
        handler: 'NetworkFirst',
        options: {
          cacheName: cacheName('static-data-assets'),
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: daysToSeconds(7),
          },
        },
      },
      {
        urlPattern: matcher(/\/api\/.*$/i),
        handler: 'NetworkFirst',
        method: 'GET',
        options: {
          cacheName: cacheName('apis'),
          expiration: {
            maxEntries: 16,
            maxAgeSeconds: daysToSeconds(1),
          },
          networkTimeoutSeconds: 10,
        },
      },
      {
        urlPattern:
          channel === 'stable'
            ? ({ url }: { url: URL }) => !isLegacyForeignChannelPath(url.pathname, base)
            : () => true,
        handler: 'NetworkFirst',
        options: {
          cacheName: cacheName('others'),
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: daysToSeconds(1),
          },
          networkTimeoutSeconds: 10,
        },
      },
    ],
    maximumFileSizeToCacheInBytes: 10e6,
  };
}

/** Frozen legacy copy of `getPwaPlugins` (always `generateSW`, no managed controller). */
export const getLegacyPwaPlugins = ({
  base,
  isPreview,
  mode,
  disablePwa,
  channel = 'stable',
  channelId,
}: GetPwaPluginsParams): PluginOption[] => {
  if (disablePwa || (mode !== 'production' && !isPreview)) {
    return [];
  }

  return [
    VitePWA({
      manifest: {
        ...buildLegacyManifestIdentity(channel, channelId),
        scope: base,
        start_url: base,
        id: base,
        theme_color: 'rgb(33, 31, 38)',
        background_color: 'rgb(33, 31, 38)',
      },
      workbox: buildLegacyWorkboxOptions({ base, channel, channelId }),
      pwaAssets: {
        config: true,
        overrideManifestIcons: true,
      },
    }),
  ];
};
