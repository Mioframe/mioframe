import type { PluginOption } from 'vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';

type GetSentryPluginsParams = {
  authToken: string | undefined;
  isPreview: boolean;
  mode: string;
};

export const getSentryPlugins = ({
  authToken,
  isPreview,
  mode,
}: GetSentryPluginsParams): PluginOption[] =>
  mode === 'production' || isPreview
    ? [
        sentryVitePlugin({
          org: 'vb-ak',
          project: 'mioframe',
          authToken,
          telemetry: false,
        }),
      ]
    : [];
