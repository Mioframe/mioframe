import { defineConfig } from 'vite';
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
  const sslPlugins = mode === 'development' || isPreview ? [basicSsl()] : [];
  const pwaPlugins =
    mode === 'production' || isPreview
      ? [
          VitePWA({
            manifest: {
              theme_color: undefined,
              background_color: undefined,
            },
            workbox: {
              runtimeCaching: cachePreset,
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
            authToken: process.env.SENTRY_AUTH_TOKEN,
          }),
        ]
      : [];

  return {
    base: '',
    plugins: [
      wasm(),
      topLevelAwait(),
      vue(),
      TurboConsole(),
      ...pwaPlugins,
      ...sslPlugins,
      ...sentryPlugins,
    ],
    server: {
      host: true,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
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
      },
    },
    build: {
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
            // Перебираем зависимости
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
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    },
  };
});
