import { computed } from 'vue';
import { useDiagnosticsErrorPromptEligibility } from './useDiagnosticsErrorPromptEligibility';
import { useDiagnosticsErrorPromptState } from './useDiagnosticsErrorPromptState';

/**
 * Combines the session-only Home fallback flag with shared diagnostics prompt eligibility.
 * @returns Home prompt visibility plus the action to clear the Home fallback flag once the
 * prompt has been acted on (enabled or dismissed).
 */
export const useHomeDiagnosticsErrorPrompt = () => {
  const { isDiagnosticsErrorPromptEligible } = useDiagnosticsErrorPromptEligibility();
  const { shouldShowHomeDiagnosticsPrompt, clearHomeDiagnosticsPrompt } =
    useDiagnosticsErrorPromptState();

  const isHomeDiagnosticsPromptVisible = computed(
    () => shouldShowHomeDiagnosticsPrompt.value && isDiagnosticsErrorPromptEligible.value,
  );

  return { isHomeDiagnosticsPromptVisible, clearHomeDiagnosticsPrompt };
};
