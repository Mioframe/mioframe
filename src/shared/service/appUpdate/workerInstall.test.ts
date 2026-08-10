import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseDescriptor } from './contracts';
import { stubFakeMessageChannel } from './fakeMessageChannel.testUtils';
import type { PredecessorLike } from './predecessorProbe';
import type { PreparationCoordinator } from './preparationCoordinator';
import { prepareInitialManagedRelease, runInstall } from './workerInstall';

const readControllerStateMock = vi.fn();
const writeControllerStateMock = vi.fn();
vi.mock('./controllerState', () => ({
  readControllerState: (...args: unknown[]) => readControllerStateMock(...args),
  writeControllerState: (...args: unknown[]) => writeControllerStateMock(...args),
}));

const fetchLatestReleasePointerMock = vi.fn();
const fetchReleaseDescriptorMock = vi.fn();
const reportReleasePreparationFailureMock = vi.fn();
vi.mock('./releasePreparation', () => ({
  fetchLatestReleasePointer: (...args: unknown[]) => fetchLatestReleasePointerMock(...args),
  fetchReleaseDescriptor: (...args: unknown[]) => fetchReleaseDescriptorMock(...args),
  reportReleasePreparationFailure: (...args: unknown[]) =>
    reportReleasePreparationFailureMock(...args),
}));

const latestPointer = { releaseNumber: 1 };
const descriptor: ReleaseDescriptor = {
  schemaVersion: 1,
  releaseNumber: 1,
  appVersion: '1.0.0',
  buildId: 'build-1',
  buildDate: '2026-07-24T00:00:00.000Z',
  indexSha256: '0'.repeat(64),
  indexByteSize: 10,
  files: [{ path: 'assets/app.js', sha256: '0'.repeat(64), byteSize: 3 }],
};
const activeReleaseSummary = {
  releaseNumber: 1,
  appVersion: '1.0.0',
  buildId: 'build-1',
  buildDate: '2026-07-24T00:00:00.000Z',
};

function createFakeCoordinator(
  overrides: Partial<PreparationCoordinator> = {},
): PreparationCoordinator {
  return {
    prepare: vi.fn().mockResolvedValue(descriptor),
    runCleanup: vi.fn(),
    ...overrides,
  };
}

/** A minimal fake predecessor message endpoint: answers a probe by `message.type`, keyed by handler. A type with no handler stays silent — no reply at all — exercising the probe's own timeout. */
type ProbeHandler = (port: MessagePort) => void;

/**
 * Narrows a `Transferable` to a `MessagePort` via a type predicate — never a
 * type assertion — since a probe's transfer list always carries the exact
 * `MessagePort` `predecessorProbe.ts` sent, but that fact is not statically
 * knowable from the wider `postMessage` signature this fake implements.
 * @param value - A candidate transferable.
 * @returns Whether `value` is a `MessagePort`.
 */
function isMessagePort(value: Transferable): value is MessagePort {
  return 'postMessage' in value;
}

function createFakeActive(handlers: Record<string, ProbeHandler> = {}): {
  active: PredecessorLike;
  posted: Array<{ type: string }>;
} {
  const posted: Array<{ type: string }> = [];
  const active: PredecessorLike = {
    postMessage: (
      message: { type: string },
      transfer?: Transferable[] | StructuredSerializeOptions,
    ) => {
      posted.push(message);
      const port = Array.isArray(transfer) ? transfer.find(isMessagePort) : undefined;
      if (port) handlers[message.type]?.(port);
    },
  };
  return { active, posted };
}

const respondManaged =
  (channel: string): ProbeHandler =>
  (port) => {
    port.postMessage({ protocolVersion: 1, kind: 'managed-update-controller', channel });
  };
const respondWorkboxTrue: ProbeHandler = (port) => {
  port.postMessage(true);
};

