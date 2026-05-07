import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref, type EffectScope } from 'vue';

const settings = ref<{ googleDriveIntegrationEnabled?: boolean }>({});
let googleClientId: string | undefined = 'test-google-client-id';
let googleDriveIntegrationAvailable = true;
const setGoogleDriveIntegrationEnabledMock = vi.fn();
const bindGoogleApiMock = vi.fn();
const requestAccessTokenMock = vi.fn();
const revokeGoogleAccessMock = vi.fn();
const loadGsiMock = vi.fn();
const loadGoogleMock = vi.fn();
const loadGapiMock = vi.fn();
const loadOauth2Mock = vi.fn();
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
      setGoogleDriveIntegrationEnabled: setGoogleDriveIntegrationEnabledMock,
    },
  }),
}));

vi.mock('@shared/config', () => ({
  get GOOGLE_CLIENT_ID() {
    return googleClientId;
  },
  get GOOGLE_DRIVE_INTEGRATION_AVAILABLE() {
    return googleDriveIntegrationAvailable;
  },
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
    vi.resetModules();
    settings.value = {};
    googleClientId = 'test-google-client-id';
    googleDriveIntegrationAvailable = true;
    setGoogleDriveIntegrationEnabledMock.mockReset();
    bindGoogleApiMock.mockReset();
    requestAccessTokenMock.mockReset();
    revokeGoogleAccessMock.mockReset();
    loadGsiMock.mockReset();
    loadGoogleMock.mockReset();
    loadGapiMock.mockReset();
    loadOauth2Mock.mockReset();
    setGoogleDriveIntegrationEnabledMock.mockResolvedValue(undefined);
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

    expect(setGoogleDriveIntegrationEnabledMock).toHaveBeenCalledTimes(1);
    expect(setGoogleDriveIntegrationEnabledMock).toHaveBeenLastCalledWith(false);
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
      expect(setupGoogleSessionsSpy).toHaveBeenCalledWith(googleClientId);
      expect(bindGoogleApiMock).toHaveBeenCalledTimes(1);
      expect(setGoogleDriveIntegrationEnabledMock).toHaveBeenLastCalledWith(true);
    });
    expect(requestAccessTokenMock).not.toHaveBeenCalled();
    expect(loadGoogleMock).not.toHaveBeenCalled();
    expect(loadGsiMock).not.toHaveBeenCalled();
    expect(loadGapiMock).not.toHaveBeenCalled();
    expect(loadOauth2Mock).not.toHaveBeenCalled();

    scope.stop();
  });

  it('keeps Google integration disabled when Google Drive integration is unavailable', async () => {
    settings.value = {
      googleDriveIntegrationEnabled: true,
    };
    googleClientId = undefined;
    googleDriveIntegrationAvailable = false;

    const scope = createTrackedScope();
    const googleSessionModule = await import('@entity/googleSession');
    const setupGoogleSessionsSpy = vi.spyOn(googleSessionModule, 'setupGoogleSessions');
    const { useOptionalGoogleDriveIntegration } =
      await import('./useOptionalGoogleDriveIntegration');

    scope.run(() => {
      useOptionalGoogleDriveIntegration();
    });

    await Promise.resolve();

    expect(setupGoogleSessionsSpy).not.toHaveBeenCalled();
    expect(bindGoogleApiMock).not.toHaveBeenCalled();
    expect(setGoogleDriveIntegrationEnabledMock).toHaveBeenCalledTimes(1);
    expect(setGoogleDriveIntegrationEnabledMock).toHaveBeenLastCalledWith(false);
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
      expect(setGoogleDriveIntegrationEnabledMock).toHaveBeenLastCalledWith(true);
    });

    settings.value = {
      googleDriveIntegrationEnabled: false,
    };
    await vi.waitFor(() => {
      expect(setGoogleDriveIntegrationEnabledMock).toHaveBeenLastCalledWith(false);
    });

    settings.value = {
      googleDriveIntegrationEnabled: true,
    };
    await vi.waitFor(() => {
      expect(setupGoogleSessionsSpy).toHaveBeenCalledTimes(1);
      expect(setGoogleDriveIntegrationEnabledMock).toHaveBeenLastCalledWith(true);
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
    expect(setGoogleDriveIntegrationEnabledMock).not.toHaveBeenCalled();

    bindGate.resolve(undefined);
    await vi.waitFor(() => {
      expect(setGoogleDriveIntegrationEnabledMock).toHaveBeenLastCalledWith(true);
    });

    scope.stop();
  });

  it('keeps the final state disabled when setup resolves after a later disable', async () => {
    const enableGate = createDeferred<undefined>();

    setGoogleDriveIntegrationEnabledMock.mockImplementation(async (enabled: boolean) => {
      if (!enabled) {
        return;
      }

      await enableGate.promise;
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

    expect(setGoogleDriveIntegrationEnabledMock).toHaveBeenLastCalledWith(false);

    scope.stop();
  });

  it('keeps the final state enabled for true, false, true when the first setup resolves last', async () => {
    const firstEnableGate = createDeferred<undefined>();
    let enableCallCount = 0;

    setGoogleDriveIntegrationEnabledMock.mockImplementation(async (enabled: boolean) => {
      if (!enabled) {
        return;
      }

      enableCallCount += 1;

      if (enableCallCount === 1) {
        await firstEnableGate.promise;
      }
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

    settings.value = {
      googleDriveIntegrationEnabled: true,
    };
    await flushMicrotasks();

    firstEnableGate.resolve(undefined);
    await flushMicrotasks();

    expect(setGoogleDriveIntegrationEnabledMock).toHaveBeenLastCalledWith(true);
    expect(enableCallCount).toBe(1);

    scope.stop();
  });
});
