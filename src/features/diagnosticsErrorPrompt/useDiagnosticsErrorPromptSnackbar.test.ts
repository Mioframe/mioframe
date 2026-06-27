import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const isVisible = ref(false);
const enableDiagnostics = vi.fn();
const dismiss = vi.fn();

vi.mock('./useDiagnosticsErrorPrompt', () => ({
  useDiagnosticsErrorPrompt: () => ({ isVisible, enableDiagnostics, dismiss }),
}));

const addSnackbar = vi.fn();

vi.mock('@shared/ui/Snackbar', () => ({
  useSnackbar: () => ({ addSnackbar }),
}));

describe('useDiagnosticsErrorPromptSnackbar', () => {
  it('queues exactly one contextual snackbar once the prompt becomes eligible', async () => {
    addSnackbar.mockReturnValue(vi.fn());
    const { useDiagnosticsErrorPromptSnackbar } =
      await import('./useDiagnosticsErrorPromptSnackbar');

    useDiagnosticsErrorPromptSnackbar();

    expect(addSnackbar).not.toHaveBeenCalled();

    isVisible.value = true;
    await Promise.resolve();

    expect(addSnackbar).toHaveBeenCalledTimes(1);
    const description = addSnackbar.mock.calls[0]?.[0];
    expect(description.actionLabel).toBe('Enable diagnostics');
    expect(description.text).not.toContain('Send report');

    description.callback();
    expect(enableDiagnostics).toHaveBeenCalledTimes(1);

    description.onClose();
    expect(dismiss).toHaveBeenCalledTimes(1);
  });
});
