import { createClient, createService } from '@shared/lib/proxyService';
import type { Provider } from '@shared/lib/proxyService';
import { transformers } from '@shared/lib/wrapWorker/workerTransformerMap';
import { applyWorkerSentryRuntimeState } from '@shared/lib/sentry/setupWorkerSentry';
import type { SentryRuntimeState } from '@shared/lib/sentry/sentryRuntimeState';

export const SENTRY_SYNC_SERVICE_ID = 'sentrySyncService';

type SentrySyncApi = {
  applyRuntimeState: (state: SentryRuntimeState) => void;
};

let syncClient: ReturnType<typeof createClient<SentrySyncApi>> | undefined;

/**
 * Registers the worker-side Sentry state sync service.
 * Must be called once at the worker entry point so the main thread can
 * push session ID and reporting state changes.
 * @param workerSelf - The dedicated worker global scope (`self`).
 */
export const registerWorkerSentrySyncService = (workerSelf: Provider): void => {
  createService(workerSelf, SENTRY_SYNC_SERVICE_ID, transformers, () => ({
    applyRuntimeState: applyWorkerSentryRuntimeState,
  }));
};

/**
 * Initializes the main-thread client used to push Sentry runtime state to the worker.
 * Must be called once after the worker is created.
 * @param worker - The worker instance.
 */
export const initSentryWorkerBridge = (worker: Provider): void => {
  syncClient = createClient<SentrySyncApi>(worker, SENTRY_SYNC_SERVICE_ID, transformers);
};

/**
 * Pushes current Sentry runtime state (session ID + reporting state) from the main
 * thread to the worker. Fire-and-forget — never throws into product code.
 * @param state - The state to sync to the worker.
 */
export const syncSentryStateToWorker = (state: SentryRuntimeState): void => {
  if (!syncClient) return;

  syncClient.applyRuntimeState(state).catch(() => {
    // Fire-and-forget: state sync failures must never propagate into product code.
  });
};
