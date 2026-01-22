import type { PluginOption } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { VitePWA, cachePreset } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';
import { dependencies, devDependencies } from './package.json';
import basicSsl from '@vitejs/plugin-basic-ssl';
import TurboConsole from 'unplugin-turbo-console/vite';

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
              runtimeCaching: cachePreset,
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
