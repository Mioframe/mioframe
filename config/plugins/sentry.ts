import type { PluginOption } from 'vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';

type GetSentryPluginsParams = {
  authToken: string | undefined;
  isPreview: boolean;
  mode: string;
  /**
   * Release string that must match what the runtime sends in Sentry events.
   * Derived from `VITE_BUILD_ID` / `GITHUB_SHA` in `vite.config.ts`.
   * When empty, the plugin falls back to auto-detection (git SHA).
   *
   * Required Sentry token permissions: Project: Read & Write, Release: Admin.
   * The plugin does not upload source maps in dev/watch mode; use a
   * production or preview build to verify source map uploads in Sentry.
   */
  release?: string | undefined;
};

/**
 * Returns the Sentry Vite plugin for production and preview builds only.
 * Keeps release and sourcemap upload config aligned with the runtime build id.
 * @param params - Build mode, preview flag, auth token, and optional release name.
 * @returns Sentry Vite plugin list appended last by `vite.config.ts`.
 */
export const getSentryPlugins = ({
  authToken,
  isPreview,
  mode,
  release,
}: GetSentryPluginsParams): PluginOption[] =>
  mode === 'production' || isPreview
    ? [
        sentryVitePlugin({
          org: 'vb-ak',
          project: 'mioframe',
          authToken,
          telemetry: false,
          ...(release ? { release: { name: release } } : {}),
          sourcemaps: {
            // Delete uploaded .map files from the output directory so they are
            // not served publicly. Matches app and worker source maps.
            filesToDeleteAfterUpload: ['./dist/**/*.map'],
          },
        }),
      ]
    : [];
