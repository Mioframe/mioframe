import { defineWorkerClient } from '@shared/lib/wrapWorker';
import { setupMainService, serviceId } from './setupMainService';
import Worker from './serviceWorker.ts?worker';

const worker = new Worker();

export const useMainServiceClient = defineWorkerClient(worker, serviceId, setupMainService);

if (import.meta.env.DEV) {
  Object.assign(window, {
    useMainServiceClient,
  });
}
