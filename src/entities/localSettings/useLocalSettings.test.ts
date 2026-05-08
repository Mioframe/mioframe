import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const useIDBKeyvalMock = vi.fn();
type DiagnosticsSerializerOptions = {
  serializer: {
    read: (value: unknown) => {
      diagnosticsEnabled: boolean;
      diagnosticsConsentRequested: boolean;
    };
  };
};

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
      isFinished: ref(true),
    }));

    const { useLocalSettings } = await import('./useLocalSettings');
    const { settings } = useLocalSettings();

    expect(settings.value.hideStarterWidget).toBeUndefined();
  });

  it('persists false, true, and undefined starter widget states without coercing to true by default', async () => {
    useIDBKeyvalMock.mockImplementation((_key, defaultValue: object) => ({
      data: ref(structuredClone(defaultValue)),
      isFinished: ref(true),
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
      isFinished: ref(true),
    }));

    const { useLocalSettings } = await import('./useLocalSettings');
    const { settings } = useLocalSettings();

    expect(settings.value.googleDriveIntegrationEnabled).toBeUndefined();
  });

  it('persists true and undefined Google Drive integration states without defaulting to true', async () => {
    useIDBKeyvalMock.mockImplementation((_key, defaultValue: object) => ({
      data: ref(structuredClone(defaultValue)),
      isFinished: ref(true),
    }));

    const { useLocalSettings } = await import('./useLocalSettings');
    const { settings } = useLocalSettings();

    settings.value.googleDriveIntegrationEnabled = true;
    expect(settings.value.googleDriveIntegrationEnabled).toBe(true);

    settings.value.googleDriveIntegrationEnabled = undefined;
    expect(settings.value.googleDriveIntegrationEnabled).toBeUndefined();
  });

  it('defaults diagnosticsEnabled to false', async () => {
    useIDBKeyvalMock.mockImplementation((_key, defaultValue: object) => ({
      data: ref(structuredClone(defaultValue)),
      isFinished: ref(true),
    }));

    const { useLocalSettings } = await import('./useLocalSettings');
    const { settings } = useLocalSettings();

    expect(settings.value.diagnosticsEnabled).toBe(false);
  });

  it('defaults diagnosticsConsentRequested to false', async () => {
    useIDBKeyvalMock.mockImplementation((_key, defaultValue: object) => ({
      data: ref(structuredClone(defaultValue)),
      isFinished: ref(true),
    }));

    const { useLocalSettings } = await import('./useLocalSettings');
    const { settings } = useLocalSettings();

    expect(settings.value.diagnosticsConsentRequested).toBe(false);
  });

  it('persists true and false diagnostics states without coercing them to undefined', async () => {
    useIDBKeyvalMock.mockImplementation((_key, defaultValue: object) => ({
      data: ref(structuredClone(defaultValue)),
      isFinished: ref(true),
    }));

    const { useLocalSettings } = await import('./useLocalSettings');
    const { settings } = useLocalSettings();

    settings.value.diagnosticsEnabled = true;
    expect(settings.value.diagnosticsEnabled).toBe(true);

    settings.value.diagnosticsEnabled = false;
    expect(settings.value.diagnosticsEnabled).toBe(false);
  });

  it('migrates missing diagnostics fields to false when reading existing settings', async () => {
    let capturedOptions: DiagnosticsSerializerOptions | undefined;

    useIDBKeyvalMock.mockImplementation(
      (_key, defaultValue: object, options?: DiagnosticsSerializerOptions) => {
        capturedOptions = options;

        return {
          data: ref(structuredClone(defaultValue)),
          isFinished: ref(true),
        };
      },
    );

    const { useLocalSettings } = await import('./useLocalSettings');
    useLocalSettings();

    if (!capturedOptions) {
      throw new Error('Expected useIDBKeyval options to be captured');
    }

    const migrated = capturedOptions.serializer.read({});

    expect(migrated.diagnosticsEnabled).toBe(false);
    expect(migrated.diagnosticsConsentRequested).toBe(false);
  });
});
