import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// `src/sw.ts` wires the browser's real `ServiceWorkerGlobalScope` API
// (`self.addEventListener`, `event.waitUntil`, `event.respondWith`,
// `event.ports`) to the managed-update domain modules. This file isolates
// exactly that wiring — every domain module is mocked — to prove: the
// `message` handler's event-lifetime contract; the Stage 3 same-path
// predecessor probe is answered before normal same-channel window request
// validation and never touches state, cache, or Workbox's own protocol;
// `install` work runs outside `OperationQueue`; and `fetch` routing
// (navigation vs. owned `assets/**` vs. everything else) is decided purely
// from the request's URL, never delegated to `workerFetch.ts`.

const handleWorkerMessageMock = vi.fn();
vi.mock('./shared/service/appUpdate/workerMessages', () => ({
  handleWorkerMessage: (...args: unknown[]) => handleWorkerMessageMock(...args),
}));

const reconcileNavigationMock = vi.fn().mockResolvedValue(undefined);
const updateReconcilerFake = {
  reconcileNavigation: reconcileNavigationMock,
  checkForUpdates: vi.fn(),
  reconcileAfterModeChange: vi.fn(),
};
const createUpdateReconcilerMock = vi.fn((_dependencies: unknown) => updateReconcilerFake);
vi.mock('./shared/service/appUpdate/updateReconciliation', () => ({
  createUpdateReconciler: (dependencies: unknown) => createUpdateReconcilerMock(dependencies),
}));
vi.mock('./shared/service/appUpdate/updateDiscovery', () => ({
  runUpdateReconciliationPass: vi.fn(),
}));

const isSameChannelPathMock = vi.fn((..._args: unknown[]) => true);
const isSameChannelWindowClientMock = vi.fn((..._args: unknown[]) => true);
vi.mock('./shared/service/appUpdate/cleanLaunch', () => ({
  isSameChannelPath: (...args: unknown[]) => isSameChannelPathMock(...args),
  isSameChannelWindowClient: (...args: unknown[]) => isSameChannelWindowClientMock(...args),
}));

vi.mock('./shared/service/appUpdate/workerChannel', () => ({
  deriveManagedChannel: () => 'stable',
  buildManagedChannelBasePath: () => '/',
  deriveManagedChannelOrigin: () => 'https://mioframe.example',
}));

const enqueueMock = vi.fn((operation: () => Promise<unknown>) => operation());
vi.mock('./shared/service/appUpdate/operationQueue', () => ({
  createOperationQueue: () => enqueueMock,
}));

const preparationCoordinatorFake = {
  prepare: vi.fn(),
  runCleanup: (cleanup: (ids: readonly number[]) => Promise<void>) => cleanup([]),
};
vi.mock('./shared/service/appUpdate/preparationCoordinator', () => ({
  createPreparationCoordinator: () => preparationCoordinatorFake,
}));

vi.mock('./shared/service/appUpdate/releaseCache', () => ({
  runReleaseCacheCleanup: vi.fn().mockResolvedValue(undefined),
}));

const handleAssetFetchMock = vi.fn();
const handleNavigationFetchMock = vi.fn();
vi.mock('./shared/service/appUpdate/workerFetch', () => ({
  handleAssetFetch: (...args: unknown[]) => handleAssetFetchMock(...args),
  handleNavigationFetch: (...args: unknown[]) => handleNavigationFetchMock(...args),
}));

const runInstallMock = vi.fn().mockResolvedValue(undefined);
vi.mock('./shared/service/appUpdate/workerInstall', () => ({
  runInstall: (...args: unknown[]) => runInstallMock(...args),
}));

type FakeEvent = {
  data?: unknown;
  source?: unknown;
  ports?: Array<{ postMessage: (message: unknown) => void }>;
  request?: Request;
  waitUntil: (promise: Promise<unknown>) => void;
  respondWith?: (promise: unknown) => void;
};
type FakeListener = (event: FakeEvent) => void;

const FAKE_ACTIVE = { fake: 'registration.active' };

/**
 * Stubs `self` well enough for `src/sw.ts`'s module-level setup to run,
 * imports it fresh, and returns every event listener it registered.
 * @returns The listeners `src/sw.ts` registered via `self.addEventListener()`, keyed by event type.
 */
async function importSwAndGetListeners(): Promise<Map<string, FakeListener>> {
  const listeners = new Map<string, FakeListener>();
  vi.stubGlobal('self', {
    registration: { scope: 'https://mioframe.example/', active: FAKE_ACTIVE },
    clients: { matchAll: vi.fn().mockResolvedValue([]) },
    addEventListener: (type: string, listener: FakeListener) => {
      listeners.set(type, listener);
    },
  });

  await import('./sw');
  return listeners;
}

