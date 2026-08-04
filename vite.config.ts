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
  resolveManagedAppUpdateChannel,
} from './config/plugins';

// Release-test-only escape hatch for the managed pinned application updates
// migration proof (tests/e2e/release/managedUpdatesMigration.spec.ts): builds
// the exact frozen pre-feature generateSW worker instead of the live managed
// controller. No normal dev/build/deploy path ever sets this env var, so this
// top-level dynamic import is never resolved outside that one release test —
// normal Vite config carries no static dependency on the frozen test fixture
// (see config/viteConfigFixtureImport.test.ts). Resolved once, at module
// scope, rather than inside `defineConfig`'s callback, so the callback stays
// a plain synchronous `UserConfigFnObject` for Vite's config type inference.
const legacyPwaPluginsModule =
  process.env.RELEASE_TEST_LEGACY_PWA_FIXTURE === '1'
    ? await import('./tests/e2e/release/fixtures/legacyGeneratedWorkboxPwaConfig')
    : undefined;

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
  const resolvePwaPlugins = legacyPwaPluginsModule?.getLegacyPwaPlugins ?? getPwaPlugins;
  const pwaPlugins = isStorybookBuild
    ? []
    : resolvePwaPlugins({
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
  // Never derived independently of pwaPlugins' own gating: reuses the exact
  // same enablement and channel-classification decision (see
  // resolveManagedAppUpdateChannel), so this can never disagree with
  // whether a managed controller worker was actually emitted.
  const managedAppUpdateChannel = isStorybookBuild
    ? undefined
    : resolveManagedAppUpdateChannel({
        mode,
        isPreview: isPreviewBuild,
        disablePwa: isDisablePwa,
        channel: releaseChannel,
        channelId: releaseChannelId,
      });

  // Managed stable/develop publication derives one canonical UTC committer
  // timestamp per deployment job and passes it here explicitly, so the same
  // value reaches Vite, release descriptor generation, and deployment.json
  // (see docs/managed-pinned-updates.md, "Deterministic build inputs").
  // Every other build (dev, PR preview, manual branch, Storybook) has no
  // such canonical value and keeps using the actual build wall-clock time.
  const explicitBuildDate = env.VITE_BUILD_DATE || process.env.VITE_BUILD_DATE;
  const buildDate = isStorybookBuild
    ? toolingConfig.storybook.deterministicBuildDate
    : explicitBuildDate || new Date().toISOString();
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
      __MANAGED_APP_UPDATE_CHANNEL__:
        managedAppUpdateChannel === undefined
          ? 'undefined'
          : JSON.stringify(managedAppUpdateChannel),
    },
  };
});
