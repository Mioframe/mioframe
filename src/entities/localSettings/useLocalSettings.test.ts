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

  it('persists false and true Google Drive integration states', async () => {
    useIDBKeyvalMock.mockImplementation((_key, defaultValue: object) => ({
      data: ref(structuredClone(defaultValue)),
    }));

    const { useLocalSettings } = await import('./useLocalSettings');
    const { settings } = useLocalSettings();

    settings.value.googleDriveIntegrationEnabled = false;
    expect(settings.value.googleDriveIntegrationEnabled).toBe(false);

    settings.value.googleDriveIntegrationEnabled = true;
    expect(settings.value.googleDriveIntegrationEnabled).toBe(true);
  });
});
