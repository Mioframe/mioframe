import { useLocalSettings } from '@entity/localSettings';
import {
  ensureSentry,
  isSentryReportingConfigured,
  setSentryReportingEnabled,
} from '@shared/lib/setupSentry';
import { watch } from 'vue';

/**
 * Keeps runtime Sentry reporting aligned with the local diagnostics opt-in.
 */
export const useDiagnosticsReporting = () => {
  const { settings } = useLocalSettings();

  watch(
    () => settings.value.diagnosticsEnabled,
    async (diagnosticsEnabled) => {
      const reportingEnabled = diagnosticsEnabled && isSentryReportingConfigured();

      setSentryReportingEnabled(reportingEnabled);

      if (reportingEnabled) {
        await ensureSentry();
      }
    },
    { immediate: true },
  );
};
