import { useLocalSettings } from '@entity/localSettings';
import {
  getOrCreateSentrySessionId,
  isSentryConfigured,
  setDiagnosticsRuntimeState,
} from '@shared/lib/diagnostics';
import { ensureSentry } from '@shared/lib/diagnostics/sentryRuntime';
import { syncSentryStateToWorker } from '@shared/service/sentryWorkerSync';
import { watch } from 'vue';

/**
 * Keeps runtime diagnostics reporting aligned with the local diagnostics opt-in.
 * Syncs reporting state and session ID to the worker via sentryWorkerSync.
 */
export const useDiagnosticsReporting = () => {
  const { settings, isFinished } = useLocalSettings();
  let sequence = 0;

  const applyRuntimeState = (reportingState: 'unknown' | 'enabled' | 'disabled') => {
    const state = {
      sessionId: getOrCreateSentrySessionId(),
      reportingState,
    } as const;

    setDiagnosticsRuntimeState(state);
    syncSentryStateToWorker(state);
  };

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
        applyRuntimeState('disabled');
        return;
      }

      if (diagnosticsEnabled) {
        applyRuntimeState('enabled');
        await ensureSentry();

        if (currentSequence !== sequence) {
          return;
        }
        return;
      }

      // oxlint-disable-next-line no-unnecessary-boolean-literal-compare -- strict boolean from watcher callback
      if (diagnosticsConsentRequested === true) {
        applyRuntimeState('disabled');
        return;
      }

      applyRuntimeState('unknown');
    },
    { immediate: true },
  );
};
