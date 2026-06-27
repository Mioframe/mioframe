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

/** Scope a local prompt owner clears its own pending request by. Unset fields match anything. */
export type DiagnosticsPromptScope = Partial<
  Pick<PendingDiagnosticsPrompt, 'placement' | 'source'>
>;

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

  /**
   * Clears the pending request only when it matches every provided scope field. A local prompt
   * owner must not be able to drop a pending request it does not own.
   * @param scope - Pending request fields that must match before clearing.
   */
  const clearDiagnosticsErrorPromptRequest = (scope: DiagnosticsPromptScope) => {
    if (!pending.value) {
      return;
    }

    if (scope.placement !== undefined && pending.value.placement !== scope.placement) {
      return;
    }

    if (scope.source !== undefined && pending.value.source !== scope.source) {
      return;
    }

    pending.value = null;
  };

  /** Unscoped clear reserved for final user decisions (enable/dismiss), not local prompt owners. */
  const clearAnyDiagnosticsErrorPromptRequest = () => {
    pending.value = null;
  };

  return {
    pending,
    requestDiagnosticsErrorPrompt,
    clearDiagnosticsErrorPromptRequest,
    clearAnyDiagnosticsErrorPromptRequest,
  };
});
