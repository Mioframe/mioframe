import { defineWorkerClient } from '@shared/lib/wrapWorker';
import { setupMainService, serviceId } from './setupService';
import Worker from './serviceWorker.ts?worker';
// import workerUrl from './serviceWorker.ts?worker&url';

// const worker = import.meta.env.DEV
//   ? 
//     new Worker(new URL('./serviceWorker.ts', import.meta.url), {
//       type: 'module',
//     })
//   : 
//     new Worker(new URL('./serviceWorker.ts', import.meta.url), {
//       type: 'classic',
//     });
// const worker = new Worker(workerUrl);
const worker = new Worker();

export const useMainServiceClient = defineWorkerClient(
  worker,
  serviceId,
  setupMainService,
);
