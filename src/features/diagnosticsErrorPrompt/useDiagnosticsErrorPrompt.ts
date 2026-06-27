import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { useDiagnosticsSettings, useLocalSettings } from '@entity/localSettings';
import { SENTRY_DIAGNOSTICS_AVAILABLE } from '@shared/config';
import {
  useDiagnosticsErrorPromptState,
  type DiagnosticsPromptPlacement,
  type DiagnosticsPromptSource,
} from './useDiagnosticsErrorPromptState';

/**
 * Computes whether the contextual diagnostics prompt is eligible to show for the given local
 * placement and owns its actions. Used by `DiagnosticsErrorPrompt`.
 * @param placementSource - The local render target calling this composable (`'inline'` or
 * `'home'`). Only a pending request for this exact placement makes the prompt visible.
 * @returns Visibility state, the enable/dismiss actions, and a clear action the local prompt
 * owner can call to drop a pending request when it stops being the active local context. The
 * clear action is scoped to this placement and never drops a pending request for the other
 * placement.
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
  const {
    pending,
    clearDiagnosticsErrorPromptRequest: clearScopedDiagnosticsErrorPromptRequest,
    clearAnyDiagnosticsErrorPromptRequest,
  } = useDiagnosticsErrorPromptState();

  const isVisible = computed(
    () =>
      SENTRY_DIAGNOSTICS_AVAILABLE &&
      isFinished.value &&
      pending.value?.placement === toValue(placementSource) &&
      !diagnosticsEnabled.value &&
      !isDiagnosticsErrorPromptDismissed.value,
  );

  /**
   * Clears only a pending request matching this placement (and `source`, if given).
   * @param scope - Optional additional `source` to require alongside this placement.
   */
  const clearDiagnosticsErrorPromptRequest = (scope?: { source?: DiagnosticsPromptSource }) => {
    clearScopedDiagnosticsErrorPromptRequest({
      placement: toValue(placementSource),
      ...(scope?.source !== undefined ? { source: scope.source } : {}),
    });
  };

  const enableDiagnostics = () => {
    enableDiagnosticsFromErrorPrompt();
    clearAnyDiagnosticsErrorPromptRequest();
  };

  const dismiss = () => {
    dismissDiagnosticsErrorPrompt();
    clearAnyDiagnosticsErrorPromptRequest();
  };

  return { isVisible, enableDiagnostics, dismiss, clearDiagnosticsErrorPromptRequest };
};
