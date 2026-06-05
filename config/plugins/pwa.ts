import type { PluginOption } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

type GetPwaPluginsParams = {
  base: string;
  isPreview: boolean;
  mode: string;
  disablePwa?: boolean;
};

const daysToSeconds = (days: number) => 24 * 60 * 60 * days;

/**
 * Builds a RegExp that matches PR preview paths under the given Vite base path.
 *
 * Matches `<base>pr-<number>/` and `<base>pr-<number>/**` so the stable
 * service worker can exclude them from navigation fallback and runtime caching,
 * preventing it from serving the cached stable app for PR preview URLs such as
 * `/mioframe/pr-86/`.
 * @param base - The Vite `base` URL, e.g. `/mioframe/`.
 * @returns A RegExp matching PR preview path prefixes under the given base.
 */
export function buildPrPreviewDenylistPattern(base: string): RegExp {
  const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escapedBase}pr-\\d+\\/`);
}

function buildCatchAllPattern(base: string): RegExp {
  const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^(?!${escapedBase}pr-\\d+\\/)`);
}

/**
 * Returns the Vite PWA plugin array for the given build parameters.
 *
 * Returns an empty array when PWA is disabled or the mode is not production
 * and not a preview build.  In all other cases returns a single configured
 * {@link VitePWA} plugin that:
 * - denies the stable service worker from handling PR preview navigation URLs;
 * - excludes PR preview paths from the catch-all runtime cache.
 * @param params - Build parameters controlling whether and how PWA is enabled.
 * @returns A `PluginOption[]` — either `[VitePWA(...)]` or `[]`.
 */
export const getPwaPlugins = ({
  base,
  isPreview,
  mode,
  disablePwa,
}: GetPwaPluginsParams): PluginOption[] => {
  if (disablePwa || (mode !== 'production' && !isPreview)) {
    return [];
  }

  const prPreviewPattern = buildPrPreviewDenylistPattern(base);
  const catchAllPattern = buildCatchAllPattern(base);

  return [
    VitePWA({
      manifest: {
        theme_color: 'rgb(33, 31, 38)',
        background_color: 'rgb(33, 31, 38)',
      },
      workbox: {
        navigateFallbackDenylist: [prPreviewPattern],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
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
            urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-font-assets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: daysToSeconds(30),
              },
            },
          },
          {
            urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-image-assets',
              expiration: {
                maxEntries: 64,
                maxAgeSeconds: daysToSeconds(14),
              },
            },
          },
          {
            urlPattern: /\.(?:json|xml|csv)$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'static-data-assets',
              expiration: {
                maxEntries: 32,
                maxAgeSeconds: daysToSeconds(7),
              },
            },
          },
          {
            urlPattern: /\/api\/.*$/i,
            handler: 'NetworkFirst',
            method: 'GET',
            options: {
              cacheName: 'apis',
              expiration: {
                maxEntries: 16,
                maxAgeSeconds: daysToSeconds(1),
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: catchAllPattern,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'others',
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
