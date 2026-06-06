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
   */
  release?: string | undefined;
};

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
        }),
      ]
    : [];
