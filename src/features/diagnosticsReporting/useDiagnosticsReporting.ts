import { useLocalSettings } from '@entity/localSettings';
import {
  clearQueuedHandledReports,
  flushQueuedHandledReports,
} from '@shared/lib/reportHandledError';
import { clearQueuedDiagnosticEvents, flushQueuedDiagnosticEvents } from '@shared/lib/diagnostics';
import {
  ensureSentry,
  isSentryConfigured,
  setDiagnosticsRuntimeState,
} from '@shared/lib/setupSentry';
import { getOrCreateSentrySessionId } from '@shared/lib/sentry';
import { syncSentryStateToWorker } from '@shared/service/sentryWorkerSync';
import { watch } from 'vue';

/**
 * Keeps runtime diagnostics reporting aligned with the local diagnostics opt-in.
 * Syncs reporting state and session ID to the worker via sentryWorkerSync.
 */
export const useDiagnosticsReporting = () => {
  const { settings, isFinished } = useLocalSettings();
  let sequence = 0;

  watch(
    [
      isFinished,
      () => settings.value.diagnosticsEnabled,
      () => settings.value.diagnosticsConsentRequested,
    ],
    async ([hydrated, diagnosticsEnabled, diagnosticsConsentRequested]) => {
      const currentSequence = ++sequence;

      if (!hydrated) {
        return;
      }

      if (!isSentryConfigured()) {
        setDiagnosticsRuntimeState({
          sessionId: getOrCreateSentrySessionId(),
          reportingState: 'disabled',
        });
        syncSentryStateToWorker({
          sessionId: getOrCreateSentrySessionId(),
          reportingState: 'disabled',
        });
        clearQueuedHandledReports();
        clearQueuedDiagnosticEvents();
        return;
      }

      if (diagnosticsEnabled) {
        const sessionId = getOrCreateSentrySessionId();
        setDiagnosticsRuntimeState({ sessionId, reportingState: 'enabled' });
        syncSentryStateToWorker({ sessionId, reportingState: 'enabled' });
        await ensureSentry();

        if (currentSequence !== sequence) {
          return;
        }

        flushQueuedHandledReports();
        flushQueuedDiagnosticEvents();
        return;
      }

      // oxlint-disable-next-line no-unnecessary-boolean-literal-compare -- strict boolean from watcher callback
      if (diagnosticsConsentRequested === true) {
        const sessionId = getOrCreateSentrySessionId();
        setDiagnosticsRuntimeState({ sessionId, reportingState: 'disabled' });
        syncSentryStateToWorker({ sessionId, reportingState: 'disabled' });
        clearQueuedHandledReports();
        clearQueuedDiagnosticEvents();
        return;
      }

      const sessionId = getOrCreateSentrySessionId();
      setDiagnosticsRuntimeState({ sessionId, reportingState: 'unknown' });
      syncSentryStateToWorker({ sessionId, reportingState: 'unknown' });
    },
    { immediate: true },
  );
};
