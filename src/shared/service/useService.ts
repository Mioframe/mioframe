import { defineWorkerClient } from '@shared/lib/wrapWorker';
import { setupMainService, serviceId } from './setupMainService';
import { initSentryWorkerBridge } from './sentryWorkerSync';
import Worker from './serviceWorker.ts?worker';

let worker: Worker | undefined;

/**
 * Resolve the singleton background worker instance. Exported only so the release-only test seam
 * (see `MainApp.vue`) can attach a second, independent RPC client to the exact same worker — and
 * therefore the same `useFileSystemService()` VFS singleton — rather than spinning up an unrelated
 * worker of its own.
 * @returns The singleton background worker.
 */
export const getWorker = () => {
  if (!worker) {
    worker = new Worker();
    initSentryWorkerBridge(worker);
  }
  return worker;
};

export const useMainServiceClient = defineWorkerClient(getWorker, serviceId, setupMainService);

if (import.meta.env.DEV) {
  Object.assign(window, {
    useMainServiceClient,
  });
}
