import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>();

  return {
    ...actual,
    createGlobalState: <T>(factory: () => T) => {
      let state: T | undefined;

      return () => {
        state ??= factory();
        return state;
      };
    },
  };
});

vi.mock('../proxyService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../proxyService')>();

  return {
    ...actual,
    createClient: createClientMock,
  };
});

import { defineWorkerClient } from './defineWorkerClient';

const createWorker = (): Worker =>
  Object.assign(new EventTarget(), {
    onerror: null,
    onmessage: null,
    onmessageerror: null,
    postMessage: vi.fn(),
    terminate: vi.fn(),
  });

describe('defineWorkerClient', () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it('resolves a worker factory lazily and only once', () => {
    const worker = createWorker();
    const workerFactory = vi.fn(() => worker);

    createClientMock.mockReturnValue({ ok: true });

    const useClient = defineWorkerClient(workerFactory, 'service-id', () => ({}));

    expect(workerFactory).not.toHaveBeenCalled();

    expect(useClient()).toEqual({ ok: true });
    expect(useClient()).toEqual({ ok: true });

    expect(workerFactory).toHaveBeenCalledTimes(1);
    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(createClientMock).toHaveBeenCalledWith(worker, 'service-id', expect.any(Array));
  });

  it('uses a worker instance directly without invoking it like a factory', () => {
    const worker = createWorker();

    createClientMock.mockReturnValue({ ok: true });

    const useClient = defineWorkerClient(worker, 'service-id', () => ({}));

    expect(useClient()).toEqual({ ok: true });

    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(createClientMock).toHaveBeenCalledWith(worker, 'service-id', expect.any(Array));
  });
});
