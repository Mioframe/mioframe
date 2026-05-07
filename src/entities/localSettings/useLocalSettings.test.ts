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

  it('defaults hideStarterWidget to undefined', async () => {
    useIDBKeyvalMock.mockImplementation((_key, defaultValue: object) => ({
      data: ref(structuredClone(defaultValue)),
    }));

    const { useLocalSettings } = await import('./useLocalSettings');
    const { settings } = useLocalSettings();

    expect(settings.value.hideStarterWidget).toBeUndefined();
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

  it('defaults googleDriveIntegrationEnabled to undefined', async () => {
    useIDBKeyvalMock.mockImplementation((_key, defaultValue: object) => ({
      data: ref(structuredClone(defaultValue)),
    }));

    const { useLocalSettings } = await import('./useLocalSettings');
    const { settings } = useLocalSettings();

    expect(settings.value.googleDriveIntegrationEnabled).toBeUndefined();
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
