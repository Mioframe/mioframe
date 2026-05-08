import { useLocalSettings } from '@entity/localSettings';
import {
  clearQueuedHandledReports,
  flushQueuedHandledReports,
} from '@shared/lib/reportHandledError';
import { ensureSentry, isSentryConfigured, setSentryReportingState } from '@shared/lib/setupSentry';
import { watch } from 'vue';

/**
 * Keeps runtime Sentry reporting aligned with the local diagnostics opt-in.
 */
export const useDiagnosticsReporting = () => {
  const { settings, isFinished } = useLocalSettings();
  let sequence = 0;

  watch(
    [isFinished, () => settings.value.diagnosticsEnabled],
    async ([hydrated, diagnosticsEnabled]) => {
      const currentSequence = ++sequence;

      if (!hydrated) {
        return;
      }

      if (!isSentryConfigured()) {
        setSentryReportingState('disabled');
        clearQueuedHandledReports();
        return;
      }

      if (diagnosticsEnabled) {
        setSentryReportingState('enabled');
        await ensureSentry();

        if (currentSequence !== sequence) {
          return;
        }

        flushQueuedHandledReports();
        return;
      }

      setSentryReportingState('disabled');
      clearQueuedHandledReports();
    },
    { immediate: true },
  );
};
