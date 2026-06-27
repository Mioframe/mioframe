import { computed } from 'vue';
import { useDiagnosticsSettings, useLocalSettings } from '@entity/localSettings';
import { SENTRY_DIAGNOSTICS_AVAILABLE } from '@shared/config';
import { useDiagnosticsErrorPromptState } from './useDiagnosticsErrorPromptState';

/**
 * Computes whether the Home fallback diagnostics prompt is eligible to show, and owns its
 * `Enable diagnostics`/`Not now` actions. Used by `HomePane` for visibility and by
 * `DiagnosticsErrorPrompt` for both the Home and inline variant's actions.
 * @returns Home prompt visibility plus the enable/dismiss actions, which always clear the Home
 * fallback flag alongside the persisted settings change.
 */
export const useHomeDiagnosticsErrorPrompt = () => {
  const { isFinished } = useLocalSettings();
  const {
    diagnosticsEnabled,
    isDiagnosticsErrorPromptDismissed,
    enableDiagnosticsFromErrorPrompt,
    dismissDiagnosticsErrorPrompt,
  } = useDiagnosticsSettings();
  const { shouldShowHomeDiagnosticsPrompt, clearHomeDiagnosticsPrompt } =
    useDiagnosticsErrorPromptState();

  const isHomeDiagnosticsPromptVisible = computed(
    () =>
      SENTRY_DIAGNOSTICS_AVAILABLE &&
      isFinished.value &&
      shouldShowHomeDiagnosticsPrompt.value &&
      !diagnosticsEnabled.value &&
      !isDiagnosticsErrorPromptDismissed.value,
  );

  const enableDiagnostics = () => {
    enableDiagnosticsFromErrorPrompt();
    clearHomeDiagnosticsPrompt();
  };

  const dismiss = () => {
    dismissDiagnosticsErrorPrompt();
    clearHomeDiagnosticsPrompt();
  };

  return { isHomeDiagnosticsPromptVisible, enableDiagnostics, dismiss };
};
