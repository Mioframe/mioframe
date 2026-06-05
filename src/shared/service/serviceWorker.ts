/// <reference lib="webworker" />

import { setupMainService, serviceId } from './setupMainService';
import { defineWorkerService } from '@shared/lib/wrapWorker/defineWorkerService';
import { setupWorkerDiagnosticsForwarder } from './diagnosticsService';

declare const self: DedicatedWorkerGlobalScope;

setupWorkerDiagnosticsForwarder(self);

defineWorkerService(serviceId, setupMainService);
