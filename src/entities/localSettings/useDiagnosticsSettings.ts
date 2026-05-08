import { computed } from 'vue';
import { useLocalSettings } from './useLocalSettings';

/**
 * Returns the local diagnostics settings plus the only supported mutation actions.
 * @returns Diagnostics settings state and user-driven actions.
 */
export const useDiagnosticsSettings = () => {
  const { settings } = useLocalSettings();

  const diagnosticsEnabled = computed(() => settings.value.diagnosticsEnabled);
  const diagnosticsConsentRequested = computed(() => settings.value.diagnosticsConsentRequested);

  const acceptDiagnosticsConsent = () => {
    settings.value.diagnosticsEnabled = true;
    settings.value.diagnosticsConsentRequested = true;
  };

  const rejectDiagnosticsConsent = () => {
    settings.value.diagnosticsEnabled = false;
    settings.value.diagnosticsConsentRequested = true;
  };

  const setDiagnosticsEnabledByUser = (enabled: boolean) => {
    settings.value.diagnosticsEnabled = enabled;
    settings.value.diagnosticsConsentRequested = true;
  };

  return {
    diagnosticsEnabled,
    diagnosticsConsentRequested,
    acceptDiagnosticsConsent,
    rejectDiagnosticsConsent,
    setDiagnosticsEnabledByUser,
  };
};
