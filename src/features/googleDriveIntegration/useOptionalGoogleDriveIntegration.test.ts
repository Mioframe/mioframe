import { beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, ref } from 'vue';

const settings = ref<{ googleDriveIntegrationEnabled?: boolean }>({});
const enableGoogleDriveIntegrationMock = vi.fn();
const disableGoogleDriveIntegrationMock = vi.fn();
const bindGoogleApiMock = vi.fn();
const requestAccessTokenMock = vi.fn();
const revokeGoogleAccessMock = vi.fn();
const loadGsiMock = vi.fn();
const loadGoogleMock = vi.fn();
const loadGapiMock = vi.fn();
const loadOauth2Mock = vi.fn();
const clientId = 'test-google-client-id';

vi.mock('@entity/localSettings', () => ({
  useLocalSettings: () => ({
    settings,
  }),
}));

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    google: {
      bindGoogleApi: bindGoogleApiMock,
      disableGoogleDriveIntegration: disableGoogleDriveIntegrationMock,
      enableGoogleDriveIntegration: enableGoogleDriveIntegrationMock,
    },
  }),
}));

vi.mock('@shared/config', () => ({
  GOOGLE_CLIENT_ID: clientId,
}));

vi.mock('@shared/lib/googleApi', () => ({
  loadGAPI: loadGapiMock,
  loadGoogle: loadGoogleMock,
  loadGsi: loadGsiMock,
  loadOauth2: loadOauth2Mock,
  requestAccessToken: requestAccessTokenMock,
  revokeGoogleAccess: revokeGoogleAccessMock,
}));

describe('useOptionalGoogleDriveIntegration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    settings.value = {};
    enableGoogleDriveIntegrationMock.mockReset();
    disableGoogleDriveIntegrationMock.mockReset();
    bindGoogleApiMock.mockReset();
    requestAccessTokenMock.mockReset();
    revokeGoogleAccessMock.mockReset();
    loadGsiMock.mockReset();
    loadGoogleMock.mockReset();
    loadGapiMock.mockReset();
    loadOauth2Mock.mockReset();
    enableGoogleDriveIntegrationMock.mockResolvedValue(undefined);
    disableGoogleDriveIntegrationMock.mockResolvedValue(undefined);
    bindGoogleApiMock.mockResolvedValue(undefined);
  });

  it('keeps Google integration disabled on startup and does not touch Google SDK loaders', async () => {
    const scope = effectScope();
    const googleSessionModule = await import('@entity/googleSession');
    const setupGoogleSessionsSpy = vi.spyOn(googleSessionModule, 'setupGoogleSessions');
    const { useOptionalGoogleDriveIntegration } =
      await import('./useOptionalGoogleDriveIntegration');

    scope.run(() => {
      useOptionalGoogleDriveIntegration();
    });

    await Promise.resolve();

    expect(disableGoogleDriveIntegrationMock).toHaveBeenCalledTimes(1);
    expect(enableGoogleDriveIntegrationMock).not.toHaveBeenCalled();
    expect(setupGoogleSessionsSpy).not.toHaveBeenCalled();
    expect(requestAccessTokenMock).not.toHaveBeenCalled();
    expect(loadGoogleMock).not.toHaveBeenCalled();
    expect(loadGsiMock).not.toHaveBeenCalled();
    expect(loadGapiMock).not.toHaveBeenCalled();
    expect(loadOauth2Mock).not.toHaveBeenCalled();

    scope.stop();
  });

  it('binds and enables Google Drive only when the setting is enabled, while keeping SDK calls lazy', async () => {
    settings.value = {
      googleDriveIntegrationEnabled: true,
    };

    const scope = effectScope();
    const googleSessionModule = await import('@entity/googleSession');
    const setupGoogleSessionsSpy = vi.spyOn(googleSessionModule, 'setupGoogleSessions');
    const { useOptionalGoogleDriveIntegration } =
      await import('./useOptionalGoogleDriveIntegration');

    scope.run(() => {
      useOptionalGoogleDriveIntegration();
    });

    await Promise.resolve();

    expect(setupGoogleSessionsSpy).toHaveBeenCalledWith(clientId);
    expect(bindGoogleApiMock).toHaveBeenCalledTimes(1);
    expect(enableGoogleDriveIntegrationMock).toHaveBeenCalledTimes(1);
    expect(disableGoogleDriveIntegrationMock).not.toHaveBeenCalled();
    expect(requestAccessTokenMock).not.toHaveBeenCalled();
    expect(loadGoogleMock).not.toHaveBeenCalled();
    expect(loadGsiMock).not.toHaveBeenCalled();
    expect(loadGapiMock).not.toHaveBeenCalled();
    expect(loadOauth2Mock).not.toHaveBeenCalled();

    scope.stop();
  });

  it('toggles Google Drive integration on and off idempotently', async () => {
    const scope = effectScope();
    const googleSessionModule = await import('@entity/googleSession');
    const setupGoogleSessionsSpy = vi.spyOn(googleSessionModule, 'setupGoogleSessions');
    const { useOptionalGoogleDriveIntegration } =
      await import('./useOptionalGoogleDriveIntegration');

    scope.run(() => {
      useOptionalGoogleDriveIntegration();
    });

    await Promise.resolve();

    settings.value = {
      googleDriveIntegrationEnabled: true,
    };
    await Promise.resolve();

    settings.value = {
      googleDriveIntegrationEnabled: false,
    };
    await Promise.resolve();

    settings.value = {
      googleDriveIntegrationEnabled: true,
    };
    await Promise.resolve();

    expect(setupGoogleSessionsSpy).toHaveBeenCalledTimes(1);
    expect(enableGoogleDriveIntegrationMock).toHaveBeenCalledTimes(2);
    expect(disableGoogleDriveIntegrationMock).toHaveBeenCalledTimes(2);

    scope.stop();
  });
});
