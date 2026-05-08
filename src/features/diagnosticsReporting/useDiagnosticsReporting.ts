import { useLocalSettings } from '@entity/localSettings';
import {
  clearQueuedHandledReports,
  flushQueuedHandledReports,
} from '@shared/lib/reportHandledError';
import {
  ensureSentry,
  isSentryConfigured,
  setSentryReportingEnabled,
} from '@shared/lib/setupSentry';
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
        setSentryReportingEnabled(false);
        clearQueuedHandledReports();
        return;
      }

      if (diagnosticsEnabled) {
        setSentryReportingEnabled(true);
        await ensureSentry();

        if (currentSequence !== sequence) {
          return;
        }

        flushQueuedHandledReports();
        return;
      }

      setSentryReportingEnabled(false);
      clearQueuedHandledReports();
    },
    { immediate: true },
  );
};
