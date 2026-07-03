import type { PluginOption } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

type ReleaseChannel = 'stable' | 'branch';

type GetPwaPluginsParams = {
  base: string;
  isPreview: boolean;
  mode: string;
  disablePwa?: boolean;
  channel?: ReleaseChannel;
  channelId?: string;
};

const daysToSeconds = (days: number) => 24 * 60 * 60 * days;

/**
 * Build the Cache Storage name prefix for a release channel.
 *
 * Cache Storage is per-origin, not per service-worker-scope, so channel
 * isolation across `/`, `/branch/<slug>/`, and `/pr/<number>/` depends on
 * this prefix, not on scope alone. Must match the prefix
 * `scripts/pages/lib/tombstoneContent.mjs` uses when clearing a removed
 * branch's caches.
 * @param channel - Release channel.
 * @param channelId - Channel identifier; required for the `branch` channel.
 * @returns Cache name prefix, e.g. `stable` or `branch-develop`.
 */
export function buildChannelCacheNamespace(channel: ReleaseChannel, channelId?: string): string {
  if (channel === 'branch') {
    if (!channelId) {
      throw new Error('channelId is required for the "branch" release channel.');
    }
    return `branch-${channelId}`;
  }
  return 'stable';
}

/**
 * Returns true when `pathname` is under `base` but belongs to a different
 * top-level channel namespace (`/branch/*` or `/pr/*`).
 *
 * Only meaningful for the stable channel: its service worker scope is `/`,
 * so it is the only one whose fetch handler can ever see requests for other
 * channels' paths. A branch channel's scope (e.g. `/branch/develop/`) is
 * narrower than any other channel's path, so the browser never dispatches
 * fetch/navigate events for foreign paths to it in the first place.
 * @param pathname - The URL pathname to test, e.g. `/branch/develop/assets/app.js`.
 * @param base - The Vite `base` URL for this build, e.g. `/`.
 * @returns `true` when the pathname belongs to a different channel's deployment.
 */
export function isForeignChannelPath(pathname: string, base: string): boolean {
  if (!pathname.startsWith(base)) return false;
  const rest = pathname.slice(base.length);
  return /^(?:branch|pr)\/.*$/.test(rest);
}

/**
 * Builds a RegExp that matches foreign-channel paths (`/branch/*`, `/pr/*`)
 * under the given Vite base path, for the stable service worker's
 * `navigateFallbackDenylist`.
 * @param base - The Vite `base` URL, e.g. `/`.
 * @returns A RegExp matching `/branch/*` and `/pr/*` path prefixes under `base`.
 */
export function buildForeignChannelDenylistPattern(base: string): RegExp {
  const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escapedBase}(?:branch|pr)\\/`);
}

/**
 * Builds a Workbox `urlPattern` function that matches `url.pathname` against
 * `pattern`, additionally excluding foreign-channel paths when `channel` is
 * `stable` (see {@link isForeignChannelPath}).
 * @param pattern - RegExp tested against `url.pathname`.
 * @param base - The Vite `base` URL for this build.
 * @param channel - Release channel this service worker is built for.
 * @returns A Workbox `urlPattern` function.
 */
export function buildSameOriginMatcher(
  pattern: RegExp,
  base: string,
  channel: ReleaseChannel,
): (context: { url: URL }) => boolean {
  if (channel !== 'stable') {
    return ({ url }: { url: URL }) => pattern.test(url.pathname);
  }
  return ({ url }: { url: URL }) =>
    pattern.test(url.pathname) && !isForeignChannelPath(url.pathname, base);
}

/**
 * Build the manifest `name`/`short_name` identity for a release channel, so
 * an installed branch PWA is visually distinguishable from stable.
 * @param channel - Release channel.
 * @param channelId - Channel identifier (e.g. `develop`, a branch slug).
 * @returns `{ name, short_name }` for the Web App Manifest.
 */
function buildManifestIdentity(channel: ReleaseChannel, channelId?: string) {
  if (channel === 'branch' && channelId) {
    const label = channelId === 'develop' ? 'Develop' : channelId;
    return { name: `Mioframe ${label}`, short_name: `Mioframe ${label}` };
  }
  return { name: 'Mioframe', short_name: 'Mioframe' };
}

/**
 * Returns the Vite PWA plugin array for the given build parameters.
 *
 * Returns an empty array when PWA is disabled or the mode is not production
 * and not a preview build (PR previews always pass `disablePwa: true`). In
 * all other cases returns a single configured {@link VitePWA} plugin scoped
 * and namespaced to the given release channel:
 * - `scope`/`start_url`/`id` are pinned to `base`, so the manifest never
 *   drifts from the deployment it was built for;
 * - cache names are namespaced per channel ({@link buildChannelCacheNamespace})
 *   so stable, develop, and other branches never share Cache Storage entries;
 * - the stable channel additionally denies `/branch/*` and `/pr/*` from its
 *   navigation fallback and runtime caching, since its scope (`/`) is the
 *   only one wide enough to otherwise intercept them.
 * @param params - Build parameters controlling whether and how PWA is enabled.
 * @returns A `PluginOption[]` — either `[VitePWA(...)]` or `[]`.
 */
export const getPwaPlugins = ({
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

  const cacheNamespace = buildChannelCacheNamespace(channel, channelId);
  const cacheName = (name: string) => `${cacheNamespace}-${name}`;
  const matcher = (pattern: RegExp) => buildSameOriginMatcher(pattern, base, channel);

  return [
    VitePWA({
      manifest: {
        ...buildManifestIdentity(channel, channelId),
        scope: base,
        start_url: base,
        id: base,
        theme_color: 'rgb(33, 31, 38)',
        background_color: 'rgb(33, 31, 38)',
      },
      workbox: {
        ...(channel === 'stable'
          ? { navigateFallbackDenylist: [buildForeignChannelDenylistPattern(base)] }
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
                ? ({ url }: { url: URL }) => !isForeignChannelPath(url.pathname, base)
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
      },
      pwaAssets: {
        config: true,
        overrideManifestIcons: true,
      },
    }),
  ];
};
