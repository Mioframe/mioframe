import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReconciliationFailure } from './shared/service/appUpdate/updateReconciliation';

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

type FakeSentryBackendModule = { init: unknown; captureException: unknown };
// Hoisted (not plain top-level `const`): `updateReconciliation.ts`'s real
// module — reached through this file's own `vi.mock('./shared/service/
// appUpdate/updateReconciliation', ...)` `importOriginal()` call below —
// itself now statically imports `@shared/lib/diagnostics`, so this factory
// can run before an ordinary `const` declared later in this file would have
// initialized; `vi.hoisted()` guarantees these are ready first.
const {
  registerSentryBackendMock,
  registerSentryConfigMock,
  readPersistedDiagnosticsPolicyMock,
  applyDiagnosticsRuntimeStateMock,
  getOrCreateSentrySessionIdMock,
  drainDiagnosticsMock,
  captureDiagnosticExceptionMock,
} = vi.hoisted(() => ({
  registerSentryBackendMock: vi.fn<(loader: () => Promise<FakeSentryBackendModule>) => void>(),
  registerSentryConfigMock: vi.fn(),
  readPersistedDiagnosticsPolicyMock: vi.fn(),
  applyDiagnosticsRuntimeStateMock: vi.fn(),
  getOrCreateSentrySessionIdMock: vi.fn(),
  drainDiagnosticsMock: vi.fn(),
  captureDiagnosticExceptionMock: vi.fn(),
}));
vi.mock('./shared/lib/diagnostics', async (importOriginal) => {
  // `zodDiagnosticsPolicySyncMessage` is kept real (not mocked): its own
  // validation behavior is exactly what these tests prove.
  const actual = await importOriginal<typeof import('./shared/lib/diagnostics')>();
  return {
    zodDiagnosticsPolicySyncMessage: actual.zodDiagnosticsPolicySyncMessage,
    applyDiagnosticsRuntimeState: (...args: unknown[]) => applyDiagnosticsRuntimeStateMock(...args),
    captureDiagnosticException: (...args: unknown[]) => captureDiagnosticExceptionMock(...args),
    drainDiagnostics: (...args: unknown[]) => drainDiagnosticsMock(...args),
    getOrCreateSentrySessionId: (...args: unknown[]) => getOrCreateSentrySessionIdMock(...args),
    registerSentryBackend: registerSentryBackendMock,
    registerSentryConfig: (...args: unknown[]) => registerSentryConfigMock(...args),
  };
});
vi.mock('./shared/service/diagnostics/readPersistedDiagnosticsPolicy', () => ({
  readPersistedDiagnosticsPolicy: (...args: unknown[]) =>
    readPersistedDiagnosticsPolicyMock(...args),
}));

