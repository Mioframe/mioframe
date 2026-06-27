import { useDiagnosticsErrorPromptState } from './useDiagnosticsErrorPromptState';

/**
 * Public trigger for the Home fallback diagnostics prompt. Call after a snackbar-only handled
 * error that the project already treats as a reportable failure (already passed through
 * `captureDiagnosticException`). The prompt itself stays gated by availability, current opt-in
 * state, and prior dismissal.
 * @returns The `requestHomeDiagnosticsPromptAfterHandledError` action.
 */
export const useDiagnosticsErrorPromptTrigger = () => {
  const { requestHomeDiagnosticsPromptAfterHandledError } = useDiagnosticsErrorPromptState();

  return { requestHomeDiagnosticsPromptAfterHandledError };
};
