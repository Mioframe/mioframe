import type { PluginOption } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

type GetPwaPluginsParams = {
  isPreview: boolean;
  mode: string;
};

const daysToSeconds = (days: number) => 24 * 60 * 60 * days;

export const getPwaPlugins = ({ isPreview, mode }: GetPwaPluginsParams): PluginOption[] =>
  mode === 'production' || isPreview
    ? [
        VitePWA({
          manifest: {
            theme_color: 'rgb(33, 31, 38)',
            background_color: 'rgb(33, 31, 38)',
          },
          workbox: {
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
                urlPattern: /.*/i,
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
      ]
    : [];
