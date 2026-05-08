import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const settings = ref<{
  diagnosticsEnabled?: boolean;
  diagnosticsConsentRequested?: boolean;
}>({});

vi.mock('./useLocalSettings', () => ({
  useLocalSettings: () => ({
    settings,
  }),
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

  it('acceptDiagnosticsConsent sets both fields to true', async () => {
    const { useDiagnosticsSettings } = await import('./useDiagnosticsSettings');

    useDiagnosticsSettings().acceptDiagnosticsConsent();

    expect(settings.value).toEqual({
      diagnosticsEnabled: true,
      diagnosticsConsentRequested: true,
    });
  });

  it('rejectDiagnosticsConsent disables diagnostics and marks consent requested', async () => {
    const { useDiagnosticsSettings } = await import('./useDiagnosticsSettings');

    useDiagnosticsSettings().rejectDiagnosticsConsent();

    expect(settings.value).toEqual({
      diagnosticsEnabled: false,
      diagnosticsConsentRequested: true,
    });
  });

  it('setDiagnosticsEnabledByUser always marks consent requested', async () => {
    const { useDiagnosticsSettings } = await import('./useDiagnosticsSettings');
    const diagnosticsSettings = useDiagnosticsSettings();

    diagnosticsSettings.setDiagnosticsEnabledByUser(true);
    expect(settings.value).toEqual({
      diagnosticsEnabled: true,
      diagnosticsConsentRequested: true,
    });

    diagnosticsSettings.setDiagnosticsEnabledByUser(false);
    expect(settings.value).toEqual({
      diagnosticsEnabled: false,
      diagnosticsConsentRequested: true,
    });
  });
});
