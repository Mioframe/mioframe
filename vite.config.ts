import type { PluginOption } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import { dependencies, devDependencies } from './package.json';
import { getResolveAlias } from './config/alias';
import {
  getBaseVitePlugins,
  getBaseWorkerPlugins,
  getPwaPlugins,
  getSentryPlugins,
  getSslPlugins,
} from './config/plugins';

// https://vitejs.dev/config/
export default defineConfig(({ mode, isPreview }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isPreviewBuild = !!isPreview;

  const sslPlugins = getSslPlugins({ mode, isPreview: isPreviewBuild });
  const pwaPlugins = getPwaPlugins({ mode, isPreview: isPreviewBuild });
  const sentryPlugins = getSentryPlugins({
    mode,
    isPreview: isPreviewBuild,
    authToken: env.SENTRY_AUTH_TOKEN,
  });

  const dateNow = new Date().toISOString();

  console.log('\n__BUILD_DATE__:', dateNow);

  return {
    base: env.BASE_URL,
    plugins: [...getBaseVitePlugins(), ...pwaPlugins, ...sslPlugins, ...sentryPlugins],
    worker: {
      format: 'es',
      plugins: (): PluginOption[] => [...getBaseWorkerPlugins(), ...sentryPlugins],
    },
    server: {
      host: true,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    resolve: {
      alias: getResolveAlias(),
    },
    build: {
      sourcemap: !!sentryPlugins.length,
      assetsDir: 'assets',
      minify: mode === 'production' || isPreviewBuild ? 'terser' : false,
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
