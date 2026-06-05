import { createClient, createService } from '@shared/lib/proxyService';
import type { Provider } from '@shared/lib/proxyService';
import { transformers } from '@shared/lib/wrapWorker/workerTransformerMap';
import {
  reportDiagnosticEvent,
  setDiagnosticEventForwarder,
  setBreadcrumbForwarder,
  addDiagnosticBreadcrumb,
} from '@shared/lib/diagnostics';
import type { DiagnosticEvent, DiagnosticBreadcrumb } from '@shared/lib/diagnostics';

export const DIAGNOSTICS_SERVICE_ID = 'diagnosticsReporter';

type DiagnosticsServiceApi = {
  reportDiagnosticEvent: (event: DiagnosticEvent) => void;
  addDiagnosticBreadcrumb: (breadcrumb: DiagnosticBreadcrumb) => void;
};

/**
 * Registers a main-thread diagnostics service on the given worker.
 * The worker can call `reportDiagnosticEvent` and `addDiagnosticBreadcrumb` through
 * this service, keeping Sentry delivery centralised on the main thread.
 * Call immediately after constructing the worker so it is ready before the
 * worker's first diagnostic call.
 * @param worker - The Worker instance to register the diagnostics service on.
 */
export const registerMainThreadDiagnosticsService = (worker: Worker): void => {
  createService(worker, DIAGNOSTICS_SERVICE_ID, transformers, () => ({
    reportDiagnosticEvent,
    addDiagnosticBreadcrumb,
  }));
};

/**
 * Sets up proxy-based forwarding of diagnostic events and breadcrumbs from the
 * worker context to the main-thread diagnostics service.
 * Must be called once at the worker entry point before any diagnostic calls are made.
 * Forwarding failures are fire-and-forget and never propagate into product code.
 * @param workerSelf - The dedicated worker global scope (`self`), passed explicitly to avoid module-level type conflicts.
 */
export const setupWorkerDiagnosticsForwarder = (workerSelf: Provider): void => {
  const client = createClient<DiagnosticsServiceApi>(
    workerSelf,
    DIAGNOSTICS_SERVICE_ID,
    transformers,
  );

  setDiagnosticEventForwarder((event) => {
    client.reportDiagnosticEvent(event).catch(() => {
      // Fire-and-forget: forwarding failures must never propagate into product code.
    });
  });

  setBreadcrumbForwarder((breadcrumb) => {
    client.addDiagnosticBreadcrumb(breadcrumb).catch(() => {
      // Fire-and-forget: forwarding failures must never propagate into product code.
    });
  });
};
