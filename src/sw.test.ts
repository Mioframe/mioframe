import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// `src/sw.ts` wires the browser's real `ServiceWorkerGlobalScope` API
// (`self.addEventListener`, `event.waitUntil`, `event.ports`) to the
// managed-update domain modules. This file isolates exactly that wiring —
// every domain module is mocked — to prove the `message` handler's
// event-lifetime contract: `handleWorkerMessage()`'s response is posted
// immediately, `runLifetimeWork` is invoked and awaited only afterwards
// under the same `waitUntil()`, a malformed or foreign-channel request never
// reaches the handler at all, and a `runLifetimeWork` rejection never
// surfaces.

const handleWorkerMessageMock = vi.fn();
vi.mock('./shared/service/appUpdate/workerMessages', () => ({
  handleWorkerMessage: (...args: unknown[]) => handleWorkerMessageMock(...args),
}));

const isSameChannelWindowClientMock = vi.fn((..._args: unknown[]) => true);
vi.mock('./shared/service/appUpdate/cleanLaunch', () => ({
  isSameChannelPath: () => true,
  isSameChannelWindowClient: (...args: unknown[]) => isSameChannelWindowClientMock(...args),
}));

vi.mock('./shared/service/appUpdate/workerChannel', () => ({
  deriveManagedChannel: () => 'stable',
  buildManagedChannelBasePath: () => '/',
  deriveManagedChannelOrigin: () => 'https://mioframe.example',
}));

vi.mock('./shared/service/appUpdate/operationQueue', () => ({
  createOperationQueue: () => (operation: () => Promise<unknown>) => operation(),
}));

vi.mock('./shared/service/appUpdate/preparationCoordinator', () => ({
  createPreparationCoordinator: () => ({
    prepare: vi.fn(),
    runCleanup: (cleanup: (ids: readonly number[]) => Promise<void>) => cleanup([]),
  }),
}));

vi.mock('./shared/service/appUpdate/scheduledDiscoveryCheckScheduler', () => ({
  createScheduledDiscoveryCheckScheduler: () => ({
    scheduleOnce: (fn: () => Promise<void>) => fn(),
  }),
}));

vi.mock('./shared/service/appUpdate/releaseCache', () => ({
  runReleaseCacheCleanup: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./shared/service/appUpdate/updateDiscovery', () => ({
  runScheduledDiscoveryCheck: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./shared/service/appUpdate/workerFetch', () => ({
  handleAssetFetch: vi.fn(),
  handleNavigationFetch: vi.fn(),
}));

vi.mock('./shared/service/appUpdate/workerInstall', () => ({
  runInstall: vi.fn().mockResolvedValue(undefined),
}));

type FakeMessageListener = (event: {
  data: unknown;
  source: unknown;
  ports: Array<{ postMessage: (message: unknown) => void }>;
  waitUntil: (promise: Promise<unknown>) => void;
}) => void;

/**
 * Stubs `self` well enough for `src/sw.ts`'s module-level setup to run,
 * imports it fresh, and returns its registered `message` event listener.
 * @returns The listener `src/sw.ts` registered via `self.addEventListener('message', ...)`.
 */
async function importSwAndGetMessageListener(): Promise<FakeMessageListener> {
  const listeners = new Map<string, FakeMessageListener>();
  vi.stubGlobal('self', {
    registration: { scope: 'https://mioframe.example/' },
    clients: { matchAll: vi.fn().mockResolvedValue([]) },
    addEventListener: (type: string, listener: FakeMessageListener) => {
      listeners.set(type, listener);
    },
  });

  await import('./sw');
  const listener = listeners.get('message');
  if (!listener) throw new Error('Expected a message listener to have been registered');
  return listener;
}

/**
 * A `Promise<void>` deferred until the test explicitly resolves it.
 * @returns The deferred promise and its resolver.
 */
