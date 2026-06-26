import { computed } from 'vue';
import { APP_VERSION } from '@shared/config';
import { useLocalSettings } from './useLocalSettings';

/**
 * Returns the local diagnostics settings plus the only supported mutation actions.
 * @returns Diagnostics settings state and user-driven actions.
 */
export const useDiagnosticsSettings = () => {
  const { settings } = useLocalSettings();

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
    diagnosticsEnabled,
    diagnosticsConsentRequested,
    isDiagnosticsErrorPromptDismissed,
    setDiagnosticsEnabledByUser,
    enableDiagnosticsFromErrorPrompt,
    dismissDiagnosticsErrorPrompt,
  };
};
