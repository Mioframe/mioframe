import type { SentryReportingState } from './sentryRuntimeState';
import { createBeforeSend } from './sanitizeSentryEvent';

type SentryOptionsParams = {
  dsn: string;
  release: string | undefined;
  getReportingState: () => SentryReportingState;
  /**
   * Pass `false` to disable all default integrations.
   * Required for worker contexts where DOM integrations would throw.
   */
  defaultIntegrations?: false;
};

/**
 * Builds shared Sentry `init` options for both main-thread and worker runtimes.
 * Static config (DSN, release, environment) is derived from build-time imports.
 * Dynamic reporting state is checked at event time via `getReportingState`.
 *
 * Main thread passes the optional `app` param in addition to these options.
 * Worker passes `defaultIntegrations: false` to suppress DOM-dependent integrations.
 * @param params - Options for building the Sentry init config.
 * @returns Sentry init options ready for `Sentry.init(...)`.
 */
export const createSentryOptions = ({
  dsn,
  release,
  getReportingState,
  defaultIntegrations,
}: SentryOptionsParams) => ({
  dsn,
  ...(release ? { release } : {}),
  tracesSampleRate: 0,
  sendDefaultPii: false as const,
  ...(defaultIntegrations === false ? { defaultIntegrations: false as const } : {}),
  beforeSend: createBeforeSend(getReportingState),
});
