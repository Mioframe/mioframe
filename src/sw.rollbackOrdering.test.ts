import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// This file proves the BOOT_FAILED response-before-follow-up-work ordering
// contract with real wiring: unlike `sw.test.ts` (which mocks
// `workerMessages` entirely), this exercises the real
// `handleWorkerMessage()`, `combineLifetimeWork()`, `broadcastRollback()`,
// and `cleanupReleaseCache()` through `src/sw.ts`'s real message listener.
// Only the persisted-state store and the lowest-level browser APIs
// (`self.clients.matchAll`, `caches`) are stubbed.

const readControllerStateMock = vi.fn();
const writeControllerStateMock = vi.fn();
vi.mock('./shared/service/appUpdate/controllerState', () => ({
  readControllerState: (...args: unknown[]) => readControllerStateMock(...args),
  writeControllerState: (...args: unknown[]) => writeControllerStateMock(...args),
}));

vi.mock('./shared/service/appUpdate/workerFetch', () => ({
  handleAssetFetch: vi.fn(),
  handleNavigationFetch: vi.fn(),
}));
vi.mock('./shared/service/appUpdate/workerInstall', () => ({
  runInstall: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('./shared/service/appUpdate/updateDiscovery', () => ({
  runScheduledDiscoveryCheck: vi.fn().mockResolvedValue(false),
}));
vi.mock('./shared/service/appUpdate/scheduledDiscoveryCheckScheduler', () => ({
  createScheduledDiscoveryCheckScheduler: () => ({
    scheduleOnce: (fn: () => Promise<void>) => fn(),
  }),
}));

type FakeMessageListener = (event: {
  data: unknown;
  source: unknown;
  ports: Array<{ postMessage: (message: unknown) => void }>;
  waitUntil: (promise: Promise<unknown>) => void;
}) => void;

/**
 * Stubs `self` and `caches` well enough for `src/sw.ts`'s real module-level
 * wiring (real `workerMessages`, `preparationCoordinator`, `operationQueue`,
 * `releaseCache`, `cleanLaunch`, `workerChannel`) to run, imports it fresh,
 * and returns its registered `message` listener plus the low-level mocks.
 */
async function importSwWithRealWiring(): Promise<{
  listener: FakeMessageListener;
  matchAllMock: ReturnType<typeof vi.fn>;
  cachesKeysMock: ReturnType<typeof vi.fn>;
  cachesDeleteMock: ReturnType<typeof vi.fn>;
  callOrder: string[];
}> {
  const callOrder: string[] = [];
  const matchAllMock = vi.fn(() => {
    callOrder.push('broadcast-start');
    return matchAllDeferred.promise;
  });
  const cachesKeysMock = vi.fn(() => {
    callOrder.push('cleanup-start');
    return cachesKeysDeferred.promise;
  });
  const cachesDeleteMock = vi.fn().mockResolvedValue(undefined);

  const listeners = new Map<string, FakeMessageListener>();
  vi.stubGlobal('self', {
    registration: { scope: 'https://mioframe.example/' },
    clients: { matchAll: matchAllMock },
    addEventListener: (type: string, listener: FakeMessageListener) => {
      listeners.set(type, listener);
    },
  });
  vi.stubGlobal('caches', { keys: cachesKeysMock, delete: cachesDeleteMock });

  await import('./sw');
  const listener = listeners.get('message');
  if (!listener) throw new Error('Expected a message listener to have been registered');
  return { listener, matchAllMock, cachesKeysMock, cachesDeleteMock, callOrder };
}

/** A promise deferred until the test explicitly resolves it, plus its resolver. */
function createDeferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

async function flushMicrotasks(times = 8): Promise<void> {
  let tick = Promise.resolve();
  for (let i = 0; i < times; i += 1) {
    tick = tick.then(() => undefined);
  }
  await tick;
}

let matchAllDeferred: ReturnType<typeof createDeferred<unknown[]>>;
let cachesKeysDeferred: ReturnType<typeof createDeferred<string[]>>;

const activation = {
  targetRelease: {
    releaseId: 'release-b',
    releaseSequence: 2,
    appVersion: '1.1.0',
    buildId: 'build-b',
    buildDate: '2026-07-24T00:00:00.000Z',
  },
  deadlineAt: '2026-07-24T00:00:30.000Z',
};
const rollbackState = {
  schemaVersion: 1 as const,
  mode: 'manual' as const,
  activeRelease: { releaseId: 'release-a', releaseSequence: 1 },
  approvedRelease: activation.targetRelease,
  activation,
};

const SAME_CHANNEL_WINDOW_SOURCE = { type: 'window', url: 'https://mioframe.example/settings' };

describe('src/sw.ts BOOT_FAILED real-wiring ordering', () => {
  beforeEach(() => {
    vi.resetModules();
    readControllerStateMock.mockReset();
    writeControllerStateMock.mockReset();
    matchAllDeferred = createDeferred<unknown[]>();
    cachesKeysDeferred = createDeferred<string[]>();
    readControllerStateMock.mockResolvedValue({ status: 'valid', state: rollbackState });
    writeControllerStateMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the rollback acknowledgement before either the rollback broadcast or cleanup starts, and keeps the event pending until both complete', async () => {
    const { listener, matchAllMock, cachesKeysMock, callOrder } = await importSwWithRealWiring();

    const postMessage = vi.fn(() => {
      callOrder.push('postMessage');
    });
    let waitUntilPromise: Promise<unknown> | undefined;
    listener({
      data: { protocolVersion: 1, type: 'BOOT_FAILED', releaseId: 'release-b' },
      source: SAME_CHANNEL_WINDOW_SOURCE,
      ports: [{ postMessage }],
      waitUntil: (promise) => {
        waitUntilPromise = promise;
      },
    });
    if (!waitUntilPromise) throw new Error('Expected event.waitUntil to have been called');

    await flushMicrotasks();

    // The acknowledgement is already posted, but neither the rollback
    // broadcast nor cleanup has actually resolved yet: both are still
    // pending on their deferred mocks.
    expect(postMessage).toHaveBeenCalledWith({
      protocolVersion: 1,
      snapshot: expect.objectContaining({ activeRelease: rollbackState.activeRelease }),
      ack: 'rolled-back',
    });
    expect(matchAllMock).toHaveBeenCalled();
    expect(cachesKeysMock).toHaveBeenCalled();

    // The response must have been posted strictly before either follow-up
    // work item started.
    expect(callOrder[0]).toBe('postMessage');
    expect(callOrder).toContain('broadcast-start');
    expect(callOrder).toContain('cleanup-start');

    let waitUntilSettled = false;
    void waitUntilPromise.then(() => {
      waitUntilSettled = true;
    });
    await flushMicrotasks();
    expect(waitUntilSettled).toBe(false);

    matchAllDeferred.resolve([]);
    await flushMicrotasks();
    expect(waitUntilSettled).toBe(false);

    cachesKeysDeferred.resolve([]);
    await expect(waitUntilPromise).resolves.toBeUndefined();
  });

  it('never invokes runLifetimeWork (broadcast/cleanup) before the response is posted, even instrumented at the mock call level', async () => {
    const { listener, callOrder } = await importSwWithRealWiring();
    matchAllDeferred.resolve([]);
    cachesKeysDeferred.resolve([]);

    const postMessage = vi.fn(() => {
      callOrder.push('postMessage');
    });
    let waitUntilPromise: Promise<unknown> | undefined;
    listener({
      data: { protocolVersion: 1, type: 'BOOT_FAILED', releaseId: 'release-b' },
      source: SAME_CHANNEL_WINDOW_SOURCE,
      ports: [{ postMessage }],
      waitUntil: (promise) => {
        waitUntilPromise = promise;
      },
    });
    if (!waitUntilPromise) throw new Error('Expected event.waitUntil to have been called');

    await waitUntilPromise;

    expect(callOrder.indexOf('postMessage')).toBe(0);
    expect(callOrder.indexOf('postMessage')).toBeLessThan(callOrder.indexOf('broadcast-start'));
    expect(callOrder.indexOf('postMessage')).toBeLessThan(callOrder.indexOf('cleanup-start'));
  });

  it('a BOOT_OK invalidation broadcast likewise starts only after the acknowledgement is posted', async () => {
    const bootOkState = {
      schemaVersion: 1 as const,
      mode: 'manual' as const,
      activeRelease: { releaseId: 'release-a', releaseSequence: 1 },
      approvedRelease: activation.targetRelease,
      activation,
    };
    readControllerStateMock.mockResolvedValue({ status: 'valid', state: bootOkState });
    const { listener, callOrder } = await importSwWithRealWiring();
    matchAllDeferred.resolve([]);
    cachesKeysDeferred.resolve([]);

    const postMessage = vi.fn(() => {
      callOrder.push('postMessage');
    });
    let waitUntilPromise: Promise<unknown> | undefined;
    listener({
      data: { protocolVersion: 1, type: 'BOOT_OK', releaseId: 'release-b' },
      source: SAME_CHANNEL_WINDOW_SOURCE,
      ports: [{ postMessage }],
      waitUntil: (promise) => {
        waitUntilPromise = promise;
      },
    });
    if (!waitUntilPromise) throw new Error('Expected event.waitUntil to have been called');

    await waitUntilPromise;

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ ack: 'committed', protocolVersion: 1 }),
    );
    expect(callOrder.indexOf('postMessage')).toBe(0);
    expect(callOrder.indexOf('postMessage')).toBeLessThan(callOrder.indexOf('broadcast-start'));
  });

  it('a cleanup failure does not reject the event: it still resolves after the acknowledgement', async () => {
    const { listener } = await importSwWithRealWiring();
    matchAllDeferred.resolve([]);
    cachesKeysDeferred.resolve([]);
    writeControllerStateMock.mockResolvedValue(undefined);
    // Force the cleanup's own `caches.delete` (or any downstream step) to
    // fail after `keys()` resolves — simplest is to make `readControllerState`
    // (called again inside `runReleaseCacheCleanup`) reject on its second
    // call, i.e. the cleanup's own read.
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state: rollbackState })
      .mockRejectedValueOnce(new Error('cleanup read failed'));

    const postMessage = vi.fn();
    let waitUntilPromise: Promise<unknown> | undefined;
    listener({
      data: { protocolVersion: 1, type: 'BOOT_FAILED', releaseId: 'release-b' },
      source: SAME_CHANNEL_WINDOW_SOURCE,
      ports: [{ postMessage }],
      waitUntil: (promise) => {
        waitUntilPromise = promise;
      },
    });
    if (!waitUntilPromise) throw new Error('Expected event.waitUntil to have been called');

    await expect(waitUntilPromise).resolves.toBeUndefined();
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ ack: 'rolled-back', protocolVersion: 1 }),
    );
  });

  it('a read-only GET_SNAPSHOT request has no follow-up work at all: no broadcast, no cleanup', async () => {
    const { listener, matchAllMock, cachesKeysMock } = await importSwWithRealWiring();

    const postMessage = vi.fn();
    let waitUntilPromise: Promise<unknown> | undefined;
    listener({
      data: { protocolVersion: 1, type: 'GET_SNAPSHOT' },
      source: SAME_CHANNEL_WINDOW_SOURCE,
      ports: [{ postMessage }],
      waitUntil: (promise) => {
        waitUntilPromise = promise;
      },
    });
    if (!waitUntilPromise) throw new Error('Expected event.waitUntil to have been called');

    await expect(waitUntilPromise).resolves.toBeUndefined();
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ protocolVersion: 1, snapshot: expect.anything() }),
    );
    expect(matchAllMock).not.toHaveBeenCalled();
    expect(cachesKeysMock).not.toHaveBeenCalled();
  });

  it('a no-op SET_MODE request (already Manual, nothing scheduled) has no follow-up work', async () => {
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: {
        schemaVersion: 1 as const,
        mode: 'manual' as const,
        activeRelease: { releaseId: 'release-a', releaseSequence: 1 },
      },
    });
    const { listener, matchAllMock, cachesKeysMock } = await importSwWithRealWiring();

    const postMessage = vi.fn();
    let waitUntilPromise: Promise<unknown> | undefined;
    listener({
      data: { protocolVersion: 1, type: 'SET_MODE', mode: 'manual' },
      source: SAME_CHANNEL_WINDOW_SOURCE,
      ports: [{ postMessage }],
      waitUntil: (promise) => {
        waitUntilPromise = promise;
      },
    });
    if (!waitUntilPromise) throw new Error('Expected event.waitUntil to have been called');

    await expect(waitUntilPromise).resolves.toBeUndefined();
    expect(writeControllerStateMock).not.toHaveBeenCalled();
    expect(matchAllMock).not.toHaveBeenCalled();
    expect(cachesKeysMock).not.toHaveBeenCalled();
  });
});
