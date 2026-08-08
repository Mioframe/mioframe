import { useLocalSettings } from '@entity/localSettings';
import { deriveDiagnosticsPolicy } from '@shared/lib/diagnostics';
import { applyDiagnosticsPolicy } from '@shared/serviceClient/diagnostics';
import { watch } from 'vue';

/**
 * Keeps runtime diagnostics reporting aligned with the local diagnostics opt-in.
 * Applies the derived policy to the main-thread runtime and worker via `applyDiagnosticsPolicy`.
 */
export const useDiagnosticsReporting = () => {
  const { settings, isFinished } = useLocalSettings();

  watch(
    [
      isFinished,
      () => settings.value.diagnosticsEnabled,
      () => settings.value.diagnosticsConsentRequested,
    ],
    ([hydrated, diagnosticsEnabled, diagnosticsConsentRequested]) => {
      if (!hydrated) {
        return;
      }

      void applyDiagnosticsPolicy(
        deriveDiagnosticsPolicy({ diagnosticsEnabled, diagnosticsConsentRequested }),
      );
    },
    { immediate: true },
  );
};
