import { SENTRY_DSN, APP_BUILD_ID, APP_VERSION } from '@shared/config';
import { createSentryOptions } from './createSentryOptions';
import type { SentryReportingState, SentryRuntimeState } from './sentryRuntimeState';

let workerReportingState: SentryReportingState = 'unknown';
let sentryInitialized = false;
let sentryModule: typeof import('@sentry/vue') | undefined;

const getWorkerReportingState = () => workerReportingState;

/**
 * Initializes the worker's own Sentry SDK instance at startup.
 * Must be called once at the worker entry point.
 * Uses static build config (DSN, release) imported directly.
 * Reporting state starts as `unknown` (events dropped) until
 * `applyWorkerSentryRuntimeState` is called from main.
 */
export const initializeWorkerSentry = (): void => {
  const dsn = SENTRY_DSN;

  if (sentryInitialized || !dsn) {
    return;
  }

  const release = APP_BUILD_ID || APP_VERSION;

  void import('@sentry/vue').then((sentry) => {
    sentryModule = sentry;

    const options = createSentryOptions({
      dsn,
      release,
      getReportingState: getWorkerReportingState,
      defaultIntegrations: false,
    });

    sentry.init(options);
    sentryInitialized = true;
  });
};

/**
 * Applies dynamic runtime state received from the main thread.
 * Updates the worker Sentry reporting state and session user identity.
 * Safe to call before `initializeWorkerSentry` completes — state is
 * stored and applied immediately when the SDK becomes available.
 * @param state - Runtime state synced from main thread.
 */
export const applyWorkerSentryRuntimeState = (state: SentryRuntimeState): void => {
  workerReportingState = state.reportingState;

  if (sentryModule && sentryInitialized) {
    if (state.reportingState === 'enabled') {
      sentryModule.setUser({ id: state.sessionId });
    } else {
      sentryModule.setUser(null);
    }
  }
};
