import { useDiagnosticsErrorPromptState } from './useDiagnosticsErrorPromptState';

/**
 * Public trigger for the contextual diagnostics prompt. Call after a handled error that the
 * project already treats as a reportable failure (already passed through `captureDiagnosticException`).
 * The prompt itself stays gated by availability, current opt-in state, and prior dismissal.
 * @returns The `requestDiagnosticsErrorPrompt` action.
 */
export const useDiagnosticsErrorPromptTrigger = () => {
  const { requestDiagnosticsErrorPrompt } = useDiagnosticsErrorPromptState();

  return { requestDiagnosticsErrorPrompt };
};
