import { useLocalSettings } from '@entity/localSettings';
import {
  applyDiagnosticsRuntimeState,
  getOrCreateSentrySessionId,
  isSentryConfigured,
} from '@shared/lib/diagnostics';
import type { SentryRuntimeState } from '@shared/lib/diagnostics';
import { syncSentryStateToWorker } from '@shared/service/sentryWorkerSync';
import { watch } from 'vue';

/**
 * Keeps runtime diagnostics reporting aligned with the local diagnostics opt-in.
 * Syncs reporting state and session ID to the worker via sentryWorkerSync.
 */
export const useDiagnosticsReporting = () => {
  const { settings, isFinished } = useLocalSettings();
  let sequence = 0;

  const buildState = (
    reportingState: SentryRuntimeState['reportingState'],
  ): SentryRuntimeState => ({
    sessionId: getOrCreateSentrySessionId(),
    reportingState,
  });

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
        const state = buildState('disabled');
        syncSentryStateToWorker(state);
        void applyDiagnosticsRuntimeState(state);
        return;
      }

      if (diagnosticsEnabled) {
        const state = buildState('enabled');
        syncSentryStateToWorker(state);
        await applyDiagnosticsRuntimeState(state);

        if (currentSequence !== sequence) {
          return;
        }
        return;
      }

      // oxlint-disable-next-line no-unnecessary-boolean-literal-compare -- strict boolean from watcher callback
      if (diagnosticsConsentRequested === true) {
        const state = buildState('disabled');
        syncSentryStateToWorker(state);
        void applyDiagnosticsRuntimeState(state);
        return;
      }

      const state = buildState('unknown');
      syncSentryStateToWorker(state);
      void applyDiagnosticsRuntimeState(state);
    },
    { immediate: true },
  );
};
