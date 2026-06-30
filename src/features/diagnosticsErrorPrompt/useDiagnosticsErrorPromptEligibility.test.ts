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

describe('useDiagnosticsErrorPromptEligibility', () => {
  beforeEach(() => {
    vi.resetModules();
    isDiagnosticsSettingsReady.value = true;
    diagnosticsEnabled.value = false;
    isDiagnosticsErrorPromptDismissed.value = false;
    sentryDiagnosticsAvailable = true;
    enableDiagnosticsFromErrorPrompt.mockReset();
    dismissDiagnosticsErrorPrompt.mockReset();
  });

  it('is eligible when all shared gates pass', async () => {
    const { useDiagnosticsErrorPromptEligibility } =
      await import('./useDiagnosticsErrorPromptEligibility');

    const { isDiagnosticsErrorPromptEligible } = useDiagnosticsErrorPromptEligibility();
    expect(isDiagnosticsErrorPromptEligible.value).toBe(true);
  });

  it('is ineligible when diagnostics are unavailable', async () => {
    sentryDiagnosticsAvailable = false;
    const { useDiagnosticsErrorPromptEligibility } =
      await import('./useDiagnosticsErrorPromptEligibility');

    expect(useDiagnosticsErrorPromptEligibility().isDiagnosticsErrorPromptEligible.value).toBe(
      false,
    );
  });

  it('is ineligible when diagnostics settings are not yet ready', async () => {
    isDiagnosticsSettingsReady.value = false;
    const { useDiagnosticsErrorPromptEligibility } =
      await import('./useDiagnosticsErrorPromptEligibility');

    expect(useDiagnosticsErrorPromptEligibility().isDiagnosticsErrorPromptEligible.value).toBe(
      false,
    );
  });

  it('is ineligible when diagnostics are already enabled', async () => {
    diagnosticsEnabled.value = true;
    const { useDiagnosticsErrorPromptEligibility } =
      await import('./useDiagnosticsErrorPromptEligibility');

    expect(useDiagnosticsErrorPromptEligibility().isDiagnosticsErrorPromptEligible.value).toBe(
      false,
    );
  });

  it('is ineligible when already dismissed for the current app version', async () => {
    isDiagnosticsErrorPromptDismissed.value = true;
    const { useDiagnosticsErrorPromptEligibility } =
      await import('./useDiagnosticsErrorPromptEligibility');

    expect(useDiagnosticsErrorPromptEligibility().isDiagnosticsErrorPromptEligible.value).toBe(
      false,
    );
  });

  it('enableDiagnosticsFromPrompt calls the settings entity action', async () => {
    const { useDiagnosticsErrorPromptEligibility } =
      await import('./useDiagnosticsErrorPromptEligibility');

    useDiagnosticsErrorPromptEligibility().enableDiagnosticsFromPrompt();

    expect(enableDiagnosticsFromErrorPrompt).toHaveBeenCalledTimes(1);
    expect(dismissDiagnosticsErrorPrompt).not.toHaveBeenCalled();
  });

  it('dismissDiagnosticsPrompt calls the settings entity action', async () => {
    const { useDiagnosticsErrorPromptEligibility } =
      await import('./useDiagnosticsErrorPromptEligibility');

    useDiagnosticsErrorPromptEligibility().dismissDiagnosticsPrompt();

    expect(dismissDiagnosticsErrorPrompt).toHaveBeenCalledTimes(1);
    expect(enableDiagnosticsFromErrorPrompt).not.toHaveBeenCalled();
  });
});
