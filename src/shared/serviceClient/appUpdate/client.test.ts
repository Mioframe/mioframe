import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const snapshot = {
  mode: 'manual' as const,
  activeRelease: {
    releaseNumber: 1,
    appVersion: '1.0.0',
    buildId: 'build-a',
    buildDate: '2026-07-24T00:00:00.000Z',
  },
};

const stableProbeResponse = {
  protocolVersion: 1,
  kind: 'managed-update-controller' as const,
  channel: 'stable' as const,
};
const developProbeResponse = {
  protocolVersion: 1,
  kind: 'managed-update-controller' as const,
  channel: 'develop' as const,
};

/** A permanently pending value used to prove client commands never await `serviceWorker.ready`. */
const NEVER_SETTLES = new Promise<never>(() => {});

type PortMessageHandler = ((event: MessageEvent) => void) | null;

class FakeMessagePort {
  onmessage: PortMessageHandler = null;
  readonly close = vi.fn();
  peer: FakeMessagePort | undefined;

  postMessage(data: unknown): void {
    this.peer?.onmessage?.(new MessageEvent('message', { data }));
  }
}

class FakeMessageChannel {
  readonly port1 = new FakeMessagePort();
  readonly port2 = new FakeMessagePort();

  constructor() {
    this.port1.peer = this.port2;
    this.port2.peer = this.port1;
    channels.push(this);
  }
}

let channels: FakeMessageChannel[] = [];

/**
 * Reads a posted request's `type` field without a type assertion: `request`
 * is always `unknown` at this transport boundary in these tests, exactly
 * like the real worker protocol payload the client sends.
 * @param request - The value posted to the stubbed controller.
 * @returns The request's `type` field, or `undefined` when not an object.
 */
function getRequestType(request: unknown): unknown {
  return typeof request === 'object' && request !== null ? Reflect.get(request, 'type') : undefined;
}

/**
 * Default handler that answers the capability probe as a valid `'stable'`
 * managed controller, and every other request with `snapshot` — the
 * baseline "fully capable" transport most command tests build on.
 * @param request
 * @param ports
 */
function defaultOnPostMessage(request: unknown, ports: MessagePort[]): void {
  const type = getRequestType(request);
  if (type === 'PROBE_MANAGED_UPDATE_CONTROLLER') {
    ports[0]?.postMessage(stableProbeResponse);
    return;
  }
  ports[0]?.postMessage({ protocolVersion: 1, snapshot });
}

function stubControlledServiceWorker(
  onPostMessage: typeof defaultOnPostMessage = defaultOnPostMessage,
) {
  const postMessage = vi.fn(onPostMessage);
  vi.stubGlobal('navigator', {
    serviceWorker: {
      ready: NEVER_SETTLES,
      controller: { postMessage },
    },
  });
  return postMessage;
}

/**
 * Resets the module registry and re-imports `./client` with
 * `__MANAGED_APP_UPDATE_CHANNEL__` stubbed to `channel`, so the module-level
 * `MANAGED_APP_UPDATE_CHANNEL` constant (captured once at import time, like
 * the real Vite build-time define it mirrors) reflects this test's own
 * build. Also gives every test a fresh module-local capability cache.
 * @param channel - The build-time managed channel to simulate; `undefined` for an unsupported build.
 * @returns The freshly imported `./client` module.
 */
async function importClientForChannel(channel: 'stable' | 'develop' | undefined) {
  vi.stubGlobal('__MANAGED_APP_UPDATE_CHANNEL__', channel);
  vi.resetModules();
  return import('./client');
}

