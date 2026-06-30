import { computed } from 'vue';
import { APP_VERSION } from '@shared/config';
import { useLocalSettings } from './useLocalSettings';

/**
 * Returns the local diagnostics settings, their readiness, and the only supported mutation
 * actions.
 * @returns Diagnostics settings state, readiness, and user-driven actions.
 */
export const useDiagnosticsSettings = () => {
  const { settings, isFinished } = useLocalSettings();

  const isDiagnosticsSettingsReady = computed(() => isFinished.value);

  const diagnosticsEnabled = computed(() => settings.value.diagnosticsEnabled);
  const diagnosticsConsentRequested = computed(() => settings.value.diagnosticsConsentRequested);
  const isDiagnosticsErrorPromptDismissed = computed(
    () => settings.value.diagnosticsErrorPromptDismissedVersion === APP_VERSION,
  );

  const dismissDiagnosticsErrorPrompt = () => {
    settings.value.diagnosticsConsentRequested = true;
    settings.value.diagnosticsErrorPromptDismissedVersion = APP_VERSION;
  };

  const setDiagnosticsEnabledByUser = (enabled: boolean) => {
    settings.value.diagnosticsEnabled = enabled;
    dismissDiagnosticsErrorPrompt();
  };

  const enableDiagnosticsFromErrorPrompt = () => {
    setDiagnosticsEnabledByUser(true);
  };

  return {
    isDiagnosticsSettingsReady,
    diagnosticsEnabled,
    diagnosticsConsentRequested,
    isDiagnosticsErrorPromptDismissed,
    setDiagnosticsEnabledByUser,
    enableDiagnosticsFromErrorPrompt,
    dismissDiagnosticsErrorPrompt,
  };
};
