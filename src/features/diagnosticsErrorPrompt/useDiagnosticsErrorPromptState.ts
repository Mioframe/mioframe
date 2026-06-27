import { createGlobalState } from '@vueuse/core';
import { ref } from 'vue';

/** Safe, enum-like source of a diagnostics prompt request. Carries no error detail. */
export type DiagnosticsPromptSource =
  | 'spaceCreate'
  | 'spaceOpen'
  | 'documentImport'
  | 'entryRemove'
  | 'writeRecovery';

/** Local render target the prompt is requested for. */
export type DiagnosticsPromptPlacement = 'inline' | 'home';

/** Session-only pending diagnostics prompt request. */
export type PendingDiagnosticsPrompt = {
  /** Safe identifier of the handled error flow that requested this prompt. */
  source: DiagnosticsPromptSource;
  /** Local render target eligible to show this request. */
  placement: DiagnosticsPromptPlacement;
  /** `Date.now()` timestamp the request was created at. */
  createdAt: number;
};

/**
 * Tracks the single pending contextual diagnostics prompt request for this session.
 * Visibility against persisted/availability gates is computed by `useDiagnosticsErrorPrompt`.
 */
export const useDiagnosticsErrorPromptState = createGlobalState(() => {
  const pending = ref<PendingDiagnosticsPrompt | null>(null);

  const requestDiagnosticsErrorPrompt = (options: {
    source: DiagnosticsPromptSource;
    placement: DiagnosticsPromptPlacement;
  }) => {
    pending.value = { ...options, createdAt: Date.now() };
  };

  const clearDiagnosticsErrorPromptRequest = () => {
    pending.value = null;
  };

  return { pending, requestDiagnosticsErrorPrompt, clearDiagnosticsErrorPromptRequest };
});
