import * as Sentry from '@sentry/vue';
import type { App } from 'vue';

export const setupSentry = (app: App<Element>, dsn: string) => {
  Sentry.init({
    app,
    dsn,
    integrations: [Sentry.replayIntegration()],
    tracesSampleRate: 0.7,
    replaysSessionSampleRate: 0.7,
    replaysOnErrorSampleRate: 1.0,
  });
};
