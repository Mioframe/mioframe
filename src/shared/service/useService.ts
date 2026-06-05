import { defineWorkerClient } from '@shared/lib/wrapWorker';
import { setupMainService, serviceId } from './setupMainService';
import { reportDiagnosticEvent } from '@shared/lib/diagnostics';
import type { DiagnosticEvent } from '@shared/lib/diagnostics';
import Worker from './serviceWorker.ts?worker';

type DiagnosticForwardMessage = { type: 'diagnosticForward'; event: DiagnosticEvent };

const isDiagnosticForwardMessage = (data: unknown): data is DiagnosticForwardMessage => {
  if (typeof data !== 'object' || data === null) return false;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- runtime type guard on unknown postMessage data; no other way to access properties after object narrowing
  const record = data as Record<string, unknown>;
  return (
    record['type'] === 'diagnosticForward' &&
    typeof record['event'] === 'object' &&
    record['event'] !== null
  );
};

let worker: Worker | undefined;

const getWorker = () => {
  if (!worker) {
    worker = new Worker();
    worker.addEventListener('message', (e: MessageEvent<unknown>) => {
      try {
        if (isDiagnosticForwardMessage(e.data)) {
          reportDiagnosticEvent(e.data.event);
        }
      } catch {
        // Fire-and-forget: forwarding failures must never propagate into product code.
      }
    });
  }
  return worker;
};

export const useMainServiceClient = defineWorkerClient(getWorker, serviceId, setupMainService);

if (import.meta.env.DEV) {
  Object.assign(window, {
    useMainServiceClient,
  });
}
