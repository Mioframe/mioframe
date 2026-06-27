import { createGlobalState } from '@vueuse/core';
import { ref } from 'vue';

/**
 * Tracks the single session-only Home fallback diagnostics prompt flag. Visibility against
 * persisted/availability gates is computed by `useHomeDiagnosticsErrorPrompt`.
 */
export const useDiagnosticsErrorPromptState = createGlobalState(() => {
  const shouldShowHomeDiagnosticsPrompt = ref(false);

  const requestHomeDiagnosticsPromptAfterHandledError = () => {
    shouldShowHomeDiagnosticsPrompt.value = true;
  };

  const clearHomeDiagnosticsPrompt = () => {
    shouldShowHomeDiagnosticsPrompt.value = false;
  };

  return {
    shouldShowHomeDiagnosticsPrompt,
    requestHomeDiagnosticsPromptAfterHandledError,
    clearHomeDiagnosticsPrompt,
  };
});
