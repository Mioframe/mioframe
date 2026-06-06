import type { SentryRuntimeState } from '@shared/lib/sentry';
import type { Provider } from '@shared/lib/proxyService';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const addTechnicalBreadcrumbMock = vi.hoisted(() => vi.fn());
const createClientMock = vi.hoisted(() => vi.fn());
const createServiceMock = vi.hoisted(() => vi.fn());
const setDiagnosticsRuntimeStateMock = vi.hoisted(() => vi.fn());

describe('sentryWorkerSync', () => {
  beforeEach(() => {
    vi.resetModules();
    addTechnicalBreadcrumbMock.mockReset();
    createClientMock.mockReset();
    createServiceMock.mockReset();
    setDiagnosticsRuntimeStateMock.mockReset();
    vi.doMock('@shared/lib/diagnostics', () => ({
      addTechnicalBreadcrumb: addTechnicalBreadcrumbMock,
    }));
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

  it('worker applyRuntimeState adds a technical breadcrumb before applying state', async () => {
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
      sessionId: 'session:test',
    });

    expect(addTechnicalBreadcrumbMock).toHaveBeenCalledWith({
      category: 'worker.runtime',
      data: {
        operation: 'applyRuntimeState',
        runtime: 'worker',
      },
      level: 'warning',
      message: 'worker reporting state received: disabled',
    });
    expect(setDiagnosticsRuntimeStateMock).toHaveBeenCalledWith({
      reportingState: 'disabled',
      sessionId: 'session:test',
    });
  });
});
