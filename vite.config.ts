import type { PluginOption } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';
import { dependencies, devDependencies } from './package.json';
import basicSsl from '@vitejs/plugin-basic-ssl';
import TurboConsole from 'unplugin-turbo-console/vite';

const daysToSeconds = (days: number) => 24 * 60 * 60 * days;

// https://vitejs.dev/config/
export default defineConfig(({ mode, isPreview }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const sslPlugins = mode === 'development' || isPreview ? [basicSsl()] : [];
  const pwaPlugins =
    mode === 'production' || isPreview
      ? [
          VitePWA({
            manifest: {
              theme_color: '#000',
              background_color: '#000',
            },
            workbox: {
              runtimeCaching: [
                {
                  urlPattern:
                    /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
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

  const sentryPlugins =
    mode === 'production' || isPreview
      ? [
          sentryVitePlugin({
            org: 'vb-ak',
            project: 'beaver',
            authToken: env.SENTRY_AUTH_TOKEN,
            telemetry: false,
          }),
        ]
      : [];

  const dateNow = new Date().toISOString();

  console.log('\n__BUILD_DATE__:', dateNow);

  return {
    base: env.BASE_URL,
    plugins: [
      wasm(),
      topLevelAwait(),
      vue(),
      TurboConsole(),
      ...pwaPlugins,
      ...sslPlugins,
      ...sentryPlugins,
    ],
    worker: {
      format: 'es',
      plugins: (): PluginOption[] => [
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- vite-plugin-wasm don't have types
        wasm() as PluginOption,
        topLevelAwait(),
        vue(),
        TurboConsole(),
        ...sentryPlugins,
      ],
    },
    server: {
      host: true,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
        '@feature': fileURLToPath(new URL('./src/features', import.meta.url)),
        '@entity': fileURLToPath(new URL('./src/entities', import.meta.url)),
        '@widget': fileURLToPath(new URL('./src/widgets', import.meta.url)),
        '@page': fileURLToPath(new URL('./src/pages', import.meta.url)),
      },
    },
    build: {
      sourcemap: !!sentryPlugins.length,
      assetsDir: 'assets',
      minify: mode === 'production' || isPreview ? 'terser' : false,
      terserOptions: {
        compress: {
          booleans_as_integers: false,
          ecma: 2020,
          module: true,
          passes: 2,
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            for (const name of Object.keys({
              ...dependencies,
              ...devDependencies,
            })) {
              if (id.includes(`/${name}`)) {
                return `vendor/${name}`;
              }
            }
          },
        },
      },
    },
    define: {
      __BUILD_DATE__: JSON.stringify(dateNow),
    },
  };
});
