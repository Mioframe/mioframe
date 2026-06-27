import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const isFinished = ref(true);
const diagnosticsEnabled = ref(false);
const isDiagnosticsErrorPromptDismissed = ref(false);
const enableDiagnosticsFromErrorPrompt = vi.fn();
const dismissDiagnosticsErrorPrompt = vi.fn();
let sentryDiagnosticsAvailable = true;

vi.mock('@entity/localSettings', () => ({
  useLocalSettings: () => ({ isFinished }),
  useDiagnosticsSettings: () => ({
    diagnosticsEnabled,
    isDiagnosticsErrorPromptDismissed,
    enableDiagnosticsFromErrorPrompt,
    dismissDiagnosticsErrorPrompt,
  }),
}));

vi.mock('@shared/config', () => ({
  get SENTRY_DIAGNOSTICS_AVAILABLE() {
    return sentryDiagnosticsAvailable;
  },
}));

describe('useDiagnosticsErrorPrompt', () => {
  beforeEach(() => {
    vi.resetModules();
    isFinished.value = true;
    diagnosticsEnabled.value = false;
    isDiagnosticsErrorPromptDismissed.value = false;
    sentryDiagnosticsAvailable = true;
    enableDiagnosticsFromErrorPrompt.mockReset();
    dismissDiagnosticsErrorPrompt.mockReset();
  });

  it('is hidden until a handled error requests it', async () => {
    const { useDiagnosticsErrorPrompt } = await import('./useDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    const { isVisible } = useDiagnosticsErrorPrompt();
    expect(isVisible.value).toBe(false);

    useDiagnosticsErrorPromptTrigger().requestDiagnosticsErrorPrompt();
    expect(isVisible.value).toBe(true);
  });

  it('stays hidden when diagnostics are unavailable', async () => {
    sentryDiagnosticsAvailable = false;
    const { useDiagnosticsErrorPrompt } = await import('./useDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestDiagnosticsErrorPrompt();
    expect(useDiagnosticsErrorPrompt().isVisible.value).toBe(false);
  });

  it('stays hidden when settings are not yet hydrated', async () => {
    isFinished.value = false;
    const { useDiagnosticsErrorPrompt } = await import('./useDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestDiagnosticsErrorPrompt();
    expect(useDiagnosticsErrorPrompt().isVisible.value).toBe(false);
  });

  it('stays hidden when diagnostics are already enabled', async () => {
    diagnosticsEnabled.value = true;
    const { useDiagnosticsErrorPrompt } = await import('./useDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestDiagnosticsErrorPrompt();
    expect(useDiagnosticsErrorPrompt().isVisible.value).toBe(false);
  });

  it('stays hidden when already dismissed for the current app version', async () => {
    isDiagnosticsErrorPromptDismissed.value = true;
    const { useDiagnosticsErrorPrompt } = await import('./useDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestDiagnosticsErrorPrompt();
    expect(useDiagnosticsErrorPrompt().isVisible.value).toBe(false);
  });

  it('enableDiagnostics enables diagnostics and hides the prompt', async () => {
    const { useDiagnosticsErrorPrompt } = await import('./useDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestDiagnosticsErrorPrompt();
    const prompt = useDiagnosticsErrorPrompt();
    expect(prompt.isVisible.value).toBe(true);

    prompt.enableDiagnostics();

    expect(enableDiagnosticsFromErrorPrompt).toHaveBeenCalledTimes(1);
    expect(prompt.isVisible.value).toBe(false);
  });

  it('clearing the request hides the prompt and prevents stale display for a later context', async () => {
    const { useDiagnosticsErrorPrompt } = await import('./useDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestDiagnosticsErrorPrompt();
    const prompt = useDiagnosticsErrorPrompt();
    expect(prompt.isVisible.value).toBe(true);

    prompt.clearDiagnosticsErrorPromptRequest();

    expect(prompt.isVisible.value).toBe(false);
    expect(enableDiagnosticsFromErrorPrompt).not.toHaveBeenCalled();
    expect(dismissDiagnosticsErrorPrompt).not.toHaveBeenCalled();

    // A later, unrelated local owner must not see the earlier request resurface.
    expect(useDiagnosticsErrorPrompt().isVisible.value).toBe(false);
  });

  it('dismiss does not enable diagnostics and hides the prompt', async () => {
    const { useDiagnosticsErrorPrompt } = await import('./useDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestDiagnosticsErrorPrompt();
    const prompt = useDiagnosticsErrorPrompt();

    prompt.dismiss();

    expect(dismissDiagnosticsErrorPrompt).toHaveBeenCalledTimes(1);
    expect(enableDiagnosticsFromErrorPrompt).not.toHaveBeenCalled();
    expect(prompt.isVisible.value).toBe(false);
  });
});