describe('runInstall', () => {
  beforeEach(() => {
    readControllerStateMock.mockReset();
    writeControllerStateMock.mockReset();
    fetchLatestReleasePointerMock.mockReset();
    fetchReleaseDescriptorMock.mockReset();
    reportReleasePreparationFailureMock.mockReset();
    stubFakeMessageChannel();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects installation when persisted state is structurally invalid, without probing or any network work', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'invalid' });
    const { active, posted } = createFakeActive({
      PROBE_MANAGED_UPDATE_CONTROLLER: respondManaged('stable'),
    });

    await expect(runInstall('stable', '/', active, createFakeCoordinator())).rejects.toThrow(
      'Persisted controller state is invalid',
    );

    expect(posted).toHaveLength(0);
    expect(fetchLatestReleasePointerMock).not.toHaveBeenCalled();
  });

  it('preserves any existing valid installation completely unchanged, for any predecessor: no probe, no network, no state write', async () => {
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: { activeRelease: activeReleaseSummary },
    });
    const { active, posted } = createFakeActive({
      PROBE_MANAGED_UPDATE_CONTROLLER: respondManaged('stable'),
    });

    await runInstall('stable', '/', active, createFakeCoordinator());

    expect(posted).toHaveLength(0);
    expect(fetchLatestReleasePointerMock).not.toHaveBeenCalled();
    expect(fetchReleaseDescriptorMock).not.toHaveBeenCalled();
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('a valid-state retry needs no bootstrap marker: a repeated install against the same valid state never probes or bootstraps', async () => {
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: { activeRelease: activeReleaseSummary },
    });
    const { active } = createFakeActive();
    const coordinator = createFakeCoordinator();

    await runInstall('stable', '/', active, coordinator);
    await runInstall('stable', '/', active, coordinator);

    expect(writeControllerStateMock).not.toHaveBeenCalled();
    expect(coordinator.prepare).not.toHaveBeenCalled();
  });

  it('bootstraps unconditionally when state is absent and there is no active predecessor', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    fetchLatestReleasePointerMock.mockResolvedValue(latestPointer);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptor);
    const coordinator = createFakeCoordinator();

    await runInstall('stable', '/', null, coordinator);

    expect(coordinator.prepare).toHaveBeenCalledWith(
      'stable',
      '/',
      activeReleaseSummary,
      descriptor,
    );
    expect(writeControllerStateMock).toHaveBeenCalledWith(
      'stable',
      expect.objectContaining({ activeRelease: activeReleaseSummary }),
    );
  });

  it('bootstraps when state is absent and the predecessor is a compatible Workbox worker', async () => {
    // The managed probe stays silent here (no active predecessor answers
    // it), so the shared deadline genuinely elapses before the outcome
    // resolves — exercised under fake timers rather than a real 5s wait.
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    fetchLatestReleasePointerMock.mockResolvedValue(latestPointer);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptor);
    const { active } = createFakeActive({ CACHE_URLS: respondWorkboxTrue });
    const coordinator = createFakeCoordinator();

    vi.useFakeTimers();
    const promise = runInstall('stable', '/', active, coordinator);
    await vi.advanceTimersByTimeAsync(5000);
    await promise;
    vi.useRealTimers();

    expect(writeControllerStateMock).toHaveBeenCalledWith(
      'stable',
      expect.objectContaining({ activeRelease: activeReleaseSummary }),
    );
  });

  it('rejects installation as managed-state loss when state is absent and the predecessor is a managed controller', async () => {
    // The Workbox probe stays silent here, so the shared deadline genuinely
    // elapses before the outcome resolves — exercised under fake timers.
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    const { active } = createFakeActive({
      PROBE_MANAGED_UPDATE_CONTROLLER: respondManaged('stable'),
    });

    vi.useFakeTimers();
    const promise = runInstall('stable', '/', active, createFakeCoordinator());
    // Attached before advancing timers: the promise settles as a side
    // effect of the advance below, and must never be observably unhandled
    // even for the single microtask turn before the assertion attaches.
    promise.catch(() => {});
    await vi.advanceTimersByTimeAsync(5000);
    await expect(promise).rejects.toThrow('managed-state loss');
    vi.useRealTimers();

    expect(fetchLatestReleasePointerMock).not.toHaveBeenCalled();
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('prepares the release fully before persisting initial state, and performs no further operation after a successful persist', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    fetchLatestReleasePointerMock.mockResolvedValue(latestPointer);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptor);
    const callOrder: string[] = [];
    const coordinator = createFakeCoordinator({
      prepare: vi.fn().mockImplementation(() => {
        callOrder.push('prepare');
        return Promise.resolve(descriptor);
      }),
    });
    writeControllerStateMock.mockImplementation(() => {
      callOrder.push('writeControllerState');
      return Promise.resolve();
    });

    await runInstall('stable', '/', null, coordinator);

    expect(callOrder).toEqual(['prepare', 'writeControllerState']);
    expect(coordinator.prepare).toHaveBeenCalledTimes(1);
  });

  it('rejects installation and never persists partial state when preparation fails', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    fetchLatestReleasePointerMock.mockResolvedValue(latestPointer);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptor);
    const coordinator = createFakeCoordinator({
      prepare: vi.fn().mockRejectedValue(new Error('download failed')),
    });

    await expect(runInstall('stable', '/', null, coordinator)).rejects.toThrow('download failed');
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  describe('predecessor probe transport (absent state)', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('dispatches both the managed and Workbox probes before awaiting either', async () => {
      readControllerStateMock.mockResolvedValue({ status: 'absent' });
      const { active, posted } = createFakeActive();

      vi.useFakeTimers();
      const promise = runInstall('stable', '/', active, createFakeCoordinator());
      promise.catch(() => {});
      await vi.advanceTimersByTimeAsync(0);

      expect(posted.map((message) => message.type).sort()).toEqual(
        ['CACHE_URLS', 'PROBE_MANAGED_UPDATE_CONTROLLER'].sort(),
      );

      await vi.advanceTimersByTimeAsync(5000);
      await expect(promise).rejects.toThrow();
    });

    it('sends the exact managed probe request and the exact empty-array Workbox CACHE_URLS probe', async () => {
      readControllerStateMock.mockResolvedValue({ status: 'absent' });
      const { active, posted } = createFakeActive();

      vi.useFakeTimers();
      const promise = runInstall('stable', '/', active, createFakeCoordinator());
      promise.catch(() => {});
      await vi.advanceTimersByTimeAsync(5000);
      await expect(promise).rejects.toThrow();

      expect(posted).toContainEqual({
        protocolVersion: 1,
        type: 'PROBE_MANAGED_UPDATE_CONTROLLER',
      });
      expect(posted).toContainEqual({ type: 'CACHE_URLS', payload: { urlsToCache: [] } });
    });

    it('uses one shared five-second deadline for both probes, never two sequential five-second waits', async () => {
      readControllerStateMock.mockResolvedValue({ status: 'absent' });
      const { active } = createFakeActive();

      vi.useFakeTimers();
      const promise = runInstall('stable', '/', active, createFakeCoordinator());
      let settled = false;
      promise.catch(() => {
        settled = true;
      });

      await vi.advanceTimersByTimeAsync(4999);
      expect(settled).toBe(false);

      await vi.advanceTimersByTimeAsync(1);
      expect(settled).toBe(true);
    });
  });

  describe('predecessor outcome matrix (absent state) — every non-bootstrap row rejects', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    const rejectRows: Array<[string, Record<string, ProbeHandler>]> = [
      [
        'conflict: managed valid + Workbox exact true',
        {
          PROBE_MANAGED_UPDATE_CONTROLLER: respondManaged('stable'),
          CACHE_URLS: respondWorkboxTrue,
        },
      ],
      [
        'malformed managed reply: wrong protocol version',
        {
          PROBE_MANAGED_UPDATE_CONTROLLER: (port) => {
            port.postMessage({
              protocolVersion: 2,
              kind: 'managed-update-controller',
              channel: 'stable',
            });
          },
        },
      ],
      [
        'malformed managed reply: wrong kind',
        {
          PROBE_MANAGED_UPDATE_CONTROLLER: (port) => {
            port.postMessage({ protocolVersion: 1, kind: 'workbox', channel: 'stable' });
          },
        },
      ],
      [
        'malformed managed reply: wrong channel (not another valid predecessor)',
        { PROBE_MANAGED_UPDATE_CONTROLLER: respondManaged('develop') },
      ],
      [
        'malformed managed reply: non-object',
        {
          PROBE_MANAGED_UPDATE_CONTROLLER: (port) => {
            port.postMessage('not-an-object');
          },
        },
      ],
      [
        'malformed Workbox reply: non-true value rejects even alone',
        {
          CACHE_URLS: (port) => {
            port.postMessage(false);
          },
        },
      ],
      [
        'malformed Workbox reply rejects even alongside an otherwise-valid managed reply',
        {
          PROBE_MANAGED_UPDATE_CONTROLLER: respondManaged('stable'),
          CACHE_URLS: (port) => {
            port.postMessage('unexpected');
          },
        },
      ],
      ['both probes silent: no active predecessor answered either one', {}],
    ];

    it.each(rejectRows)('%s', async (_name, handlers) => {
      readControllerStateMock.mockResolvedValue({ status: 'absent' });
      const { active } = createFakeActive(handlers);

      vi.useFakeTimers();
      const promise = runInstall('stable', '/', active, createFakeCoordinator());
      promise.catch(() => {});
      await vi.advanceTimersByTimeAsync(5000);

      await expect(promise).rejects.toThrow();
      expect(fetchLatestReleasePointerMock).not.toHaveBeenCalled();
      expect(writeControllerStateMock).not.toHaveBeenCalled();
    });
  });
});

