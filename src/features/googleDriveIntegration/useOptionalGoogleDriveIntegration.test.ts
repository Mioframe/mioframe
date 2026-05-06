import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref, type EffectScope } from 'vue';

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
const activeScopes: EffectScope[] = [];

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error?: unknown) => void;
};

const createDeferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (error?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve,
    reject,
  };
};

const flushMicrotasks = async () => {
  await nextTick();
  await Promise.resolve();
  await Promise.resolve();
};

const createTrackedScope = (): EffectScope => {
  const scope = effectScope();

  activeScopes.push(scope);

  return scope;
};

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

  afterEach(() => {
    while (activeScopes.length > 0) {
      activeScopes.pop()?.stop();
    }
  });

  it('keeps Google integration disabled on startup and does not touch Google SDK loaders', async () => {
    const scope = createTrackedScope();
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

    const scope = createTrackedScope();
    const googleSessionModule = await import('@entity/googleSession');
    const setupGoogleSessionsSpy = vi.spyOn(googleSessionModule, 'setupGoogleSessions');
    const { useOptionalGoogleDriveIntegration } =
      await import('./useOptionalGoogleDriveIntegration');

    scope.run(() => {
      useOptionalGoogleDriveIntegration();
    });

    await vi.waitFor(() => {
      expect(setupGoogleSessionsSpy).toHaveBeenCalledWith(clientId);
      expect(bindGoogleApiMock).toHaveBeenCalledTimes(1);
      expect(enableGoogleDriveIntegrationMock).toHaveBeenCalledTimes(1);
      expect(disableGoogleDriveIntegrationMock).not.toHaveBeenCalled();
    });
    expect(requestAccessTokenMock).not.toHaveBeenCalled();
    expect(loadGoogleMock).not.toHaveBeenCalled();
    expect(loadGsiMock).not.toHaveBeenCalled();
    expect(loadGapiMock).not.toHaveBeenCalled();
    expect(loadOauth2Mock).not.toHaveBeenCalled();

    scope.stop();
  });

  it('toggles Google Drive integration on and off idempotently', async () => {
    const scope = createTrackedScope();
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
    await vi.waitFor(() => {
      expect(enableGoogleDriveIntegrationMock).toHaveBeenCalledTimes(1);
    });

    settings.value = {
      googleDriveIntegrationEnabled: false,
    };
    await vi.waitFor(() => {
      expect(disableGoogleDriveIntegrationMock).toHaveBeenCalledTimes(2);
    });

    settings.value = {
      googleDriveIntegrationEnabled: true,
    };
    await vi.waitFor(() => {
      expect(setupGoogleSessionsSpy).toHaveBeenCalledTimes(1);
      expect(enableGoogleDriveIntegrationMock).toHaveBeenCalledTimes(2);
      expect(disableGoogleDriveIntegrationMock).toHaveBeenCalledTimes(2);
    });

    scope.stop();
  });

  it('waits for Google session setup before enabling Google Drive integration', async () => {
    settings.value = {
      googleDriveIntegrationEnabled: true,
    };
    const bindGate = createDeferred<undefined>();
    bindGoogleApiMock.mockImplementation(() => bindGate.promise);

    const scope = createTrackedScope();
    const { useOptionalGoogleDriveIntegration } =
      await import('./useOptionalGoogleDriveIntegration');

    scope.run(() => {
      useOptionalGoogleDriveIntegration();
    });

    await flushMicrotasks();

    expect(bindGoogleApiMock).toHaveBeenCalledTimes(1);
    expect(enableGoogleDriveIntegrationMock).not.toHaveBeenCalled();

    bindGate.resolve(undefined);
    await vi.waitFor(() => {
      expect(enableGoogleDriveIntegrationMock).toHaveBeenCalledTimes(1);
    });

    scope.stop();
  });

  it('keeps the final state disabled when enable resolves after a later disable', async () => {
    const enableGate = createDeferred<undefined>();
    let googleDriveEnabled = false;

    enableGoogleDriveIntegrationMock.mockImplementation(async () => {
      await enableGate.promise;
      googleDriveEnabled = true;
    });
    disableGoogleDriveIntegrationMock.mockImplementation(() => {
      googleDriveEnabled = false;
      return Promise.resolve();
    });

    const scope = createTrackedScope();
    const { useOptionalGoogleDriveIntegration } =
      await import('./useOptionalGoogleDriveIntegration');

    scope.run(() => {
      useOptionalGoogleDriveIntegration();
    });

    await flushMicrotasks();

    settings.value = {
      googleDriveIntegrationEnabled: true,
    };
    await flushMicrotasks();

    settings.value = {
      googleDriveIntegrationEnabled: false,
    };
    await flushMicrotasks();

    enableGate.resolve(undefined);
    await flushMicrotasks();

    expect(googleDriveEnabled).toBe(false);
    expect(disableGoogleDriveIntegrationMock).toHaveBeenCalled();

    scope.stop();
  });
});
