import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const useIDBKeyvalMock = vi.fn();

vi.mock('@vueuse/integrations/useIDBKeyval', () => ({
  useIDBKeyval: (...args: unknown[]) => useIDBKeyvalMock(...args),
}));

describe('useLocalSettings', () => {
  beforeEach(() => {
    vi.resetModules();
    useIDBKeyvalMock.mockReset();
  });

  it('initializes starter widget settings as undefined and exposes labels and descriptions', async () => {
    useIDBKeyvalMock.mockImplementation((_key, defaultValue: object) => ({
      data: ref(structuredClone(defaultValue)),
    }));

    const { useLocalSettings } = await import('./useLocalSettings');
    const { settings, SETTINGS_DESCRIPTION, SETTINGS_LABEL } = useLocalSettings();

    expect(settings.value.hideStarterWidget).toBeUndefined();
    expect(SETTINGS_LABEL.hideStarterWidget).toBe('Hide starter examples');
    expect(SETTINGS_DESCRIPTION.hideStarterWidget).toBe('Hide starter examples on the home screen');
  });

  it('persists false, true, and undefined starter widget states without coercing to true by default', async () => {
    useIDBKeyvalMock.mockImplementation((_key, defaultValue: object) => ({
      data: ref(structuredClone(defaultValue)),
    }));

    const { useLocalSettings } = await import('./useLocalSettings');
    const { settings } = useLocalSettings();

    settings.value.hideStarterWidget = false;
    expect(settings.value.hideStarterWidget).toBe(false);

    settings.value.hideStarterWidget = true;
    expect(settings.value.hideStarterWidget).toBe(true);

    settings.value.hideStarterWidget = undefined;
    expect(settings.value.hideStarterWidget).toBeUndefined();
  });

  it('defaults Google Drive integration to disabled and exposes its labels and descriptions', async () => {
    useIDBKeyvalMock.mockImplementation((_key, defaultValue: object) => ({
      data: ref(structuredClone(defaultValue)),
    }));

    const { useLocalSettings } = await import('./useLocalSettings');
    const { settings, SETTINGS_DESCRIPTION, SETTINGS_LABEL } = useLocalSettings();

    expect(settings.value.googleDriveIntegrationEnabled).toBeUndefined();
    expect(SETTINGS_LABEL.googleDriveIntegrationEnabled).toBe('Google Drive');
    expect(SETTINGS_DESCRIPTION.googleDriveIntegrationEnabled).toBe(
      'Enable optional Google Drive integration',
    );
  });

  it('persists true and undefined Google Drive integration states without defaulting to true', async () => {
    useIDBKeyvalMock.mockImplementation((_key, defaultValue: object) => ({
      data: ref(structuredClone(defaultValue)),
    }));

    const { useLocalSettings } = await import('./useLocalSettings');
    const { settings } = useLocalSettings();

    settings.value.googleDriveIntegrationEnabled = true;
    expect(settings.value.googleDriveIntegrationEnabled).toBe(true);

    settings.value.googleDriveIntegrationEnabled = undefined;
    expect(settings.value.googleDriveIntegrationEnabled).toBeUndefined();
  });
});
