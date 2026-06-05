import { defineWorkerClient } from '@shared/lib/wrapWorker';
import { setupMainService, serviceId } from './setupMainService';
import { registerMainThreadDiagnosticsService } from './diagnosticsService';
import Worker from './serviceWorker.ts?worker';

let worker: Worker | undefined;

const getWorker = () => {
  if (!worker) {
    worker = new Worker();
    registerMainThreadDiagnosticsService(worker);
  }
  return worker;
};

export const useMainServiceClient = defineWorkerClient(getWorker, serviceId, setupMainService);

if (import.meta.env.DEV) {
  Object.assign(window, {
    useMainServiceClient,
  });
}