const sentryBrowserStub = {
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  init: vi.fn(),
  setUser: vi.fn(),
  flush: vi.fn(() => Promise.resolve(true)),
};
vi.mock('@sentry/browser', () => sentryBrowserStub);

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
vi.mock('./shared/service/appUpdate/updateReconciliation', async (importOriginal) => {
  // `ReconciliationFailure` is imported directly by `src/sw.ts` (for its
  // `error instanceof ReconciliationFailure` check) and must stay the real
  // class here — only `createUpdateReconciler` itself is faked, so an
  // `instanceof` check against the real class still works in every test.
  const actual =
    await importOriginal<typeof import('./shared/service/appUpdate/updateReconciliation')>();
  return {
    ...actual,
    createUpdateReconciler: (dependencies: unknown) => createUpdateReconcilerMock(dependencies),
  };
});
vi.mock('./shared/service/appUpdate/updateDiscovery', () => ({
  runUpdateReconciliationPass: vi.fn(),
  runReconciliationEffects: vi.fn(),
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
  clientId?: string;
  resultingClientId?: string;
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
  registerSentryBackendMock.mockReset();
  registerSentryConfigMock.mockReset();
  readPersistedDiagnosticsPolicyMock.mockReset().mockResolvedValue('unknown');
  applyDiagnosticsRuntimeStateMock.mockReset().mockResolvedValue(undefined);
  getOrCreateSentrySessionIdMock.mockReset().mockReturnValue('session:test-id');
  drainDiagnosticsMock.mockReset().mockResolvedValue(undefined);
  handleWorkerMessageMock.mockReset();
  isSameChannelPathMock.mockReset();
  isSameChannelPathMock.mockReturnValue(true);
  isSameChannelWindowClientMock.mockReset();
  isSameChannelWindowClientMock.mockReturnValue(true);
  enqueueMock.mockClear();
  handleAssetFetchMock.mockReset();
  handleAssetFetchMock.mockResolvedValue({
    response: new Response('asset'),
    diagnosticsPending: false,
  });
  handleNavigationFetchMock.mockReset();
  handleNavigationFetchMock.mockResolvedValue({ response: new Response('navigation') });
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
    await expect(waitUntilPromise).resolves.toBeUndefined();
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

  it('a ReconciliationFailure from a Check-created attempt still runs its own effects, exactly once, strictly after the fallback response', async () => {
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
    handleWorkerMessageMock.mockRejectedValue(
      new ReconciliationFailure(new Error('final rerun failed'), runLifetimeWork),
    );

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

    expect(postMessage).toHaveBeenCalledWith({ protocolVersion: 1, error: 'unavailable' });
    expect(callOrder).toEqual(['postMessage', 'runLifetimeWork']);
    expect(runLifetimeWork).toHaveBeenCalledTimes(1);
    expect(isSettled()).toBe(false);

    deferredLifetimeWork.resolve();
    await expect(waitUntilPromise).resolves.toBeUndefined();
  });

  it('a ReconciliationFailure whose own effects reject never surfaces: the event lifetime still resolves', async () => {
    const listener = await importSwAndGetMessageListener();
    handleWorkerMessageMock.mockRejectedValue(
      new ReconciliationFailure(new Error('final rerun failed'), () =>
        Promise.reject(new Error('broadcast failed')),
      ),
    );

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
    return {
      event: {
        request,
        clientId: 'current-client',
        resultingClientId: 'resulting-client',
        respondWith,
        waitUntil,
      },
      respondWith,
      waitUntil,
    };
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
      { clientId: 'current-client', resultingClientId: 'resulting-client' },
      expect.objectContaining({
        channelOrigin: 'https://mioframe.example',
        enqueue: enqueueMock,
        matchWindowClients: expect.any(Function),
      }),
    );
  });

  it('navigation attaches reconciliation to waitUntil separately from respondWith, only after the response resolves', async () => {
    const listeners = await importSwAndGetListeners();
    const listener = listeners.get('fetch');
    if (!listener) throw new Error('Expected a fetch listener to have been registered');
    const { event, respondWith, waitUntil } = createFakeFetchEvent(
      'https://mioframe.example/',
      'navigate',
      'document',
    );

    listener(event);

    // Reconciliation must not start before this navigation's own response
    // has resolved, so it is not yet called synchronously here.
    expect(reconcileNavigationMock).not.toHaveBeenCalled();
    expect(waitUntil).toHaveBeenCalledTimes(1);
    expect(respondWith.mock.calls[0]?.[0]).not.toBe(waitUntil.mock.calls[0]?.[0]);

    await flushMicrotasks();
    expect(reconcileNavigationMock).toHaveBeenCalledTimes(1);
  });

  it('starts both navigation lifetime work and reconciliation only after the response resolves, never before', async () => {
    const listeners = await importSwAndGetListeners();
    const listener = listeners.get('fetch');
    if (!listener) throw new Error('Expected a fetch listener to have been registered');
    let resolveResult!: (value: {
      response: Response;
      runLifetimeWork: () => Promise<void>;
    }) => void;
    const resultPromise = new Promise<{
      response: Response;
      runLifetimeWork: () => Promise<void>;
    }>((resolve) => {
      resolveResult = resolve;
    });
    const order: string[] = [];
    const runLifetimeWork = vi.fn(() => {
      order.push('lifetime');
      return Promise.resolve();
    });
    handleNavigationFetchMock.mockReturnValue(resultPromise);
    reconcileNavigationMock.mockImplementation(() => {
      order.push('reconcile');
      return Promise.resolve();
    });
    const { event, respondWith, waitUntil } = createFakeFetchEvent(
      'https://mioframe.example/',
      'navigate',
      'document',
    );

    listener(event);

    const responsePromise = respondWith.mock.calls[0]?.[0];
    if (!(responsePromise instanceof Promise)) throw new Error('Expected a response promise');
    void responsePromise.then(() => {
      order.push('response');
    });
    await flushMicrotasks();
    // Neither follow-up item has started: the response itself has not
    // resolved yet (`resolveResult` has not been called).
    expect(order).toEqual([]);
    expect(runLifetimeWork).not.toHaveBeenCalled();
    expect(reconcileNavigationMock).not.toHaveBeenCalled();

    resolveResult({ response: new Response('candidate'), runLifetimeWork });
    const response = await responsePromise;
    if (!(response instanceof Response)) throw new Error('Expected a navigation response');
    expect(await response.text()).toBe('candidate');
    await waitUntil.mock.calls[0]?.[0];
    // Both follow-up items ran — they could only ever do so once
    // `responsePromise` (which they are both direct `.then()` continuations
    // of) had already settled, which the pre-resolution assertions above
    // already proved.
    expect(order).toContain('response');
    expect(order).toContain('lifetime');
    expect(order).toContain('reconcile');
  });

  it('keeps waitUntil pending when reconciliation rejects while navigation lifetime work remains pending', async () => {
    const deferredLifetimeWork = createDeferredVoid();
    const runLifetimeWork = vi.fn(() => deferredLifetimeWork.promise);
    handleNavigationFetchMock.mockResolvedValue({
      response: new Response('candidate'),
      runLifetimeWork,
    });
    reconcileNavigationMock.mockRejectedValue(new Error('reconciliation failed'));
    const listeners = await importSwAndGetListeners();
    const listener = listeners.get('fetch');
    if (!listener) throw new Error('Expected a fetch listener to have been registered');
    const { event, waitUntil } = createFakeFetchEvent(
      'https://mioframe.example/',
      'navigate',
      'document',
    );

    listener(event);

    const waitUntilPromise = waitUntil.mock.calls[0]?.[0];
    if (!(waitUntilPromise instanceof Promise)) throw new Error('Expected a waitUntil promise');
    const isSettled = trackSettled(waitUntilPromise);
    await flushMicrotasks();

    expect(runLifetimeWork).toHaveBeenCalledTimes(1);
    expect(isSettled()).toBe(false);

    deferredLifetimeWork.resolve();
    await expect(waitUntilPromise).resolves.toBeUndefined();
  });

  it('keeps waitUntil pending when navigation lifetime work rejects while reconciliation remains pending', async () => {
    const deferredReconciliation = createDeferredVoid();
    const runLifetimeWork = vi.fn(() => Promise.reject(new Error('broadcast failed')));
    handleNavigationFetchMock.mockResolvedValue({
      response: new Response('candidate'),
      runLifetimeWork,
    });
    reconcileNavigationMock.mockReturnValue(deferredReconciliation.promise);
    const listeners = await importSwAndGetListeners();
    const listener = listeners.get('fetch');
    if (!listener) throw new Error('Expected a fetch listener to have been registered');
    const { event, waitUntil } = createFakeFetchEvent(
      'https://mioframe.example/',
      'navigate',
      'document',
    );

    listener(event);

    const waitUntilPromise = waitUntil.mock.calls[0]?.[0];
    if (!(waitUntilPromise instanceof Promise)) throw new Error('Expected a waitUntil promise');
    const isSettled = trackSettled(waitUntilPromise);
    await flushMicrotasks();

    expect(runLifetimeWork).toHaveBeenCalledTimes(1);
    expect(isSettled()).toBe(false);

    deferredReconciliation.resolve();
    await expect(waitUntilPromise).resolves.toBeUndefined();
  });

  it('resolves waitUntil when both navigation lifetime work and reconciliation fail', async () => {
    handleNavigationFetchMock.mockResolvedValue({
      response: new Response('candidate'),
      runLifetimeWork: () => Promise.reject(new Error('broadcast failed')),
    });
    reconcileNavigationMock.mockRejectedValue(new Error('reconciliation failed'));
    const listeners = await importSwAndGetListeners();
    const listener = listeners.get('fetch');
    if (!listener) throw new Error('Expected a fetch listener to have been registered');
    const { event, waitUntil } = createFakeFetchEvent(
      'https://mioframe.example/',
      'navigate',
      'document',
    );

    listener(event);

    await expect(waitUntil.mock.calls[0]?.[0]).resolves.toBeUndefined();
  });

  it('resolves the navigation response while both lifetime branches are still pending', async () => {
    const deferredLifetimeWork = createDeferredVoid();
    const deferredReconciliation = createDeferredVoid();
    const response = new Response('candidate');
    const runLifetimeWork = vi.fn(() => deferredLifetimeWork.promise);
    handleNavigationFetchMock.mockResolvedValue({ response, runLifetimeWork });
    reconcileNavigationMock.mockReturnValue(deferredReconciliation.promise);
    const listeners = await importSwAndGetListeners();
    const listener = listeners.get('fetch');
    if (!listener) throw new Error('Expected a fetch listener to have been registered');
    const { event, respondWith, waitUntil } = createFakeFetchEvent(
      'https://mioframe.example/',
      'navigate',
      'document',
    );

    listener(event);

    const responsePromise = respondWith.mock.calls[0]?.[0];
    if (!(responsePromise instanceof Promise)) throw new Error('Expected a response promise');
    const waitUntilPromise = waitUntil.mock.calls[0]?.[0];
    if (!(waitUntilPromise instanceof Promise)) throw new Error('Expected a waitUntil promise');
    const isSettled = trackSettled(waitUntilPromise);

    await expect(responsePromise).resolves.toBe(response);
    await flushMicrotasks();
    expect(runLifetimeWork).toHaveBeenCalledTimes(1);
    expect(isSettled()).toBe(false);

    deferredLifetimeWork.resolve();
    await flushMicrotasks();
    expect(isSettled()).toBe(false);

    deferredReconciliation.resolve();
    await expect(waitUntilPromise).resolves.toBeUndefined();
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

describe('src/sw.ts diagnostics bootstrap', () => {
  it('registers a statically bundled @sentry/browser backend, never a lazy import', async () => {
    await importSwAndGetListeners();

    expect(registerSentryBackendMock).toHaveBeenCalledTimes(1);
    const loader = registerSentryBackendMock.mock.calls[0]?.[0];
    if (!loader)
      throw new Error('Expected registerSentryBackend to have been called with a loader');
    const backendModule = await loader();

    expect(backendModule.init).toBe(sentryBrowserStub.init);
    expect(backendModule.captureException).toBe(sentryBrowserStub.captureException);
  });

  it('registers static Sentry config independently of the update-controller state', async () => {
    await importSwAndGetListeners();

    expect(registerSentryConfigMock).toHaveBeenCalledTimes(1);
    expect(registerSentryConfigMock).toHaveBeenCalledWith(
      expect.objectContaining({ isVerbose: expect.any(Boolean), enabled: expect.any(Boolean) }),
    );
  });

  it('reads the persisted diagnostics policy and applies it with an in-memory session id', async () => {
    readPersistedDiagnosticsPolicyMock.mockResolvedValue('enabled');
    await importSwAndGetListeners();
    await flushMicrotasks();

    expect(readPersistedDiagnosticsPolicyMock).toHaveBeenCalledTimes(1);
    expect(applyDiagnosticsRuntimeStateMock).toHaveBeenCalledWith({
      sessionId: 'session:test-id',
      reportingState: 'enabled',
    });
  });

  it('never lets a persisted-policy read failure affect worker bootstrap', async () => {
    readPersistedDiagnosticsPolicyMock.mockRejectedValue(new Error('IndexedDB unavailable'));

    await expect(importSwAndGetListeners()).resolves.toBeInstanceOf(Map);
  });

  it('gives the persisted-policy read a bounded opportunity to apply before install drains, so pre-bootstrap queued diagnostics can still be delivered', async () => {
    let resolvePolicy!: (state: string) => void;
    readPersistedDiagnosticsPolicyMock.mockReturnValue(
      new Promise((resolve) => {
        resolvePolicy = resolve;
      }),
    );
    const listeners = await importSwAndGetListeners();
    drainDiagnosticsMock.mockClear();
    applyDiagnosticsRuntimeStateMock.mockClear();
    const listener = listeners.get('install');
    if (!listener) throw new Error('Expected an install listener to have been registered');
    const waitUntil = vi.fn();

    listener({ waitUntil });
    await flushMicrotasks();
    // `runInstall` has already resolved, but the persisted-policy read is
    // still in flight: the drain must not have run yet.
    expect(drainDiagnosticsMock).not.toHaveBeenCalled();

    resolvePolicy('enabled');
    await waitUntil.mock.calls[0]?.[0];

    expect(applyDiagnosticsRuntimeStateMock).toHaveBeenCalledWith({
      sessionId: 'session:test-id',
      reportingState: 'enabled',
    });
    expect(drainDiagnosticsMock).toHaveBeenCalledTimes(1);
  });

  it('never lets a stuck persisted-policy read indefinitely hold the install event lifetime', async () => {
    vi.useFakeTimers();
    readPersistedDiagnosticsPolicyMock.mockReturnValue(new Promise(() => {}));
    const listeners = await importSwAndGetListeners();
    drainDiagnosticsMock.mockClear();
    const listener = listeners.get('install');
    if (!listener) throw new Error('Expected an install listener to have been registered');
    const waitUntil = vi.fn();

    listener({ waitUntil });
    const installPromise = waitUntil.mock.calls[0]?.[0];
    if (!(installPromise instanceof Promise)) throw new Error('Expected a waitUntil promise');
    const isSettled = trackSettled(installPromise);

    await vi.advanceTimersByTimeAsync(999);
    expect(isSettled()).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await installPromise;

    expect(isSettled()).toBe(true);
    expect(drainDiagnosticsMock).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});

describe('src/sw.ts diagnostics-policy live sync message', () => {
  const SYNC_MESSAGE = {
    type: 'DIAGNOSTICS_POLICY_SYNC',
    reportingState: 'enabled',
    sessionId: 'session:aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb',
  };

  it('applies the synced state and never posts a response or dispatches to the update protocol', async () => {
    const listener = await importSwAndGetMessageListener();
    applyDiagnosticsRuntimeStateMock.mockClear();
    const postMessage = vi.fn();
    const waitUntil = vi.fn();

    listener({ data: SYNC_MESSAGE, source: {}, ports: [{ postMessage }], waitUntil });
    await flushMicrotasks();

    expect(applyDiagnosticsRuntimeStateMock).toHaveBeenCalledWith({
      reportingState: 'enabled',
      sessionId: 'session:aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb',
    });
    expect(postMessage).not.toHaveBeenCalled();
    expect(handleWorkerMessageMock).not.toHaveBeenCalled();
    expect(waitUntil).toHaveBeenCalledTimes(1);
  });

  it('is rejected from a foreign-channel window client, exactly like the update protocol', async () => {
    isSameChannelWindowClientMock.mockReturnValue(false);
    const listener = await importSwAndGetMessageListener();
    applyDiagnosticsRuntimeStateMock.mockClear();
    const waitUntil = vi.fn();

    listener({ data: SYNC_MESSAGE, source: {}, ports: [], waitUntil });
    await flushMicrotasks();

    expect(applyDiagnosticsRuntimeStateMock).not.toHaveBeenCalled();
    expect(waitUntil).not.toHaveBeenCalled();
  });

  it('ignores a malformed sync payload safely, falling through to normal protocol handling', async () => {
    const listener = await importSwAndGetMessageListener();
    applyDiagnosticsRuntimeStateMock.mockClear();
    const postMessage = vi.fn();
    const waitUntil = vi.fn();

    listener({
      data: { type: 'DIAGNOSTICS_POLICY_SYNC', reportingState: 'not-a-real-state' },
      source: {},
      ports: [{ postMessage }],
      waitUntil,
    });
    await flushMicrotasks();

    expect(applyDiagnosticsRuntimeStateMock).not.toHaveBeenCalled();
    expect(handleWorkerMessageMock).not.toHaveBeenCalled();
    expect(postMessage).not.toHaveBeenCalled();
    expect(waitUntil).not.toHaveBeenCalled();
  });

  it('never crashes the handler when applying the runtime state rejects', async () => {
    applyDiagnosticsRuntimeStateMock.mockRejectedValue(new Error('Sentry init failed'));
    const listener = await importSwAndGetMessageListener();
    const waitUntil = vi.fn();

    listener({ data: SYNC_MESSAGE, source: {}, ports: [], waitUntil });

    await expect(waitUntil.mock.calls[0]?.[0]).resolves.toBeUndefined();
  });

  it('drains diagnostics after applying the synced state', async () => {
    const listener = await importSwAndGetMessageListener();
    drainDiagnosticsMock.mockClear();
    const waitUntil = vi.fn();

    listener({ data: SYNC_MESSAGE, source: {}, ports: [], waitUntil });
    await waitUntil.mock.calls[0]?.[0];

    expect(drainDiagnosticsMock).toHaveBeenCalledTimes(1);
  });

  it('a live sync received while the startup bootstrap read is still in flight wins: the later-resolving stale read never overwrites it', async () => {
    let resolveStartupPolicy!: (state: string) => void;
    readPersistedDiagnosticsPolicyMock.mockReturnValue(
      new Promise((resolve) => {
        resolveStartupPolicy = resolve;
      }),
    );
    const listener = await importSwAndGetMessageListener();
    applyDiagnosticsRuntimeStateMock.mockClear();
    const waitUntil = vi.fn();

    listener({ data: SYNC_MESSAGE, source: {}, ports: [], waitUntil });
    await flushMicrotasks();

    expect(applyDiagnosticsRuntimeStateMock).toHaveBeenCalledExactlyOnceWith({
      reportingState: 'enabled',
      sessionId: 'session:aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb',
    });

    // The startup bootstrap read now resolves with a stale value, after the
    // live sync above already applied — it must never overwrite it.
    resolveStartupPolicy('disabled');
    await flushMicrotasks();

    expect(applyDiagnosticsRuntimeStateMock).toHaveBeenCalledTimes(1);
  });
});

describe('src/sw.ts bounded diagnostics drain wiring', () => {
  it('drains after install completes', async () => {
    const listeners = await importSwAndGetListeners();
    drainDiagnosticsMock.mockClear();
    const listener = listeners.get('install');
    if (!listener) throw new Error('Expected an install listener to have been registered');
    const waitUntil = vi.fn();

    listener({ waitUntil });
    await waitUntil.mock.calls[0]?.[0];

    expect(drainDiagnosticsMock).toHaveBeenCalledTimes(1);
  });

  it('drains after install fails, without changing install failure', async () => {
    runInstallMock.mockRejectedValue(new Error('preparation failed'));
    const listeners = await importSwAndGetListeners();
    drainDiagnosticsMock.mockClear();
    const listener = listeners.get('install');
    if (!listener) throw new Error('Expected an install listener to have been registered');
    const waitUntil = vi.fn();

    listener({ waitUntil });

    await expect(waitUntil.mock.calls[0]?.[0]).rejects.toThrow('preparation failed');
    expect(drainDiagnosticsMock).toHaveBeenCalledTimes(1);
  });

  it('drains after activate cleanup completes', async () => {
    const listeners = await importSwAndGetListeners();
    drainDiagnosticsMock.mockClear();
    const listener = listeners.get('activate');
    if (!listener) throw new Error('Expected an activate listener to have been registered');
    const waitUntil = vi.fn();

    listener({ waitUntil });
    await waitUntil.mock.calls[0]?.[0];

    expect(drainDiagnosticsMock).toHaveBeenCalledTimes(1);
  });

  it('drains after navigation follow-up work settles, never inside respondWith', async () => {
    const listeners = await importSwAndGetListeners();
    drainDiagnosticsMock.mockClear();
    const listener = listeners.get('fetch');
    if (!listener) throw new Error('Expected a fetch listener to have been registered');
    const request = new Request('https://mioframe.example/');
    Object.defineProperty(request, 'mode', { value: 'navigate' });
    Object.defineProperty(request, 'destination', { value: 'document' });
    const respondWith = vi.fn();
    const waitUntil = vi.fn();

    listener({ request, clientId: '', resultingClientId: '', respondWith, waitUntil });
    const responsePromise = respondWith.mock.calls[0]?.[0];
    if (!(responsePromise instanceof Promise)) throw new Error('Expected a response promise');
    await responsePromise;
    expect(drainDiagnosticsMock).not.toHaveBeenCalled();

    await waitUntil.mock.calls[0]?.[0];
    expect(drainDiagnosticsMock).toHaveBeenCalledTimes(1);
  });

  it('never drains for an ordinary asset fetch', async () => {
    const listeners = await importSwAndGetListeners();
    drainDiagnosticsMock.mockClear();
    const listener = listeners.get('fetch');
    if (!listener) throw new Error('Expected a fetch listener to have been registered');
    const respondWith = vi.fn();
    const waitUntil = vi.fn();

    listener({
      request: new Request('https://mioframe.example/assets/app.js'),
      respondWith,
      waitUntil,
    });
    await flushMicrotasks();

    expect(drainDiagnosticsMock).not.toHaveBeenCalled();
  });

  it('drains after an unexpected asset-serving failure flags a diagnostic pending, without delaying the response', async () => {
    handleAssetFetchMock.mockResolvedValue({
      response: new Response('unavailable', { status: 503 }),
      diagnosticsPending: true,
    });
    const listeners = await importSwAndGetListeners();
    drainDiagnosticsMock.mockClear();
    const listener = listeners.get('fetch');
    if (!listener) throw new Error('Expected a fetch listener to have been registered');
    const respondWith = vi.fn();
    const waitUntil = vi.fn();

    listener({
      request: new Request('https://mioframe.example/assets/app.js'),
      respondWith,
      waitUntil,
    });

    const responsePromise = respondWith.mock.calls[0]?.[0];
    if (!(responsePromise instanceof Promise)) throw new Error('Expected a response promise');
    const response = await responsePromise;
    if (!(response instanceof Response)) throw new Error('Expected a Response');
    expect(response.status).toBe(503);
    // The response already resolved above, independent of the diagnostics
    // drain below, which is only awaited afterwards.
    expect(drainDiagnosticsMock).not.toHaveBeenCalled();

    await waitUntil.mock.calls[0]?.[0];
    expect(drainDiagnosticsMock).toHaveBeenCalledTimes(1);
  });

  it('drains after a successful update-protocol command response', async () => {
    handleWorkerMessageMock.mockResolvedValue({
      response: { protocolVersion: 1, snapshot: { mode: 'manual' } },
    });
    const listener = await importSwAndGetMessageListener();
    drainDiagnosticsMock.mockClear();
    const waitUntil = vi.fn();

    listener({
      data: VALID_REQUEST,
      source: {},
      ports: [{ postMessage: vi.fn() }],
      waitUntil,
    });
    await waitUntil.mock.calls[0]?.[0];

    expect(drainDiagnosticsMock).toHaveBeenCalledTimes(1);
  });

  it('drains after a failed update-protocol command response', async () => {
    handleWorkerMessageMock.mockRejectedValue(new Error('Controller state is unavailable'));
    const listener = await importSwAndGetMessageListener();
    drainDiagnosticsMock.mockClear();
    const waitUntil = vi.fn();

    listener({
      data: VALID_REQUEST,
      source: {},
      ports: [{ postMessage: vi.fn() }],
      waitUntil,
    });
    await waitUntil.mock.calls[0]?.[0];

    expect(drainDiagnosticsMock).toHaveBeenCalledTimes(1);
  });

  it('never drains for the Stage 3 predecessor probe', async () => {
    const listener = await importSwAndGetMessageListener();
    drainDiagnosticsMock.mockClear();

    listener({
      data: PROBE_REQUEST,
      source: {},
      ports: [{ postMessage: vi.fn() }],
      waitUntil: vi.fn(),
    });
    await flushMicrotasks();

    expect(drainDiagnosticsMock).not.toHaveBeenCalled();
  });
});

describe('src/sw.ts message handler diagnostic reporting', () => {
  it('reports an unexpected, unclassified handleWorkerMessage failure', async () => {
    handleWorkerMessageMock.mockRejectedValue(new Error('unexpected bug'));
    const listener = await importSwAndGetMessageListener();
    captureDiagnosticExceptionMock.mockClear();
    const waitUntil = vi.fn();

    listener({
      data: VALID_REQUEST,
      source: {},
      ports: [{ postMessage: vi.fn() }],
      waitUntil,
    });
    await waitUntil.mock.calls[0]?.[0];

    expect(captureDiagnosticExceptionMock).toHaveBeenCalledWith(expect.any(Error), {
      operation: 'workerMessageHandling',
    });
  });

  it("never reports a release-preparation-classified failure again: already the coordinator's own", async () => {
    // Imported dynamically, in the same fresh module epoch `./sw`'s own
    // import of this module resolves to after `vi.resetModules()` — a static
    // top-level import here would construct the error against a stale
    // `DomainError` class identity and silently fail its `instanceof` check.
    const { releasePreparationError, ReleasePreparationFailureReason } =
      await import('./shared/service/appUpdate/releasePreparation');
    const classified = releasePreparationError(
      ReleasePreparationFailureReason.INTEGRITY_FAILURE,
      'hash mismatch',
    );
    handleWorkerMessageMock.mockRejectedValue(classified);
    const listener = await importSwAndGetMessageListener();
    captureDiagnosticExceptionMock.mockClear();
    const waitUntil = vi.fn();

    listener({
      data: VALID_REQUEST,
      source: {},
      ports: [{ postMessage: vi.fn() }],
      waitUntil,
    });
    await waitUntil.mock.calls[0]?.[0];

    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('never reports a controller-state-write-classified failure again: already its own boundary', async () => {
    const { DomainError } = await import('./shared/lib/error');
    const { ControllerStateWriteFailureReason } =
      await import('./shared/service/appUpdate/controllerState');
    const classified = new DomainError('Failed to persist controller state', {
      code: ControllerStateWriteFailureReason.STORAGE_UNAVAILABLE,
    });
    handleWorkerMessageMock.mockRejectedValue(classified);
    const listener = await importSwAndGetMessageListener();
    captureDiagnosticExceptionMock.mockClear();
    const waitUntil = vi.fn();

    listener({
      data: VALID_REQUEST,
      source: {},
      ports: [{ postMessage: vi.fn() }],
      waitUntil,
    });
    await waitUntil.mock.calls[0]?.[0];

    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it("never reports a controller-state-unavailable-classified failure again: already withState()'s own boundary", async () => {
    const { isControllerStateUnavailableError } =
      await import('./shared/service/appUpdate/stateLock');
    const { DomainError } = await import('./shared/lib/error');
    // `withState()`'s own thrown shape; verified against the real predicate
    // rather than hand-rolling a code value, so this test tracks the real
    // classification contract.
    const classified = new DomainError('Controller state is unavailable', { code: 'ABSENT' });
    if (!isControllerStateUnavailableError(classified)) {
      throw new Error(
        'Expected the constructed error to be classified as controller-state-unavailable',
      );
    }
    handleWorkerMessageMock.mockRejectedValue(classified);
    const listener = await importSwAndGetMessageListener();
    captureDiagnosticExceptionMock.mockClear();
    const waitUntil = vi.fn();

    listener({
      data: VALID_REQUEST,
      source: {},
      ports: [{ postMessage: vi.fn() }],
      waitUntil,
    });
    await waitUntil.mock.calls[0]?.[0];

    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it("never reports a ReconciliationFailure's cause: UpdateReconciler already reported it", async () => {
    const cause = new Error('reconciliation pass bug');
    handleWorkerMessageMock.mockRejectedValue(
      new ReconciliationFailure(cause, () => Promise.resolve()),
    );
    const listener = await importSwAndGetMessageListener();
    captureDiagnosticExceptionMock.mockClear();
    const waitUntil = vi.fn();

    listener({
      data: VALID_REQUEST,
      source: {},
      ports: [{ postMessage: vi.fn() }],
      waitUntil,
    });
    await waitUntil.mock.calls[0]?.[0];

    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('never reports a ReconciliationFailure whose cause is already release-preparation-classified, and tolerates a joiner with no owned runLifetimeWork', async () => {
    const { releasePreparationError, ReleasePreparationFailureReason } =
      await import('./shared/service/appUpdate/releasePreparation');
    const classifiedCause = releasePreparationError(
      ReleasePreparationFailureReason.CACHE_STORAGE_UNAVAILABLE,
      'cache write failed',
    );
    // A joining Check's ReconciliationFailure carries no runLifetimeWork at
    // all: this caller never owns another caller's effects.
    handleWorkerMessageMock.mockRejectedValue(new ReconciliationFailure(classifiedCause));
    const listener = await importSwAndGetMessageListener();
    captureDiagnosticExceptionMock.mockClear();
    const waitUntil = vi.fn();

    listener({
      data: VALID_REQUEST,
      source: {},
      ports: [{ postMessage: vi.fn() }],
      waitUntil,
    });
    await expect(waitUntil.mock.calls[0]?.[0]).resolves.toBeUndefined();

    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });
});
