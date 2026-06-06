import { useLocalSettings } from '@entity/localSettings';
import {
  clearQueuedHandledReports,
  flushQueuedHandledReports,
} from '@shared/lib/reportHandledError';
import { clearQueuedDiagnosticEvents, flushQueuedDiagnosticEvents } from '@shared/lib/diagnostics';
import {
  ensureSentry,
  isSentryConfigured,
  setSentryReportingState,
  getSentryReportingState,
} from '@shared/lib/setupSentry';
import { getOrCreateSentrySessionId } from '@shared/lib/sentry';
import { syncSentryStateToWorker } from '@shared/service/sentryWorkerSync';
import { watch } from 'vue';

/**
 * Keeps runtime Sentry reporting aligned with the local diagnostics opt-in.
 * Also syncs reporting state and session ID to the worker Sentry instance.
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
        setSentryReportingState('disabled');
        syncSentryStateToWorker({
          sessionId: getOrCreateSentrySessionId(),
          reportingState: 'disabled',
        });
        clearQueuedHandledReports();
        clearQueuedDiagnosticEvents();
        return;
      }

      if (diagnosticsEnabled) {
        setSentryReportingState('enabled');
        syncSentryStateToWorker({
          sessionId: getOrCreateSentrySessionId(),
          reportingState: 'enabled',
        });
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
        setSentryReportingState('disabled');
        syncSentryStateToWorker({
          sessionId: getOrCreateSentrySessionId(),
          reportingState: 'disabled',
        });
        clearQueuedHandledReports();
        clearQueuedDiagnosticEvents();
        return;
      }

      setSentryReportingState('unknown');
      syncSentryStateToWorker({
        sessionId: getOrCreateSentrySessionId(),
        reportingState: getSentryReportingState(),
      });
    },
    { immediate: true },
  );
};
