import type { SentryRuntimeState } from '@shared/lib/sentry';
import type { Provider } from '@shared/lib/proxyService';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const createClientMock = vi.hoisted(() => vi.fn());
const createServiceMock = vi.hoisted(() => vi.fn());
const setDiagnosticsRuntimeStateMock = vi.hoisted(() => vi.fn());
const TEST_SESSION_ID = 'session:aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb';

describe('sentryWorkerSync', () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    createServiceMock.mockReset();
    setDiagnosticsRuntimeStateMock.mockReset();
    vi.doMock('@shared/lib/proxyService', () => ({
      createClient: createClientMock,
      createService: createServiceMock,
    }));
    vi.doMock('@shared/lib/setupSentry', () => ({
      setDiagnosticsRuntimeState: setDiagnosticsRuntimeStateMock,
    }));
    vi.doMock('@shared/lib/wrapWorker/workerTransformerMap', () => ({
      transformers: [],
    }));
  });

  it('worker applyRuntimeState forwards runtime state to the shared runtime', async () => {
    const serviceFactoryHolder: {
      factory?: () => { applyRuntimeState: (state: SentryRuntimeState) => void };
    } = {};
    createServiceMock.mockImplementation((_worker, _serviceId, _transformers, factory) => {
      serviceFactoryHolder.factory = factory;
    });
    const { registerWorkerSentrySyncService } = await import('./sentryWorkerSync');
    const provider: Provider = {
      addEventListener: () => undefined,
      postMessage: () => undefined,
      removeEventListener: () => undefined,
    };

    registerWorkerSentrySyncService(provider);
    serviceFactoryHolder.factory?.().applyRuntimeState({
      reportingState: 'disabled',
      sessionId: TEST_SESSION_ID,
    });

    expect(setDiagnosticsRuntimeStateMock).toHaveBeenCalledWith({
      reportingState: 'disabled',
      sessionId: TEST_SESSION_ID,
    });
  });
});
