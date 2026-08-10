import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stubFakeMessageChannel } from './fakeMessageChannel.testUtils';
import { probePredecessor, type PredecessorLike } from './predecessorProbe';

/** A minimal fake predecessor message endpoint: answers a probe by `message.type`. A type with no handler stays silent — no reply — exercising the probe's own timeout. */
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

describe('probePredecessor', () => {
  beforeEach(() => {
    stubFakeMessageChannel();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('classifies a valid managed reply with a silent Workbox probe as "managed"', async () => {
    const { active } = createFakeActive({
      PROBE_MANAGED_UPDATE_CONTROLLER: respondManaged('stable'),
    });

    vi.useFakeTimers();
    const promise = probePredecessor(active, 'stable');
    await vi.advanceTimersByTimeAsync(5000);

    await expect(promise).resolves.toBe('managed');
  });

  it('classifies a silent managed probe with an exact-true Workbox reply as "workbox"', async () => {
    const { active } = createFakeActive({ CACHE_URLS: respondWorkboxTrue });

    vi.useFakeTimers();
    const promise = probePredecessor(active, 'stable');
    await vi.advanceTimersByTimeAsync(5000);

    await expect(promise).resolves.toBe('workbox');
  });

  it('rejects a conflict: both a valid managed reply and an exact-true Workbox reply', async () => {
    const { active } = createFakeActive({
      PROBE_MANAGED_UPDATE_CONTROLLER: respondManaged('stable'),
      CACHE_URLS: respondWorkboxTrue,
    });

    await expect(probePredecessor(active, 'stable')).resolves.toBe('reject');
  });

  it('rejects when both probes are silent', async () => {
    const { active } = createFakeActive();

    vi.useFakeTimers();
    const promise = probePredecessor(active, 'stable');
    await vi.advanceTimersByTimeAsync(5000);

    await expect(promise).resolves.toBe('reject');
  });

  it.each([
    [
      'wrong protocol version',
      {
        PROBE_MANAGED_UPDATE_CONTROLLER: (port: MessagePort) => {
          port.postMessage({
            protocolVersion: 2,
            kind: 'managed-update-controller',
            channel: 'stable',
          });
        },
      },
    ],
    [
      'wrong kind',
      {
        PROBE_MANAGED_UPDATE_CONTROLLER: (port: MessagePort) => {
          port.postMessage({ protocolVersion: 1, kind: 'workbox', channel: 'stable' });
        },
      },
    ],
    [
      'wrong channel — a schema-valid reply for a different channel is not another valid predecessor',
      { PROBE_MANAGED_UPDATE_CONTROLLER: respondManaged('develop') },
    ],
    [
      'non-object managed reply',
      {
        PROBE_MANAGED_UPDATE_CONTROLLER: (port: MessagePort) => {
          port.postMessage('not-an-object');
        },
      },
    ],
  ] as const)('rejects on a malformed managed reply: %s', async (_name, handlers) => {
    const { active } = createFakeActive(handlers);

    vi.useFakeTimers();
    const promise = probePredecessor(active, 'stable');
    await vi.advanceTimersByTimeAsync(5000);

    await expect(promise).resolves.toBe('reject');
  });

  it('rejects on any Workbox reply other than exact true, even alone', async () => {
    const { active } = createFakeActive({
      CACHE_URLS: (port) => {
        port.postMessage(false);
      },
    });

    vi.useFakeTimers();
    const promise = probePredecessor(active, 'stable');
    await vi.advanceTimersByTimeAsync(5000);

    await expect(promise).resolves.toBe('reject');
  });

  it('rejects on a malformed Workbox reply even alongside an otherwise-valid managed reply', async () => {
    const { active } = createFakeActive({
      PROBE_MANAGED_UPDATE_CONTROLLER: respondManaged('stable'),
      CACHE_URLS: (port) => {
        port.postMessage('unexpected');
      },
    });

    await expect(probePredecessor(active, 'stable')).resolves.toBe('reject');
  });

  it('dispatches both probes before awaiting either', async () => {
    const { active, posted } = createFakeActive();

    vi.useFakeTimers();
    const promise = probePredecessor(active, 'stable');
    promise.catch(() => {});
    await vi.advanceTimersByTimeAsync(0);

    expect(posted.map((message) => message.type).sort()).toEqual(
      ['CACHE_URLS', 'PROBE_MANAGED_UPDATE_CONTROLLER'].sort(),
    );

    await vi.advanceTimersByTimeAsync(5000);
    await promise;
  });

  it('sends the exact managed probe request and the exact empty-array Workbox CACHE_URLS probe', async () => {
    const { active, posted } = createFakeActive();

    vi.useFakeTimers();
    const promise = probePredecessor(active, 'stable');
    await vi.advanceTimersByTimeAsync(5000);
    await promise;

    expect(posted).toContainEqual({ protocolVersion: 1, type: 'PROBE_MANAGED_UPDATE_CONTROLLER' });
    expect(posted).toContainEqual({ type: 'CACHE_URLS', payload: { urlsToCache: [] } });
  });

  it('uses one shared five-second deadline, not two sequential five-second waits', async () => {
    const { active } = createFakeActive();

    vi.useFakeTimers();
    const promise = probePredecessor(active, 'stable');
    let resolved: string | undefined;
    void promise.then((outcome) => {
      resolved = outcome;
    });

    await vi.advanceTimersByTimeAsync(4999);
    expect(resolved).toBeUndefined();

    await vi.advanceTimersByTimeAsync(1);
    expect(resolved).toBe('reject');
  });

  it('never retries: a late reply after the deadline has no effect on the already-settled outcome', async () => {
    let capturedPort: MessagePort | undefined;
    const { active } = createFakeActive({
      PROBE_MANAGED_UPDATE_CONTROLLER: (port) => {
        capturedPort = port;
      },
    });

    vi.useFakeTimers();
    const promise = probePredecessor(active, 'stable');
    await vi.advanceTimersByTimeAsync(5000);
    await expect(promise).resolves.toBe('reject');

    // A predecessor that only replies after the deadline (e.g. a slow or
    // stuck worker) must never flip an already-settled outcome.
    expect(() =>
      capturedPort?.postMessage({
        protocolVersion: 1,
        kind: 'managed-update-controller',
        channel: 'stable',
      }),
    ).not.toThrow();
    await expect(promise).resolves.toBe('reject');
  });
});
