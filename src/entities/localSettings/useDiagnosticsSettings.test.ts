import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const settings = ref<{
  diagnosticsEnabled?: boolean;
  diagnosticsConsentRequested?: boolean;
  diagnosticsErrorPromptDismissedVersion?: string;
}>({});

vi.mock('./useLocalSettings', () => ({
  useLocalSettings: () => ({
    settings,
  }),
}));

vi.mock('@shared/config', () => ({
  APP_VERSION: 'test-version',
}));

describe('useDiagnosticsSettings', () => {
  beforeEach(() => {
    vi.resetModules();
    settings.value = {};
  });

  it('reads diagnostics fields as strict booleans', async () => {
    const { useDiagnosticsSettings } = await import('./useDiagnosticsSettings');

    settings.value = {
      diagnosticsEnabled: false,
      diagnosticsConsentRequested: true,
    };

    const diagnosticsSettings = useDiagnosticsSettings();

    expect(diagnosticsSettings.diagnosticsEnabled.value).toBe(false);
    expect(diagnosticsSettings.diagnosticsConsentRequested.value).toBe(true);
  });

  it('isDiagnosticsErrorPromptDismissed is false when dismissed version does not match the current app version', async () => {
    const { useDiagnosticsSettings } = await import('./useDiagnosticsSettings');

    settings.value = { diagnosticsErrorPromptDismissedVersion: 'old-version' };

    expect(useDiagnosticsSettings().isDiagnosticsErrorPromptDismissed.value).toBe(false);
  });

  it('isDiagnosticsErrorPromptDismissed is true when dismissed version matches the current app version', async () => {
    const { useDiagnosticsSettings } = await import('./useDiagnosticsSettings');

    settings.value = { diagnosticsErrorPromptDismissedVersion: 'test-version' };

    expect(useDiagnosticsSettings().isDiagnosticsErrorPromptDismissed.value).toBe(true);
  });

  it('setDiagnosticsEnabledByUser(true) enables diagnostics, marks consent requested, and dismisses the prompt', async () => {
    const { useDiagnosticsSettings } = await import('./useDiagnosticsSettings');

    useDiagnosticsSettings().setDiagnosticsEnabledByUser(true);

    expect(settings.value).toEqual({
      diagnosticsEnabled: true,
      diagnosticsConsentRequested: true,
      diagnosticsErrorPromptDismissedVersion: 'test-version',
    });
  });

  it('setDiagnosticsEnabledByUser(false) disables diagnostics, marks consent requested, and dismisses the prompt', async () => {
    const { useDiagnosticsSettings } = await import('./useDiagnosticsSettings');

    useDiagnosticsSettings().setDiagnosticsEnabledByUser(false);

    expect(settings.value).toEqual({
      diagnosticsEnabled: false,
      diagnosticsConsentRequested: true,
      diagnosticsErrorPromptDismissedVersion: 'test-version',
    });
  });

  it('enableDiagnosticsFromErrorPrompt enables diagnostics and dismisses the prompt', async () => {
    const { useDiagnosticsSettings } = await import('./useDiagnosticsSettings');

    useDiagnosticsSettings().enableDiagnosticsFromErrorPrompt();

    expect(settings.value).toEqual({
      diagnosticsEnabled: true,
      diagnosticsConsentRequested: true,
      diagnosticsErrorPromptDismissedVersion: 'test-version',
    });
  });

  it('dismissDiagnosticsErrorPrompt marks consent requested and dismisses the prompt without enabling diagnostics', async () => {
    const { useDiagnosticsSettings } = await import('./useDiagnosticsSettings');

    useDiagnosticsSettings().dismissDiagnosticsErrorPrompt();

    expect(settings.value).toEqual({
      diagnosticsConsentRequested: true,
      diagnosticsErrorPromptDismissedVersion: 'test-version',
    });
  });
});
