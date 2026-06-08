/// <reference lib="webworker" />

import { SENTRY_DSN, APP_BUILD_ID, APP_VERSION, DIAGNOSTICS_MODE } from '@shared/config';
import { registerSentryConfig } from '@shared/lib/diagnostics';
import { setupMainService, serviceId } from './setupMainService';
import { defineWorkerService } from '@shared/lib/wrapWorker/defineWorkerService';
import { registerWorkerSentrySyncService } from './sentryWorkerSync';

declare const self: DedicatedWorkerGlobalScope;

// Register the shared diagnostics runtime for the worker context.
// Static config is imported directly — the same path used by the main thread.
// Reporting state starts as `unknown` (events queued) until the main thread
// applies dynamic state via the sentryWorkerSync service.
registerSentryConfig({
  ...(SENTRY_DSN !== undefined && { dsn: SENTRY_DSN }),
  diagnosticsMode: DIAGNOSTICS_MODE,
  enabled: import.meta.env.PROD,
  release: APP_BUILD_ID || APP_VERSION,
});

// Register the state sync service so the main thread can push session ID
// and reporting state changes.
registerWorkerSentrySyncService(self);

defineWorkerService(serviceId, setupMainService);
