/// <reference lib="webworker" />

import { setupMainService, serviceId } from './setupMainService';
import { defineWorkerService } from '@shared/lib/wrapWorker/defineWorkerService';
import { setDiagnosticEventForwarder } from '@shared/lib/diagnostics';

declare const self: DedicatedWorkerGlobalScope;

setDiagnosticEventForwarder((event) => {
  self.postMessage({ type: 'diagnosticForward', event });
});

defineWorkerService(serviceId, setupMainService);
