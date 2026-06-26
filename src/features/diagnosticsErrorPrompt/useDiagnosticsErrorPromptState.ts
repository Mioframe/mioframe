import { createGlobalState } from '@vueuse/core';
import { ref } from 'vue';

/**
 * Tracks whether a handled error has requested the contextual diagnostics prompt this session.
 * Visibility against persisted/availability gates is computed by `useDiagnosticsErrorPrompt`.
 */
export const useDiagnosticsErrorPromptState = createGlobalState(() => {
  const isRequested = ref(false);

  const requestDiagnosticsErrorPrompt = () => {
    isRequested.value = true;
  };

  const clearDiagnosticsErrorPromptRequest = () => {
    isRequested.value = false;
  };

  return { isRequested, requestDiagnosticsErrorPrompt, clearDiagnosticsErrorPromptRequest };
});
