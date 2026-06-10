import type { SentryReportingState } from './sentryRuntimeState';
import { createBeforeBreadcrumb, createBeforeSend } from './sanitizeSentryEvent';

type SentryOptionsParams = {
  isVerbose: boolean;
  dsn: string;
  release: string | undefined;
  getReportingState: () => SentryReportingState;
};

/**
 * Builds shared Sentry `init` options for both main-thread and worker runtimes.
 * Static config (DSN, release, environment) is derived from build-time imports.
 * Dynamic reporting state is checked at event time via `getReportingState`.
 *
 * Main thread passes the optional `app` param in addition to these options.
 * Worker uses the same shared init options as the main runtime.
 * @param params - Options for building the Sentry init config.
 * @returns Sentry init options ready for `Sentry.init(...)`.
 */
export const createSentryOptions = ({
  isVerbose,
  dsn,
  release,
  getReportingState,
}: SentryOptionsParams) => ({
  dsn,
  ...(release ? { release } : {}),
  tracesSampleRate: 0,
  sendDefaultPii: false as const,
  maxBreadcrumbs: isVerbose ? 50 : 25,
  beforeBreadcrumb: createBeforeBreadcrumb(isVerbose, getReportingState),
  beforeSend: createBeforeSend({ isVerbose, getState: getReportingState }),
});
