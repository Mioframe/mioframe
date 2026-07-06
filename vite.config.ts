import browserslistToEsbuild from 'browserslist-to-esbuild';
import type { PluginOption } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import { dependencies, devDependencies, version } from './package.json';
import toolingConfig from './config/tooling.json' with { type: 'json' };
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
  const buildTarget = browserslistToEsbuild(undefined, { path: process.cwd() });
  const env = loadEnv(mode, process.cwd(), '');
  const isPreviewBuild = !!isPreview;
  const isStorybookBuild = process.env.APP_STORYBOOK === '1';
  const isDisablePwa = env.VITE_DISABLE_PWA === '1' || process.env.VITE_DISABLE_PWA === '1';
  const buildId = env.VITE_BUILD_ID || process.env.VITE_BUILD_ID || process.env.GITHUB_SHA || '';
  const releaseChannel = env.VITE_RELEASE_CHANNEL === 'branch' ? 'branch' : 'stable';
  const releaseChannelId = env.VITE_RELEASE_CHANNEL_ID || undefined;
  const sslPlugins = isStorybookBuild ? [] : getSslPlugins({ mode, isPreview: isPreviewBuild });
  const pwaPlugins = isStorybookBuild
    ? []
    : getPwaPlugins({
        base: env.BASE_URL,
        mode,
        isPreview: isPreviewBuild,
        disablePwa: isDisablePwa,
        channel: releaseChannel,
        channelId: releaseChannelId,
      });
  const sentryPlugins = isStorybookBuild
    ? []
    : getSentryPlugins({
        mode,
        isPreview: isPreviewBuild,
        authToken: env.SENTRY_AUTH_TOKEN,
        release: buildId || undefined,
      });

  const buildDate = isStorybookBuild
    ? toolingConfig.storybook.deterministicBuildDate
    : new Date().toISOString();
  const dependencyNames = Object.keys({
    ...dependencies,
    ...devDependencies,
  });

  if (!isStorybookBuild) {
    console.log('\n__BUILD_DATE__:', buildDate);
  }

  return {
    base: env.BASE_URL,
    plugins: [...getBaseVitePlugins(), ...pwaPlugins, ...sslPlugins, ...sentryPlugins],
    worker: {
      format: 'es',
      plugins: (): PluginOption[] => [...getBaseWorkerPlugins(), ...sentryPlugins],
    },
    server: {
      host: true,
      watch: {
        ignored: [
          '**/.git/**',
          '**/.stryker-tmp/**',
          '**/coverage/**',
          '**/dist/**',
          '**/storybook-static/**',
          '**/playwright-report/**',
          '**/test-results/**',
        ],
      },
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    resolve: {
      alias: getResolveAlias(),
    },
    build: {
      target: buildTarget,
      sourcemap: sentryPlugins.length ? 'hidden' : false,
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
            for (const dependencyName of dependencyNames) {
              if (id.includes(`/${dependencyName}`)) {
                return `vendor/${dependencyName}`;
              }
            }
          },
        },
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(version),
      __BUILD_DATE__: JSON.stringify(buildDate),
      __BUILD_ID__: JSON.stringify(buildId),
      __DIAGNOSTICS_MODE__: JSON.stringify(isPreviewBuild ? 'preview' : 'production'),
    },
  };
});
