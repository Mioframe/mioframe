import { applyDiagnosticsRuntimeState, getOrCreateSentrySessionId } from '@shared/lib/diagnostics';
import { syncSentryStateToWorker } from '@shared/service/sentryWorkerSync';

/** App-level diagnostics reporting policy derived from user consent. */
export type DiagnosticsPolicy = 'enabled' | 'disabled' | 'unknown';

/**
 * Applies a diagnostics reporting policy to both the main-thread Sentry runtime and the worker.
 * The feature layer calls this once per consent change and does not need to know about
 * session IDs, worker synchronization, or runtime state internals.
 *
 * Fire-and-forget for `disabled` and `unknown`; awaitable for `enabled` to ensure
 * Sentry finishes initializing before queue-flush side effects run.
 * @param policy - Current diagnostics reporting policy derived from user consent.
 */
export const applyDiagnosticsPolicy = async (policy: DiagnosticsPolicy): Promise<void> => {
  const state = {
    sessionId: getOrCreateSentrySessionId(),
    reportingState: policy,
  };
  syncSentryStateToWorker(state);
  await applyDiagnosticsRuntimeState(state);
};
