import { defineWorkerClient } from '@shared/lib/wrapWorker';
import { setupMainService, serviceId } from './setupMainService';
import Worker from './serviceWorker.ts?worker';

let worker: Worker | undefined;

const getWorker = () => {
  worker ??= new Worker();
  return worker;
};

export const useMainServiceClient = defineWorkerClient(getWorker, serviceId, setupMainService);

if (import.meta.env.DEV) {
  Object.assign(window, {
    useMainServiceClient,
  });
}
