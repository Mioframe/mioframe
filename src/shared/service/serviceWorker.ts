/// <reference lib="webworker" />

import { initializeWorkerSentry } from '@shared/lib/sentry/setupWorkerSentry';
import { setupMainService, serviceId } from './setupMainService';
import { defineWorkerService } from '@shared/lib/wrapWorker/defineWorkerService';
import { registerWorkerSentrySyncService } from './sentryWorkerSync';

declare const self: DedicatedWorkerGlobalScope;

// Initialize Sentry for the worker runtime using static config.
// Reporting state starts as `unknown` (events held) until the main thread
// calls applyRuntimeState via the sentryWorkerSync service.
initializeWorkerSentry();

// Register the state sync service so the main thread can push session ID
// and reporting state changes.
registerWorkerSentrySyncService(self);

defineWorkerService(serviceId, setupMainService);
