import { computed } from 'vue';
import { useDiagnosticsSettings, useLocalSettings } from '@entity/localSettings';
import { SENTRY_DIAGNOSTICS_AVAILABLE } from '@shared/config';

/**
 * Shared diagnostics error prompt eligibility gates and persisted prompt actions. Used by both
 * the Home fallback prompt and the create-space inline prompt so they apply the same
 * availability/hydration/opt-in/dismissal rules. Owns no prompt visibility flag of its own; each
 * prompt site combines this with its own local or session visibility state.
 * @returns Eligibility computed plus the enable/dismiss actions that persist settings state.
 */
export const useDiagnosticsErrorPromptEligibility = () => {
  const { isFinished } = useLocalSettings();
  const {
    diagnosticsEnabled,
    isDiagnosticsErrorPromptDismissed,
    enableDiagnosticsFromErrorPrompt,
    dismissDiagnosticsErrorPrompt,
  } = useDiagnosticsSettings();

  const isDiagnosticsErrorPromptEligible = computed(
    () =>
      SENTRY_DIAGNOSTICS_AVAILABLE &&
      isFinished.value &&
      !diagnosticsEnabled.value &&
      !isDiagnosticsErrorPromptDismissed.value,
  );

  return {
    isDiagnosticsErrorPromptEligible,
    enableDiagnosticsFromPrompt: enableDiagnosticsFromErrorPrompt,
    dismissDiagnosticsPrompt: dismissDiagnosticsErrorPrompt,
  };
};