describe('prepareInitialManagedRelease', () => {
  beforeEach(() => {
    fetchLatestReleasePointerMock.mockReset();
    fetchReleaseDescriptorMock.mockReset();
    reportReleasePreparationFailureMock.mockReset();
    writeControllerStateMock.mockReset();
  });

  it('fetches the latest pointer and descriptor, prepares through the coordinator with the already-validated descriptor (no redundant fetch), and persists only after preparation succeeds', async () => {
    fetchLatestReleasePointerMock.mockResolvedValue(latestPointer);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptor);
    const coordinator = createFakeCoordinator();

    await prepareInitialManagedRelease('stable', '/', coordinator);

    expect(fetchReleaseDescriptorMock).toHaveBeenCalledWith('/', latestPointer);
    expect(coordinator.prepare).toHaveBeenCalledWith(
      'stable',
      '/',
      activeReleaseSummary,
      descriptor,
    );
    expect(writeControllerStateMock).toHaveBeenCalledWith(
      'stable',
      expect.objectContaining({ activeRelease: activeReleaseSummary }),
    );
  });

  it('never persists partial state when preparation fails', async () => {
    fetchLatestReleasePointerMock.mockResolvedValue(latestPointer);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptor);
    const coordinator = createFakeCoordinator({
      prepare: vi.fn().mockRejectedValue(new Error('download failed')),
    });

    await expect(prepareInitialManagedRelease('stable', '/', coordinator)).rejects.toThrow(
      'download failed',
    );
    expect(writeControllerStateMock).not.toHaveBeenCalled();
    // The coordinator itself is the single diagnostic owner for its own
    // prepare() failure — never reported again here.
    expect(reportReleasePreparationFailureMock).not.toHaveBeenCalled();
  });

  it('reports a direct discovery failure (before the coordinator ever runs) exactly once', async () => {
    const discoveryError = new Error('offline');
    fetchLatestReleasePointerMock.mockRejectedValue(discoveryError);
    const coordinator = createFakeCoordinator();

    await expect(prepareInitialManagedRelease('stable', '/', coordinator)).rejects.toThrow(
      'offline',
    );

    expect(reportReleasePreparationFailureMock).toHaveBeenCalledExactlyOnceWith(discoveryError);
    expect(coordinator.prepare).not.toHaveBeenCalled();
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });
});
