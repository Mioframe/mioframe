import { beforeEach, describe, expect, it, vi } from 'vitest';

const { defineWorkerClientMock, workerConstructorMock } = vi.hoisted(() => ({
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
}));

vi.mock('@shared/lib/wrapWorker', () => ({
  defineWorkerClient: defineWorkerClientMock,
}));

vi.mock('./serviceWorker.ts?worker', () => ({
  default: workerConstructorMock,
}));

describe('useMainServiceClient', () => {
  beforeEach(() => {
    defineWorkerClientMock.mockClear();
    workerConstructorMock.mockClear();
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
});
