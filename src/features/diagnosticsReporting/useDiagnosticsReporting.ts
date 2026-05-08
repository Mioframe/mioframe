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

      // oxlint-disable-next-line no-unnecessary-boolean-literal-compare -- strict boolean from watcher callback
      if (diagnosticsConsentRequested === true) {
        setSentryReportingState('disabled');
        clearQueuedHandledReports();
        return;
      }

      setSentryReportingState('unknown');
    },
    { immediate: true },
  );
};
