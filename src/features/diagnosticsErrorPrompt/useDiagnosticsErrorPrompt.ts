import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { useDiagnosticsSettings, useLocalSettings } from '@entity/localSettings';
import { SENTRY_DIAGNOSTICS_AVAILABLE } from '@shared/config';
import {
  useDiagnosticsErrorPromptState,
  type DiagnosticsPromptPlacement,
} from './useDiagnosticsErrorPromptState';

/**
 * Computes whether the contextual diagnostics prompt is eligible to show for the given local
 * placement and owns its actions. Used by `DiagnosticsErrorPrompt`.
 * @param placementSource - The local render target calling this composable (`'inline'` or
 * `'home'`). Only a pending request for this exact placement makes the prompt visible.
 * @returns Visibility state, the enable/dismiss actions, and a clear action the local prompt
 * owner can call to drop a pending request when it stops being the active local context.
 */
export const useDiagnosticsErrorPrompt = (
  placementSource: MaybeRefOrGetter<DiagnosticsPromptPlacement>,
) => {
  const { isFinished } = useLocalSettings();
  const {
    diagnosticsEnabled,
    isDiagnosticsErrorPromptDismissed,
    enableDiagnosticsFromErrorPrompt,
    dismissDiagnosticsErrorPrompt,
  } = useDiagnosticsSettings();
  const { pending, clearDiagnosticsErrorPromptRequest } = useDiagnosticsErrorPromptState();

  const isVisible = computed(
    () =>
      SENTRY_DIAGNOSTICS_AVAILABLE &&
      isFinished.value &&
      pending.value?.placement === toValue(placementSource) &&
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
