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
  // Resolved once: `releaseId` is the single source for both `__RELEASE_ID__` and `__BUILD_ID__`.
  // A stable release's `buildId` is always the short form of its own `releaseId` (see
  // `scripts/pages/lib/stableRelease.mjs`'s identical `releaseId.slice(0, 7)` rule) — it must never
  // be derived independently from a raw environment variable, or the worker and the publisher can
  // embed two different `buildId` values for the exact same `releaseId`.
  const releaseId =
    env.VITE_RELEASE_ID || process.env.VITE_RELEASE_ID || process.env.GITHUB_SHA || '';
  const buildId = releaseId.slice(0, 7);
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
    : env.VITE_BUILD_DATE || new Date().toISOString();
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
      __RELEASE_ID__: JSON.stringify(releaseId),
      // Patched in-place to the real allocated sequence by
      // `scripts/pages/lib/stableRelease.mjs` after publication allocates it (the sequence is
      // only known after `vite build`, from the retained-release tree). An un-patched build
      // (local/dev/branch/PR) keeps this placeholder, which safely fails release-identity
      // validation in `sw.ts` instead of being trusted as a real sequence.
      __RELEASE_SEQUENCE__: JSON.stringify(toolingConfig.release.releaseSequencePlaceholder),
      __RELEASE_CHANNEL__: JSON.stringify(releaseChannel),
      __DIAGNOSTICS_MODE__: JSON.stringify(isPreviewBuild ? 'preview' : 'production'),
      // Gates a narrow release-only browser-test seam (see `MainApp.vue`); set only by the
      // release e2e fixture build (`scripts/release/managedStableFixture.mjs`), never in the real
      // stable/branch/PR deploy pipelines.
      __RELEASE_TEST_HOOKS__: JSON.stringify(
        env.VITE_RELEASE_TEST_HOOKS === '1' || process.env.VITE_RELEASE_TEST_HOOKS === '1',
      ),
    },
  };
});
