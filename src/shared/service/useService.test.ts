import { beforeEach, describe, expect, it, vi } from 'vitest';

const { defineWorkerClientMock, workerConstructorMock, initSentryWorkerBridgeMock } = vi.hoisted(
  () => {
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
      initSentryWorkerBridgeMock: vi.fn(),
    };
  },
);

vi.mock('@shared/lib/wrapWorker', () => ({
  defineWorkerClient: defineWorkerClientMock,
}));

vi.mock('./serviceWorker.ts?worker', () => ({
  default: workerConstructorMock,
}));

vi.mock('./sentryWorkerSync', () => ({
  initSentryWorkerBridge: initSentryWorkerBridgeMock,
}));

describe('useMainServiceClient', () => {
  beforeEach(() => {
    defineWorkerClientMock.mockClear();
    workerConstructorMock.mockClear();
    initSentryWorkerBridgeMock.mockClear();
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

  describe('Sentry worker bridge', () => {
    it('initializes the Sentry worker bridge when the worker is first created', async () => {
      const { useMainServiceClient } = await import('./useService');
      useMainServiceClient();

      expect(initSentryWorkerBridgeMock).toHaveBeenCalledOnce();
      expect(initSentryWorkerBridgeMock).toHaveBeenCalledWith(expect.any(Object));
    });

    it('does not reinitialize the bridge on subsequent client calls', async () => {
      const { useMainServiceClient } = await import('./useService');
      useMainServiceClient();
      useMainServiceClient();

      expect(initSentryWorkerBridgeMock).toHaveBeenCalledOnce();
    });
  });
});
