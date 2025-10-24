import { defineWorkerClient } from '@shared/lib/wrapWorker';
import { setupMainService, serviceId } from './setupService';
import Worker from './serviceWorker.ts?worker';

const worker = new Worker();

export const useMainServiceClient = defineWorkerClient(
  worker,
  serviceId,
  setupMainService,
);