async function importSwAndGetMessageListener(): Promise<FakeListener> {
  const listeners = await importSwAndGetListeners();
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
const PROBE_REQUEST = { protocolVersion: 1, type: 'PROBE_MANAGED_UPDATE_CONTROLLER' };

beforeEach(() => {
  vi.resetModules();
  handleWorkerMessageMock.mockReset();
  isSameChannelPathMock.mockReset();
  isSameChannelPathMock.mockReturnValue(true);
  isSameChannelWindowClientMock.mockReset();
  isSameChannelWindowClientMock.mockReturnValue(true);
  enqueueMock.mockClear();
  handleAssetFetchMock.mockReset();
  handleNavigationFetchMock.mockReset();
  runInstallMock.mockReset();
  runInstallMock.mockResolvedValue(undefined);
  reconcileNavigationMock.mockReset().mockResolvedValue(undefined);
  createUpdateReconcilerMock.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('src/sw.ts message handler', () => {
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
    expect(handleWorkerMessageMock.mock.calls[0]?.[6]).toBe(updateReconcilerFake);
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

describe('src/sw.ts Stage 3 predecessor probe handling', () => {
  it("answers the exact managed probe with the exact response, naming this worker's own channel", async () => {
    const listener = await importSwAndGetMessageListener();
    const postMessage = vi.fn();

    listener({ data: PROBE_REQUEST, source: {}, ports: [{ postMessage }], waitUntil: vi.fn() });
    await flushMicrotasks();

    expect(postMessage).toHaveBeenCalledWith({
      protocolVersion: 1,
      kind: 'managed-update-controller',
      channel: 'stable',
    });
  });

  it('answers the probe before the same-channel window-client check: a non-window sender (another service worker) is still answered', async () => {
    isSameChannelWindowClientMock.mockReturnValue(false);
    const listener = await importSwAndGetMessageListener();
    const postMessage = vi.fn();

    listener({ data: PROBE_REQUEST, source: {}, ports: [{ postMessage }], waitUntil: vi.fn() });
    await flushMicrotasks();

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'managed-update-controller' }),
    );
    expect(isSameChannelWindowClientMock).not.toHaveBeenCalled();
  });

  it('reads no state and mutates nothing: normal protocol routing is never reached for a probe', async () => {
    const listener = await importSwAndGetMessageListener();
    const postMessage = vi.fn();
    const waitUntil = vi.fn();

    listener({ data: PROBE_REQUEST, source: {}, ports: [{ postMessage }], waitUntil });
    await flushMicrotasks();

    expect(handleWorkerMessageMock).not.toHaveBeenCalled();
    expect(waitUntil).not.toHaveBeenCalled();
  });

  it('never answers a Workbox CACHE_URLS probe: no reply, no protocol routing', async () => {
    const listener = await importSwAndGetMessageListener();
    const postMessage = vi.fn();
    const waitUntil = vi.fn();

    listener({
      data: { type: 'CACHE_URLS', payload: { urlsToCache: [] } },
      source: {},
      ports: [{ postMessage }],
      waitUntil,
    });
    await flushMicrotasks();

    expect(postMessage).not.toHaveBeenCalled();
    expect(handleWorkerMessageMock).not.toHaveBeenCalled();
    expect(waitUntil).not.toHaveBeenCalled();
  });

  it('normal application protocol requests still route through the same-channel window-client check unchanged', async () => {
    isSameChannelWindowClientMock.mockReturnValue(false);
    const listener = await importSwAndGetMessageListener();
    const postMessage = vi.fn();
    const waitUntil = vi.fn();

    listener({ data: VALID_REQUEST, source: {}, ports: [{ postMessage }], waitUntil });
    await flushMicrotasks();

    expect(isSameChannelWindowClientMock).toHaveBeenCalled();
    expect(handleWorkerMessageMock).not.toHaveBeenCalled();
  });
});

describe('src/sw.ts install wiring', () => {
  it('runs install work directly, never wrapped in OperationQueue, passing self.registration.active through', async () => {
    const listeners = await importSwAndGetListeners();
    const listener = listeners.get('install');
    if (!listener) throw new Error('Expected an install listener to have been registered');
    const waitUntil = vi.fn();

    listener({ waitUntil });

    expect(runInstallMock).toHaveBeenCalledWith(
      'stable',
      '/',
      FAKE_ACTIVE,
      preparationCoordinatorFake,
    );
    expect(enqueueMock).not.toHaveBeenCalled();
    expect(waitUntil).toHaveBeenCalledTimes(1);
  });
});

describe('src/sw.ts fetch routing', () => {
  function createFakeFetchEvent(
    url: string,
    mode: 'navigate' | 'same-origin' = 'same-origin',
    destination: RequestDestination = '',
  ): {
    event: FakeEvent;
    respondWith: ReturnType<typeof vi.fn>;
    waitUntil: ReturnType<typeof vi.fn>;
  } {
    const respondWith = vi.fn();
    const waitUntil = vi.fn();
    // The Fetch API's public `Request` constructor rejects `mode: 'navigate'`
    // (it is reserved for browser-triggered navigations), so a real
    // navigation request is simulated by overriding the read-only `mode`
    // getter on an ordinary constructed instance instead.
    const request = new Request(url);
    if (mode === 'navigate') Object.defineProperty(request, 'mode', { value: 'navigate' });
    Object.defineProperty(request, 'destination', { value: destination });
    return { event: { request, respondWith, waitUntil }, respondWith, waitUntil };
  }

  it('intercepts a same-channel top-level navigation', async () => {
    const listeners = await importSwAndGetListeners();
    const listener = listeners.get('fetch');
    if (!listener) throw new Error('Expected a fetch listener to have been registered');
    const { event, respondWith } = createFakeFetchEvent(
      'https://mioframe.example/',
      'navigate',
      'document',
    );

    listener(event);

    expect(respondWith).toHaveBeenCalledTimes(1);
    expect(handleNavigationFetchMock).toHaveBeenCalledWith(
      'stable',
      '/',
      event.request,
      preparationCoordinatorFake,
    );
  });

  it('navigation attaches reconciliation to waitUntil separately from respondWith', async () => {
    const listeners = await importSwAndGetListeners();
    const listener = listeners.get('fetch');
    if (!listener) throw new Error('Expected a fetch listener to have been registered');
    const { event, respondWith, waitUntil } = createFakeFetchEvent(
      'https://mioframe.example/',
      'navigate',
      'document',
    );

    listener(event);

    expect(reconcileNavigationMock).toHaveBeenCalledTimes(1);
    expect(waitUntil).toHaveBeenCalledTimes(1);
    expect(respondWith.mock.calls[0]?.[0]).not.toBe(waitUntil.mock.calls[0]?.[0]);
  });

  it.each(['iframe', 'embed'] as const)(
    'does not intercept navigate mode with non-document destination %s',
    async (destination) => {
      const listeners = await importSwAndGetListeners();
      const listener = listeners.get('fetch');
      if (!listener) throw new Error('Expected a fetch listener to have been registered');
      const { event, respondWith } = createFakeFetchEvent(
        'https://mioframe.example/',
        'navigate',
        destination,
      );

      listener(event);

      expect(respondWith).not.toHaveBeenCalled();
      expect(handleNavigationFetchMock).not.toHaveBeenCalled();
    },
  );

  it('intercepts a same-channel assets/** request', async () => {
    const listeners = await importSwAndGetListeners();
    const listener = listeners.get('fetch');
    if (!listener) throw new Error('Expected a fetch listener to have been registered');
    const { event, respondWith } = createFakeFetchEvent('https://mioframe.example/assets/app.js');

    listener(event);

    expect(respondWith).toHaveBeenCalledTimes(1);
    expect(handleAssetFetchMock).toHaveBeenCalledWith(
      'stable',
      '/',
      event.request,
      preparationCoordinatorFake,
    );
  });

  it("does not intercept updates/** (the worker's own metadata fetches)", async () => {
    const listeners = await importSwAndGetListeners();
    const listener = listeners.get('fetch');
    if (!listener) throw new Error('Expected a fetch listener to have been registered');
    const { event, respondWith } = createFakeFetchEvent(
      'https://mioframe.example/updates/latest.json',
    );

    listener(event);

    expect(respondWith).not.toHaveBeenCalled();
    expect(handleAssetFetchMock).not.toHaveBeenCalled();
  });

  it('does not intercept a non-asset same-channel request (manifest)', async () => {
    const listeners = await importSwAndGetListeners();
    const listener = listeners.get('fetch');
    if (!listener) throw new Error('Expected a fetch listener to have been registered');
    const { event, respondWith } = createFakeFetchEvent(
      'https://mioframe.example/manifest.webmanifest',
    );

    listener(event);

    expect(respondWith).not.toHaveBeenCalled();
    expect(handleAssetFetchMock).not.toHaveBeenCalled();
  });

  it('does not intercept a non-asset same-channel API request', async () => {
    const listeners = await importSwAndGetListeners();
    const listener = listeners.get('fetch');
    if (!listener) throw new Error('Expected a fetch listener to have been registered');
    const { event, respondWith } = createFakeFetchEvent('https://mioframe.example/api/whoami');

    listener(event);

    expect(respondWith).not.toHaveBeenCalled();
  });

  it('does not intercept a foreign-channel path', async () => {
    isSameChannelPathMock.mockReturnValue(false);
    const listeners = await importSwAndGetListeners();
    const listener = listeners.get('fetch');
    if (!listener) throw new Error('Expected a fetch listener to have been registered');
    const { event, respondWith } = createFakeFetchEvent(
      'https://mioframe.example/branch/develop/',
      'navigate',
      'document',
    );

    listener(event);

    expect(respondWith).not.toHaveBeenCalled();
    expect(handleNavigationFetchMock).not.toHaveBeenCalled();
  });
});
