import { useLocalSettings } from '@entity/localSettings';
import { applyDiagnosticsPolicy } from '@shared/service';
import { watch } from 'vue';

/**
 * Keeps runtime diagnostics reporting aligned with the local diagnostics opt-in.
 * Applies the derived policy to the main-thread runtime and worker via `applyDiagnosticsPolicy`.
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

      if (diagnosticsEnabled) {
        await applyDiagnosticsPolicy('enabled');

        if (currentSequence !== sequence) {
          return;
        }
        return;
      }

      // oxlint-disable-next-line no-unnecessary-boolean-literal-compare -- strict boolean from watcher callback
      if (diagnosticsConsentRequested === true) {
        void applyDiagnosticsPolicy('disabled');
        return;
      }

      void applyDiagnosticsPolicy('unknown');
    },
    { immediate: true },
  );
};
