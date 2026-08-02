import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cancelScheduledAppUpdate,
  checkForAppUpdates,
  getAppUpdateSnapshot,
  installAppUpdateOnNextLaunch,
  setAppUpdateMode,
  subscribeToAppUpdateStateChanged,
} from './client';

const snapshot = {
  mode: 'manual' as const,
  activeRelease: {
    releaseNumber: 1,
    appVersion: '1.0.0',
    buildId: 'build-a',
    buildDate: '2026-07-24T00:00:00.000Z',
  },
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

function stubControlledServiceWorker(
  onPostMessage: (request: unknown, ports: MessagePort[]) => void = (_request, ports) => {
    ports[0]?.postMessage({ protocolVersion: 1, snapshot });
  },
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

describe('appUpdate client', () => {
  beforeEach(() => {
    channels = [];
    vi.stubGlobal('MessageChannel', FakeMessageChannel);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('returns an explicit success result for a valid worker snapshot', async () => {
    const postMessage = stubControlledServiceWorker();

    await expect(getAppUpdateSnapshot()).resolves.toEqual({ status: 'success', value: snapshot });
    expect(postMessage.mock.calls[0]?.[0]).toEqual({ protocolVersion: 1, type: 'GET_SNAPSHOT' });
  });

  it('returns unavailable when service workers are unsupported', async () => {
    vi.stubGlobal('navigator', {});

    await expect(getAppUpdateSnapshot()).resolves.toEqual({ status: 'unavailable' });
  });

  it('returns unavailable immediately when there is no current controller, without awaiting ready', async () => {
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: NEVER_SETTLES, controller: undefined },
    });

    await expect(getAppUpdateSnapshot()).resolves.toEqual({ status: 'unavailable' });
    expect(channels).toHaveLength(0);
  });

  it('sends the exact worker request for every public command', async () => {
    const postMessage = stubControlledServiceWorker();

    await getAppUpdateSnapshot();
    await checkForAppUpdates();
    await setAppUpdateMode('manual');
    await setAppUpdateMode('automatic');
    await installAppUpdateOnNextLaunch();
    await cancelScheduledAppUpdate();

    expect(postMessage.mock.calls.map(([request]) => request)).toEqual([
      { protocolVersion: 1, type: 'GET_SNAPSHOT' },
      { protocolVersion: 1, type: 'CHECK_FOR_UPDATES' },
      { protocolVersion: 1, type: 'SET_MODE', mode: 'manual' },
      { protocolVersion: 1, type: 'SET_MODE', mode: 'automatic' },
      { protocolVersion: 1, type: 'INSTALL_ON_NEXT_LAUNCH' },
      { protocolVersion: 1, type: 'CANCEL_SCHEDULED_UPDATE' },
    ]);
  });

  it('returns unavailable for the exact worker failure envelope', async () => {
    stubControlledServiceWorker((_request, ports) => {
      ports[0]?.postMessage({ protocolVersion: 1, error: 'unavailable' });
    });

    await expect(getAppUpdateSnapshot()).resolves.toEqual({ status: 'unavailable' });
  });

  it('returns unavailable for a malformed worker response', async () => {
    stubControlledServiceWorker((_request, ports) => {
      ports[0]?.postMessage({ protocolVersion: 1, snapshot: { mode: 'manual' } });
    });

    await expect(getAppUpdateSnapshot()).resolves.toEqual({ status: 'unavailable' });
  });

  it('returns unavailable when postMessage throws synchronously', async () => {
    stubControlledServiceWorker(() => {
      throw new Error('transport closed');
    });

    await expect(getAppUpdateSnapshot()).resolves.toEqual({ status: 'unavailable' });
  });

  it('uses a 10-second deadline for GET_SNAPSHOT', async () => {
    vi.useFakeTimers();
    stubControlledServiceWorker(() => {});
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
      stubControlledServiceWorker(() => {});
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
    stubControlledServiceWorker(() => {});
    let result: unknown;
    void cancelScheduledAppUpdate().then((value) => {
      result = value;
    });

    await vi.advanceTimersByTimeAsync(10_000);

    expect(result).toEqual({ status: 'timeout' });
  });

  it('keeps CHECK_FOR_UPDATES pending before 120 seconds and times out at 120 seconds', async () => {
    vi.useFakeTimers();
    stubControlledServiceWorker(() => {});
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
    stubControlledServiceWorker(() => {});
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
    stubControlledServiceWorker(() => {});
    const resultPromise = getAppUpdateSnapshot();

    await vi.advanceTimersByTimeAsync(10_000);
    await expect(resultPromise).resolves.toEqual({ status: 'timeout' });

    const channel = channels[0];
    if (!channel) throw new Error('Expected a MessageChannel');
    channel.port2.postMessage({ protocolVersion: 1, snapshot });

    expect(channel.port1.close).toHaveBeenCalledTimes(1);
  });

  it('clears the pending timeout and releases the receiving port after a successful response', async () => {
    vi.useFakeTimers();
    stubControlledServiceWorker();

    await expect(getAppUpdateSnapshot()).resolves.toEqual({ status: 'success', value: snapshot });

    const channel = channels[0];
    if (!channel) throw new Error('Expected a MessageChannel');
    expect(vi.getTimerCount()).toBe(0);
    expect(channel.port1.close).toHaveBeenCalledTimes(1);
  });

  it('does not read serviceWorker.ready for any command', async () => {
    const postMessage = vi.fn((_request: unknown, ports: MessagePort[]) => {
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

  it('returns a no-op unsubscribe when serviceWorker is unsupported', () => {
    vi.stubGlobal('navigator', {});
    const onStateChanged = vi.fn();

    expect(() => {
      subscribeToAppUpdateStateChanged(onStateChanged)();
    }).not.toThrow();
    expect(onStateChanged).not.toHaveBeenCalled();
  });

  it('keeps the state-changed broadcast subscription contract unchanged', () => {
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