describe('appUpdate client', () => {
  beforeEach(() => {
    channels = [];
    vi.stubGlobal('MessageChannel', FakeMessageChannel);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  describe('capability gating', () => {
    it('is unavailable immediately for an unsupported build, without ever accessing the controller', async () => {
      const { getAppUpdateSnapshot } = await importClientForChannel(undefined);
      const controllerGetter = vi.fn(() => ({ postMessage: vi.fn() }));
      vi.stubGlobal('navigator', {
        serviceWorker: {
          ready: NEVER_SETTLES,
          get controller() {
            return controllerGetter();
          },
        },
      });

      await expect(getAppUpdateSnapshot()).resolves.toEqual({ status: 'unavailable' });
      expect(controllerGetter).not.toHaveBeenCalled();
    });

    it('is unavailable immediately when there is no current controller', async () => {
      const { getAppUpdateSnapshot } = await importClientForChannel('stable');
      vi.stubGlobal('navigator', {
        serviceWorker: { ready: NEVER_SETTLES, controller: undefined },
      });

      await expect(getAppUpdateSnapshot()).resolves.toEqual({ status: 'unavailable' });
      expect(channels).toHaveLength(0);
    });

    it('sends a command once a stable controller confirms capability', async () => {
      const { getAppUpdateSnapshot } = await importClientForChannel('stable');
      stubControlledServiceWorker();

      await expect(getAppUpdateSnapshot()).resolves.toEqual({ status: 'success', value: snapshot });
    });

    it('sends a command once a develop controller confirms capability', async () => {
      const { getAppUpdateSnapshot } = await importClientForChannel('develop');
      stubControlledServiceWorker((request, ports) => {
        const type = getRequestType(request);
        if (type === 'PROBE_MANAGED_UPDATE_CONTROLLER') {
          ports[0]?.postMessage(developProbeResponse);
          return;
        }
        ports[0]?.postMessage({ protocolVersion: 1, snapshot });
      });

      await expect(getAppUpdateSnapshot()).resolves.toEqual({ status: 'success', value: snapshot });
    });

    it('never sends the command when the probe reports the wrong channel', async () => {
      const { getAppUpdateSnapshot } = await importClientForChannel('stable');
      const postMessage = stubControlledServiceWorker((request, ports) => {
        const type = getRequestType(request);
        if (type === 'PROBE_MANAGED_UPDATE_CONTROLLER') {
          ports[0]?.postMessage(developProbeResponse);
        }
      });

      await expect(getAppUpdateSnapshot()).resolves.toEqual({ status: 'unavailable' });
      expect(postMessage).toHaveBeenCalledTimes(1);
      expect(postMessage.mock.calls[0]?.[0]).toMatchObject({
        type: 'PROBE_MANAGED_UPDATE_CONTROLLER',
      });
    });

    it('never sends the command when the probe response has the wrong protocol version', async () => {
      const { getAppUpdateSnapshot } = await importClientForChannel('stable');
      const postMessage = stubControlledServiceWorker((request, ports) => {
        const type = getRequestType(request);
        if (type === 'PROBE_MANAGED_UPDATE_CONTROLLER') {
          ports[0]?.postMessage({ ...stableProbeResponse, protocolVersion: 2 });
        }
      });

      await expect(getAppUpdateSnapshot()).resolves.toEqual({ status: 'unavailable' });
      expect(postMessage).toHaveBeenCalledTimes(1);
    });

    it('never sends the command for a malformed probe response', async () => {
      const { getAppUpdateSnapshot } = await importClientForChannel('stable');
      const postMessage = stubControlledServiceWorker((request, ports) => {
        const type = getRequestType(request);
        if (type === 'PROBE_MANAGED_UPDATE_CONTROLLER') {
          ports[0]?.postMessage({ not: 'a valid probe response' });
        }
      });

      await expect(getAppUpdateSnapshot()).resolves.toEqual({ status: 'unavailable' });
      expect(postMessage).toHaveBeenCalledTimes(1);
    });

    it('becomes unavailable at the 1-second probe deadline for a silent (legacy Workbox) controller', async () => {
      vi.useFakeTimers();
      const { getAppUpdateSnapshot } = await importClientForChannel('stable');
      stubControlledServiceWorker(() => {
        // A legacy Workbox controller never answers this private protocol at all.
      });

      let result: unknown;
      void getAppUpdateSnapshot().then((value) => {
        result = value;
      });

      await vi.advanceTimersByTimeAsync(999);
      expect(result).toBeUndefined();
      await vi.advanceTimersByTimeAsync(1);

      expect(result).toEqual({ status: 'unavailable' });
    });

    it('never sends the command when postMessage throws synchronously for the probe', async () => {
      const { getAppUpdateSnapshot } = await importClientForChannel('stable');
      stubControlledServiceWorker(() => {
        throw new Error('transport closed');
      });

      await expect(getAppUpdateSnapshot()).resolves.toEqual({ status: 'unavailable' });
    });

    it('caches the probe result for the same controller object across commands', async () => {
      const { getAppUpdateSnapshot, checkForAppUpdates } = await importClientForChannel('stable');
      const postMessage = stubControlledServiceWorker();

      await getAppUpdateSnapshot();
      await checkForAppUpdates();

      const probeCalls = postMessage.mock.calls.filter(
        ([request]) => getRequestType(request) === 'PROBE_MANAGED_UPDATE_CONTROLLER',
      );
      expect(probeCalls).toHaveLength(1);
    });

    it('probes a new controller object independently, even for the same page', async () => {
      const { getAppUpdateSnapshot } = await importClientForChannel('stable');
      const postMessageA = stubControlledServiceWorker();
      await getAppUpdateSnapshot();

      const postMessageB = stubControlledServiceWorker();
      await getAppUpdateSnapshot();

      const probeCallsA = postMessageA.mock.calls.filter(
        ([request]) => getRequestType(request) === 'PROBE_MANAGED_UPDATE_CONTROLLER',
      );
      const probeCallsB = postMessageB.mock.calls.filter(
        ([request]) => getRequestType(request) === 'PROBE_MANAGED_UPDATE_CONTROLLER',
      );
      expect(probeCallsA).toHaveLength(1);
      expect(probeCallsB).toHaveLength(1);
    });

    it('keeps the command timeout unchanged after a successful probe: GET_SNAPSHOT still times out at 10 seconds, not 1', async () => {
      vi.useFakeTimers();
      const { getAppUpdateSnapshot } = await importClientForChannel('stable');
      stubControlledServiceWorker((request, ports) => {
        const type = getRequestType(request);
        if (type === 'PROBE_MANAGED_UPDATE_CONTROLLER') {
          ports[0]?.postMessage(stableProbeResponse);
        }
        // The actual command is left pending (no response) to prove its own deadline.
      });

      let result: unknown;
      void getAppUpdateSnapshot().then((value) => {
        result = value;
      });

      // Probe resolves near-instantly; the command deadline starts after it.
      await vi.advanceTimersByTimeAsync(9_999);
      expect(result).toBeUndefined();
      await vi.advanceTimersByTimeAsync(1);
      expect(result).toEqual({ status: 'timeout' });
    });
  });

  it('sends the exact worker request for every public command, after one shared probe', async () => {
    const {
      getAppUpdateSnapshot,
      checkForAppUpdates,
      setAppUpdateMode,
      installAppUpdateOnNextLaunch,
      cancelScheduledAppUpdate,
    } = await importClientForChannel('stable');
    const postMessage = stubControlledServiceWorker();

    await getAppUpdateSnapshot();
    await checkForAppUpdates();
    await setAppUpdateMode('manual');
    await setAppUpdateMode('automatic');
    await installAppUpdateOnNextLaunch();
    await cancelScheduledAppUpdate();

    expect(postMessage.mock.calls.map(([request]) => request)).toEqual([
      { protocolVersion: 1, type: 'PROBE_MANAGED_UPDATE_CONTROLLER' },
      { protocolVersion: 1, type: 'GET_SNAPSHOT' },
      { protocolVersion: 1, type: 'CHECK_FOR_UPDATES' },
      { protocolVersion: 1, type: 'SET_MODE', mode: 'manual' },
      { protocolVersion: 1, type: 'SET_MODE', mode: 'automatic' },
      { protocolVersion: 1, type: 'INSTALL_ON_NEXT_LAUNCH' },
      { protocolVersion: 1, type: 'CANCEL_SCHEDULED_UPDATE' },
    ]);
  });

  it('returns unavailable for the exact worker failure envelope', async () => {
    const { getAppUpdateSnapshot } = await importClientForChannel('stable');
    stubControlledServiceWorker((request, ports) => {
      const type = getRequestType(request);
      if (type === 'PROBE_MANAGED_UPDATE_CONTROLLER') {
        ports[0]?.postMessage(stableProbeResponse);
        return;
      }
      ports[0]?.postMessage({ protocolVersion: 1, error: 'unavailable' });
    });

    await expect(getAppUpdateSnapshot()).resolves.toEqual({ status: 'unavailable' });
  });

  it('returns unavailable for a malformed worker response', async () => {
    const { getAppUpdateSnapshot } = await importClientForChannel('stable');
    stubControlledServiceWorker((request, ports) => {
      const type = getRequestType(request);
      if (type === 'PROBE_MANAGED_UPDATE_CONTROLLER') {
        ports[0]?.postMessage(stableProbeResponse);
        return;
      }
      ports[0]?.postMessage({ protocolVersion: 1, snapshot: { mode: 'manual' } });
    });

    await expect(getAppUpdateSnapshot()).resolves.toEqual({ status: 'unavailable' });
  });

  it('returns unavailable when postMessage throws synchronously for the command itself', async () => {
    const { getAppUpdateSnapshot } = await importClientForChannel('stable');
    stubControlledServiceWorker((request, ports) => {
      const type = getRequestType(request);
      if (type === 'PROBE_MANAGED_UPDATE_CONTROLLER') {
        ports[0]?.postMessage(stableProbeResponse);
        return;
      }
      throw new Error('transport closed');
    });

    await expect(getAppUpdateSnapshot()).resolves.toEqual({ status: 'unavailable' });
  });

  it('uses a 10-second deadline for GET_SNAPSHOT', async () => {
    vi.useFakeTimers();
    const { getAppUpdateSnapshot } = await importClientForChannel('stable');
    stubControlledServiceWorker((request, ports) => {
      const type = getRequestType(request);
      if (type === 'PROBE_MANAGED_UPDATE_CONTROLLER') ports[0]?.postMessage(stableProbeResponse);
    });
    let result: unknown;
    void getAppUpdateSnapshot().then((value) => {
      result = value;
    });

    await vi.advanceTimersByTimeAsync(9_999);
    expect(result).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);

    expect(result).toEqual({ status: 'timeout' });
  });

  it.each(['manual', 'automatic'] as const)(
    'uses a 10-second deadline for SET_MODE %s',
    async (mode) => {
      vi.useFakeTimers();
      const { setAppUpdateMode } = await importClientForChannel('stable');
      stubControlledServiceWorker((request, ports) => {
        const type = getRequestType(request);
        if (type === 'PROBE_MANAGED_UPDATE_CONTROLLER') ports[0]?.postMessage(stableProbeResponse);
      });
      let result: unknown;
      void setAppUpdateMode(mode).then((value) => {
        result = value;
      });

      await vi.advanceTimersByTimeAsync(10_000);

      expect(result).toEqual({ status: 'timeout' });
    },
  );

  it('uses a 10-second deadline for CANCEL_SCHEDULED_UPDATE', async () => {
    vi.useFakeTimers();
    const { cancelScheduledAppUpdate } = await importClientForChannel('stable');
    stubControlledServiceWorker((request, ports) => {
      const type = getRequestType(request);
      if (type === 'PROBE_MANAGED_UPDATE_CONTROLLER') ports[0]?.postMessage(stableProbeResponse);
    });
    let result: unknown;
    void cancelScheduledAppUpdate().then((value) => {
      result = value;
    });

    await vi.advanceTimersByTimeAsync(10_000);

    expect(result).toEqual({ status: 'timeout' });
  });

  it('keeps CHECK_FOR_UPDATES pending before 120 seconds and times out at 120 seconds', async () => {
    vi.useFakeTimers();
    const { checkForAppUpdates } = await importClientForChannel('stable');
    stubControlledServiceWorker((request, ports) => {
      const type = getRequestType(request);
      if (type === 'PROBE_MANAGED_UPDATE_CONTROLLER') ports[0]?.postMessage(stableProbeResponse);
    });
    let result: unknown;
    void checkForAppUpdates().then((value) => {
      result = value;
    });

    await vi.advanceTimersByTimeAsync(119_999);
    expect(result).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);

    expect(result).toEqual({ status: 'timeout' });
  });

  it('keeps INSTALL_ON_NEXT_LAUNCH pending before 120 seconds and times out at 120 seconds', async () => {
    vi.useFakeTimers();
    const { installAppUpdateOnNextLaunch } = await importClientForChannel('stable');
    stubControlledServiceWorker((request, ports) => {
      const type = getRequestType(request);
      if (type === 'PROBE_MANAGED_UPDATE_CONTROLLER') ports[0]?.postMessage(stableProbeResponse);
    });
    let result: unknown;
    void installAppUpdateOnNextLaunch().then((value) => {
      result = value;
    });

    await vi.advanceTimersByTimeAsync(119_999);
    expect(result).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);

    expect(result).toEqual({ status: 'timeout' });
  });

  it('ignores a response that arrives after the deadline and releases the receiving port', async () => {
    vi.useFakeTimers();
    const { getAppUpdateSnapshot } = await importClientForChannel('stable');
    stubControlledServiceWorker((request, ports) => {
      const type = getRequestType(request);
      if (type === 'PROBE_MANAGED_UPDATE_CONTROLLER') ports[0]?.postMessage(stableProbeResponse);
    });
    const resultPromise = getAppUpdateSnapshot();

    await vi.advanceTimersByTimeAsync(10_000);
    await expect(resultPromise).resolves.toEqual({ status: 'timeout' });

    const commandChannel = channels[1];
    if (!commandChannel) throw new Error('Expected a command MessageChannel');
    commandChannel.port2.postMessage({ protocolVersion: 1, snapshot });

    expect(commandChannel.port1.close).toHaveBeenCalledTimes(1);
  });

  it('clears the pending timeout and releases the receiving port after a successful response', async () => {
    vi.useFakeTimers();
    const { getAppUpdateSnapshot } = await importClientForChannel('stable');
    stubControlledServiceWorker();

    await expect(getAppUpdateSnapshot()).resolves.toEqual({ status: 'success', value: snapshot });

    const commandChannel = channels[1];
    if (!commandChannel) throw new Error('Expected a command MessageChannel');
    expect(vi.getTimerCount()).toBe(0);
    expect(commandChannel.port1.close).toHaveBeenCalledTimes(1);
  });

  it('does not read serviceWorker.ready for any command', async () => {
    const {
      checkForAppUpdates,
      installAppUpdateOnNextLaunch,
      setAppUpdateMode,
      cancelScheduledAppUpdate,
    } = await importClientForChannel('stable');
    const postMessage = vi.fn((request: unknown, ports: MessagePort[]) => {
      const type = getRequestType(request);
      if (type === 'PROBE_MANAGED_UPDATE_CONTROLLER') {
        ports[0]?.postMessage(stableProbeResponse);
        return;
      }
      ports[0]?.postMessage({ protocolVersion: 1, snapshot });
    });
    const serviceWorker = {
      controller: { postMessage },
      get ready(): never {
        throw new Error('The client must not await or read serviceWorker.ready');
      },
    };
    vi.stubGlobal('navigator', { serviceWorker });

    await expect(checkForAppUpdates()).resolves.toEqual({ status: 'success', value: snapshot });
    await expect(installAppUpdateOnNextLaunch()).resolves.toEqual({
      status: 'success',
      value: snapshot,
    });
    await expect(setAppUpdateMode('automatic')).resolves.toEqual({
      status: 'success',
      value: snapshot,
    });
    await expect(cancelScheduledAppUpdate()).resolves.toEqual({
      status: 'success',
      value: snapshot,
    });
  });
});

