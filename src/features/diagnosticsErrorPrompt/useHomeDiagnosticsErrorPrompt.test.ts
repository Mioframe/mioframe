import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const isDiagnosticsSettingsReady = ref(true);
const diagnosticsEnabled = ref(false);
const isDiagnosticsErrorPromptDismissed = ref(false);
const enableDiagnosticsFromErrorPrompt = vi.fn();
const dismissDiagnosticsErrorPrompt = vi.fn();
let sentryDiagnosticsAvailable = true;

vi.mock('@entity/localSettings', () => ({
  useDiagnosticsSettings: () => ({
    isDiagnosticsSettingsReady,
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

describe('useHomeDiagnosticsErrorPrompt', () => {
  beforeEach(() => {
    vi.resetModules();
    isDiagnosticsSettingsReady.value = true;
    diagnosticsEnabled.value = false;
    isDiagnosticsErrorPromptDismissed.value = false;
    sentryDiagnosticsAvailable = true;
    enableDiagnosticsFromErrorPrompt.mockReset();
    dismissDiagnosticsErrorPrompt.mockReset();
  });

  it('is hidden by default', async () => {
    const { useHomeDiagnosticsErrorPrompt } = await import('./useHomeDiagnosticsErrorPrompt');

    const { isHomeDiagnosticsPromptVisible } = useHomeDiagnosticsErrorPrompt();
    expect(isHomeDiagnosticsPromptVisible.value).toBe(false);
  });

  it('becomes visible once a handled error requests the Home fallback', async () => {
    const { useHomeDiagnosticsErrorPrompt } = await import('./useHomeDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    const { isHomeDiagnosticsPromptVisible } = useHomeDiagnosticsErrorPrompt();
    useDiagnosticsErrorPromptTrigger().requestHomeDiagnosticsPromptAfterHandledError();

    expect(isHomeDiagnosticsPromptVisible.value).toBe(true);
  });

  it('stays hidden when diagnostics are unavailable', async () => {
    sentryDiagnosticsAvailable = false;
    const { useHomeDiagnosticsErrorPrompt } = await import('./useHomeDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestHomeDiagnosticsPromptAfterHandledError();
    expect(useHomeDiagnosticsErrorPrompt().isHomeDiagnosticsPromptVisible.value).toBe(false);
  });

  it('stays hidden when settings are not yet hydrated', async () => {
    isDiagnosticsSettingsReady.value = false;
    const { useHomeDiagnosticsErrorPrompt } = await import('./useHomeDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestHomeDiagnosticsPromptAfterHandledError();
    expect(useHomeDiagnosticsErrorPrompt().isHomeDiagnosticsPromptVisible.value).toBe(false);
  });

  it('stays hidden when diagnostics are already enabled', async () => {
    diagnosticsEnabled.value = true;
    const { useHomeDiagnosticsErrorPrompt } = await import('./useHomeDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestHomeDiagnosticsPromptAfterHandledError();
    expect(useHomeDiagnosticsErrorPrompt().isHomeDiagnosticsPromptVisible.value).toBe(false);
  });

  it('stays hidden when already dismissed for the current app version', async () => {
    isDiagnosticsErrorPromptDismissed.value = true;
    const { useHomeDiagnosticsErrorPrompt } = await import('./useHomeDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestHomeDiagnosticsPromptAfterHandledError();
    expect(useHomeDiagnosticsErrorPrompt().isHomeDiagnosticsPromptVisible.value).toBe(false);
  });

  it('clearHomeDiagnosticsPrompt clears the Home fallback flag', async () => {
    const { useHomeDiagnosticsErrorPrompt } = await import('./useHomeDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestHomeDiagnosticsPromptAfterHandledError();
    const prompt = useHomeDiagnosticsErrorPrompt();
    expect(prompt.isHomeDiagnosticsPromptVisible.value).toBe(true);

    prompt.clearHomeDiagnosticsPrompt();

    expect(prompt.isHomeDiagnosticsPromptVisible.value).toBe(false);
  });
});
