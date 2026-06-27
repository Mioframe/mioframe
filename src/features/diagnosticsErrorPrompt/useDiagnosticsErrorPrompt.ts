import { computed } from 'vue';
import { useDiagnosticsSettings, useLocalSettings } from '@entity/localSettings';
import { SENTRY_DIAGNOSTICS_AVAILABLE } from '@shared/config';
import { useDiagnosticsErrorPromptState } from './useDiagnosticsErrorPromptState';

/**
 * Computes whether the contextual diagnostics prompt is eligible to show and owns its actions.
 * Used by `DiagnosticsErrorPrompt`.
 * @returns Visibility state, the enable/dismiss actions, and a clear action the local prompt
 * owner can call to drop a pending request when it stops being the active local context.
 */
export const useDiagnosticsErrorPrompt = () => {
  const { isFinished } = useLocalSettings();
  const {
    diagnosticsEnabled,
    isDiagnosticsErrorPromptDismissed,
    enableDiagnosticsFromErrorPrompt,
    dismissDiagnosticsErrorPrompt,
  } = useDiagnosticsSettings();
  const { isRequested, clearDiagnosticsErrorPromptRequest } = useDiagnosticsErrorPromptState();

  const isVisible = computed(
    () =>
      SENTRY_DIAGNOSTICS_AVAILABLE &&
      isFinished.value &&
      isRequested.value &&
      !diagnosticsEnabled.value &&
      !isDiagnosticsErrorPromptDismissed.value,
  );

  const enableDiagnostics = () => {
    enableDiagnosticsFromErrorPrompt();
    clearDiagnosticsErrorPromptRequest();
  };

  const dismiss = () => {
    dismissDiagnosticsErrorPrompt();
    clearDiagnosticsErrorPromptRequest();
  };

  return { isVisible, enableDiagnostics, dismiss, clearDiagnosticsErrorPromptRequest };
};
