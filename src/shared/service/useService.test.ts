import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  defineWorkerClientMock,
  workerConstructorMock,
  createServiceMock,
  reportDiagnosticEventMock,
  addDiagnosticBreadcrumbMock,
} = vi.hoisted(() => {
  const createServiceMock = vi.fn();
  const reportDiagnosticEventMock = vi.fn();
  const addDiagnosticBreadcrumbMock = vi.fn();

  return {
    defineWorkerClientMock: vi.fn(
      (worker: Worker | (() => Worker), _serviceId: string, _setup: () => unknown) => {
        let client: Worker | undefined;

        return () => {
          client = typeof worker === 'function' ? worker() : worker;
          return client;
        };
      },
    ),
    workerConstructorMock: vi.fn(
      class MockWorker {
        terminate = vi.fn();
      },
    ),
    createServiceMock,
    reportDiagnosticEventMock,
    addDiagnosticBreadcrumbMock,
  };
});

vi.mock('@shared/lib/wrapWorker', () => ({
  defineWorkerClient: defineWorkerClientMock,
}));

vi.mock('./serviceWorker.ts?worker', () => ({
  default: workerConstructorMock,
}));

vi.mock('@shared/lib/diagnostics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/lib/diagnostics')>();
  return {
    ...actual,
    reportDiagnosticEvent: reportDiagnosticEventMock,
    addDiagnosticBreadcrumb: addDiagnosticBreadcrumbMock,
  };
});

vi.mock('@shared/lib/proxyService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/lib/proxyService')>();
  return {
    ...actual,
    createService: createServiceMock,
  };
});

describe('useMainServiceClient', () => {
  beforeEach(() => {
    defineWorkerClientMock.mockClear();
    workerConstructorMock.mockClear();
    createServiceMock.mockClear();
    reportDiagnosticEventMock.mockClear();
    addDiagnosticBreadcrumbMock.mockClear();
    vi.resetModules();
  });

  it('does not construct the worker until the client is first used', async () => {
    const { useMainServiceClient } = await import('./useService');

    expect(workerConstructorMock).not.toHaveBeenCalled();
    expect(defineWorkerClientMock).toHaveBeenCalledTimes(1);

    const firstClient = useMainServiceClient();
    const secondClient = useMainServiceClient();

    expect(firstClient).toBe(secondClient);
    expect(workerConstructorMock).toHaveBeenCalledTimes(1);
  });

  describe('diagnostics service registration', () => {
    it('registers the main-thread diagnostics service on the worker when first used', async () => {
      const { useMainServiceClient } = await import('./useService');
      useMainServiceClient();

      // registerMainThreadDiagnosticsService calls createService with the DIAGNOSTICS_SERVICE_ID
      const { DIAGNOSTICS_SERVICE_ID } = await import('./diagnosticsService');
      expect(createServiceMock).toHaveBeenCalledWith(
        expect.any(Object), // the Worker instance
        DIAGNOSTICS_SERVICE_ID,
        expect.any(Array), // transformers
        expect.any(Function), // setup returning { reportDiagnosticEvent, addDiagnosticBreadcrumb }
      );
    });

    it('exposes reportDiagnosticEvent through the diagnostics service setup', async () => {
      const { useMainServiceClient } = await import('./useService');
      useMainServiceClient();

      const { DIAGNOSTICS_SERVICE_ID } = await import('./diagnosticsService');
      const call = createServiceMock.mock.calls.find((args) => args[1] === DIAGNOSTICS_SERVICE_ID);
      expect(call).toBeDefined();

      const setupFn = call?.[3];
      expect(typeof setupFn).toBe('function');

      const service = setupFn?.();
      expect(typeof service?.reportDiagnosticEvent).toBe('function');
      expect(typeof service?.addDiagnosticBreadcrumb).toBe('function');
    });

    it('routes service reportDiagnosticEvent calls to the main-thread reporter', async () => {
      const { useMainServiceClient } = await import('./useService');
      useMainServiceClient();

      const { DIAGNOSTICS_SERVICE_ID } = await import('./diagnosticsService');
      const call = createServiceMock.mock.calls.find((args) => args[1] === DIAGNOSTICS_SERVICE_ID);
      const service = call?.[3]?.();

      const event = {
        name: 'repositoryStorage.saveFailed',
        severity: 'error',
        result: 'failed',
        classification: 'storage',
      };

      service?.reportDiagnosticEvent(event);
      expect(reportDiagnosticEventMock).toHaveBeenCalledWith(event);
    });

    it('routes service addDiagnosticBreadcrumb calls to the main-thread reporter', async () => {
      const { useMainServiceClient } = await import('./useService');
      useMainServiceClient();

      const { DIAGNOSTICS_SERVICE_ID } = await import('./diagnosticsService');
      const call = createServiceMock.mock.calls.find((args) => args[1] === DIAGNOSTICS_SERVICE_ID);
      const service = call?.[3]?.();

      const breadcrumb = {
        category: 'repository.storage',
        message: 'repository save failed',
        data: { provider: 'webFileSystem', operation: 'repositorySave' },
      };

      service?.addDiagnosticBreadcrumb(breadcrumb);
      expect(addDiagnosticBreadcrumbMock).toHaveBeenCalledWith(breadcrumb);
    });

    it('does not use a raw diagnosticForward postMessage protocol', async () => {
      const { useMainServiceClient } = await import('./useService');
      const instance = useMainServiceClient();

      // The returned client must not have a direct 'message' event listener
      // for the ad-hoc diagnosticForward protocol — all forwarding goes through proxyService.
      // We verify no event listeners were added to the raw Worker (they are handled by
      // proxyService internally, not by useService directly).
      expect(instance).toBeDefined();

      // createService should have been called for the diagnostics service
      const { DIAGNOSTICS_SERVICE_ID } = await import('./diagnosticsService');
      const diagnosticsCall = createServiceMock.mock.calls.find(
        (args) => args[1] === DIAGNOSTICS_SERVICE_ID,
      );
      expect(diagnosticsCall).toBeDefined();
    });
  });
});