function createDeferredVoid(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function trackSettled(promise: Promise<unknown>): () => boolean {
  let settled = false;
  promise.then(
    () => {
      settled = true;
    },
    () => {
      settled = true;
    },
  );
  return () => settled;
}

/**
 * Awaits `times` sequential microtask ticks. Deliberately sequential, not
 * `Promise.all`: each tick must observe the previous one's queued
 * continuations before the next one runs, to reliably advance a chain of
 * `.then()` callbacks one microtask at a time.
 * @param times - Number of microtask ticks to await.
 */
async function flushMicrotasks(times = 5): Promise<void> {
  let tick = Promise.resolve();
  for (let i = 0; i < times; i += 1) {
    tick = tick.then(() => undefined);
  }
  await tick;
}

const VALID_REQUEST = { protocolVersion: 1, type: 'GET_SNAPSHOT' };

describe('src/sw.ts message handler', () => {
  beforeEach(() => {
    vi.resetModules();
    handleWorkerMessageMock.mockReset();
    isSameChannelWindowClientMock.mockReset();
    isSameChannelWindowClientMock.mockReturnValue(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the response immediately, then keeps the event alive until runLifetimeWork completes', async () => {
    const listener = await importSwAndGetMessageListener();
    const deferredLifetimeWork = createDeferredVoid();
    const runLifetimeWork = vi.fn(() => deferredLifetimeWork.promise);
    handleWorkerMessageMock.mockResolvedValue({
      response: { protocolVersion: 1, snapshot: { mode: 'manual' } },
      runLifetimeWork,
    });

    const postMessage = vi.fn();
    let waitUntilPromise: Promise<unknown> | undefined;
    listener({
      data: VALID_REQUEST,
      source: {},
      ports: [{ postMessage }],
      waitUntil: (promise) => {
        waitUntilPromise = promise;
      },
    });
    if (!waitUntilPromise) throw new Error('Expected event.waitUntil to have been called');
    const isSettled = trackSettled(waitUntilPromise);

    await flushMicrotasks();

    // The response is already posted, but the event's own lifetime is still
    // pending: `runLifetimeWork`'s returned promise has not resolved yet.
    expect(postMessage).toHaveBeenCalledWith({ protocolVersion: 1, snapshot: { mode: 'manual' } });
    expect(runLifetimeWork).toHaveBeenCalledTimes(1);
    expect(isSettled()).toBe(false);

    deferredLifetimeWork.resolve();
    await flushMicrotasks();

    expect(isSettled()).toBe(true);
  });

  it('never invokes runLifetimeWork before the response has been posted', async () => {
    const listener = await importSwAndGetMessageListener();
    const callOrder: string[] = [];
    const postMessage = vi.fn(() => {
      callOrder.push('postMessage');
    });
    const deferredLifetimeWork = createDeferredVoid();
    const runLifetimeWork = vi.fn(() => {
      callOrder.push('runLifetimeWork');
      return deferredLifetimeWork.promise;
    });
    handleWorkerMessageMock.mockResolvedValue({
      response: { protocolVersion: 1, snapshot: { mode: 'manual' } },
      runLifetimeWork,
    });

    let waitUntilPromise: Promise<unknown> | undefined;
    listener({
      data: VALID_REQUEST,
      source: {},
      ports: [{ postMessage }],
      waitUntil: (promise) => {
        waitUntilPromise = promise;
      },
    });
    if (!waitUntilPromise) throw new Error('Expected event.waitUntil to have been called');

    await flushMicrotasks();

    expect(callOrder).toEqual(['postMessage', 'runLifetimeWork']);

    deferredLifetimeWork.resolve();
    await expect(waitUntilPromise).resolves.toBeUndefined();
  });

  it('a runLifetimeWork rejection never surfaces: the event lifetime still resolves', async () => {
    const listener = await importSwAndGetMessageListener();
    handleWorkerMessageMock.mockResolvedValue({
      response: { protocolVersion: 1, snapshot: { mode: 'manual' } },
      runLifetimeWork: () => Promise.reject(new Error('a future producer forgot to catch this')),
    });

    const postMessage = vi.fn();
    let waitUntilPromise: Promise<unknown> | undefined;
    listener({
      data: VALID_REQUEST,
      source: {},
      ports: [{ postMessage }],
      waitUntil: (promise) => {
        waitUntilPromise = promise;
      },
    });
    if (!waitUntilPromise) throw new Error('Expected event.waitUntil to have been called');

    await expect(waitUntilPromise).resolves.toBeUndefined();
    expect(postMessage).toHaveBeenCalledWith({ protocolVersion: 1, snapshot: { mode: 'manual' } });
  });

  it('a malformed payload (missing protocolVersion) causes no mutation: no handler call, no response, no waitUntil', async () => {
    const listener = await importSwAndGetMessageListener();
    const postMessage = vi.fn();
    const waitUntil = vi.fn();

    listener({
      data: { type: 'GET_SNAPSHOT' },
      source: {},
      ports: [{ postMessage }],
      waitUntil,
    });
    await flushMicrotasks();

    expect(handleWorkerMessageMock).not.toHaveBeenCalled();
    expect(postMessage).not.toHaveBeenCalled();
    expect(waitUntil).not.toHaveBeenCalled();
  });

  it('a completely malformed payload (not an object) causes no mutation', async () => {
    const listener = await importSwAndGetMessageListener();
    const postMessage = vi.fn();
    const waitUntil = vi.fn();

    listener({ data: 'not-a-request', source: {}, ports: [{ postMessage }], waitUntil });
    await flushMicrotasks();

    expect(handleWorkerMessageMock).not.toHaveBeenCalled();
    expect(postMessage).not.toHaveBeenCalled();
    expect(waitUntil).not.toHaveBeenCalled();
  });

  it('a foreign-channel window client is silently ignored: no handler call, no response, no waitUntil', async () => {
    isSameChannelWindowClientMock.mockReturnValue(false);
    const listener = await importSwAndGetMessageListener();
    const postMessage = vi.fn();
    const waitUntil = vi.fn();

    listener({ data: VALID_REQUEST, source: {}, ports: [{ postMessage }], waitUntil });
    await flushMicrotasks();

    expect(handleWorkerMessageMock).not.toHaveBeenCalled();
    expect(postMessage).not.toHaveBeenCalled();
    expect(waitUntil).not.toHaveBeenCalled();
  });

  it('a no-op/read-only request with no runLifetimeWork resolves the event immediately after the response', async () => {
    const listener = await importSwAndGetMessageListener();
    handleWorkerMessageMock.mockResolvedValue({
      response: { protocolVersion: 1, snapshot: { mode: 'manual' } },
    });

    const postMessage = vi.fn();
    let waitUntilPromise: Promise<unknown> | undefined;
    listener({
      data: VALID_REQUEST,
      source: {},
      ports: [{ postMessage }],
      waitUntil: (promise) => {
        waitUntilPromise = promise;
      },
    });
    if (!waitUntilPromise) throw new Error('Expected event.waitUntil to have been called');

    await expect(waitUntilPromise).resolves.toBeUndefined();
    expect(postMessage).toHaveBeenCalledWith({ protocolVersion: 1, snapshot: { mode: 'manual' } });
  });

  it('handleWorkerMessage rejecting still posts the stable v1 failure envelope, without throwing out of the handler or leaking the raw exception message', async () => {
    const listener = await importSwAndGetMessageListener();
    handleWorkerMessageMock.mockRejectedValue(new Error('Controller state is unavailable'));

    const postMessage = vi.fn();
    let waitUntilPromise: Promise<unknown> | undefined;
    listener({
      data: VALID_REQUEST,
      source: {},
      ports: [{ postMessage }],
      waitUntil: (promise) => {
        waitUntilPromise = promise;
      },
    });
    if (!waitUntilPromise) throw new Error('Expected event.waitUntil to have been called');

    await expect(waitUntilPromise).resolves.toBeUndefined();
    expect(postMessage).toHaveBeenCalledWith({ protocolVersion: 1, error: 'unavailable' });
    expect(postMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Controller state is unavailable' }),
    );
  });
});