describe('subscribeToAppUpdateStateChanged', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  type FakeMessageListener = (event: { data: unknown }) => void;

  function stubServiceWorkerEventTarget() {
    const listeners = new Set<FakeMessageListener>();
    const addEventListener = vi.fn((_type: string, listener: FakeMessageListener) => {
      listeners.add(listener);
    });
    const removeEventListener = vi.fn((_type: string, listener: FakeMessageListener) => {
      listeners.delete(listener);
    });
    vi.stubGlobal('navigator', {
      serviceWorker: { addEventListener, removeEventListener },
    });
    return {
      addEventListener,
      removeEventListener,
      dispatch: (data: unknown) => {
        for (const listener of listeners) listener({ data });
      },
    };
  }

  it('returns a no-op unsubscribe when serviceWorker is unsupported', async () => {
    const { subscribeToAppUpdateStateChanged } = await importClientForChannel('stable');
    vi.stubGlobal('navigator', {});
    const onStateChanged = vi.fn();

    expect(() => {
      subscribeToAppUpdateStateChanged(onStateChanged)();
    }).not.toThrow();
    expect(onStateChanged).not.toHaveBeenCalled();
  });

  it('keeps the state-changed broadcast subscription contract unchanged', async () => {
    const { subscribeToAppUpdateStateChanged } = await importClientForChannel('stable');
    const { addEventListener, removeEventListener, dispatch } = stubServiceWorkerEventTarget();
    const onStateChanged = vi.fn();

    const unsubscribe = subscribeToAppUpdateStateChanged(onStateChanged);
    dispatch({ protocolVersion: 1, type: 'APP_UPDATE_STATE_CHANGED' });
    dispatch({ protocolVersion: 1, type: 'APP_UPDATE_ROLLBACK', releaseNumber: 1 });
    dispatch({ type: 'APP_UPDATE_STATE_CHANGED' });

    expect(onStateChanged).toHaveBeenCalledTimes(1);
    expect(addEventListener).toHaveBeenCalledTimes(1);
    unsubscribe();
    expect(removeEventListener.mock.calls[0]?.[1]).toBe(addEventListener.mock.calls[0]?.[1]);
  });
});
