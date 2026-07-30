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
  activeRelease: { releaseId: '11111111-1111-4111-8111-111111111111', releaseSequence: 1 },
};

/** A promise that never settles, standing in for a `ready` that never resolves. */
const NEVER_SETTLES = new Promise<never>(() => {});

function stubControlledServiceWorker() {
  const postMessage = vi.fn((_request: unknown, ports: MessagePort[]) => {
    ports[0]?.postMessage({ protocolVersion: 1, snapshot });
  });
  vi.stubGlobal('navigator', {
    serviceWorker: {
      // Permanently pending: proves `sendToController` never awaits `ready`.
      ready: NEVER_SETTLES,
      controller: { postMessage },
    },
  });
  return postMessage;
}

describe('appUpdate client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('getAppUpdateSnapshot returns undefined when serviceWorker is unsupported', async () => {
    vi.stubGlobal('navigator', {});
    expect(await getAppUpdateSnapshot()).toBeUndefined();
  });

  it('getAppUpdateSnapshot returns undefined immediately when there is no current controller, even when ready is permanently pending', async () => {
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: NEVER_SETTLES, controller: undefined },
    });
    expect(await getAppUpdateSnapshot()).toBeUndefined();
  });

  it('getAppUpdateSnapshot sends GET_SNAPSHOT and unwraps the resulting snapshot', async () => {
    const postMessage = stubControlledServiceWorker();
    const result = await getAppUpdateSnapshot();

    expect(result).toEqual(snapshot);
    expect(postMessage.mock.calls[0]?.[0]).toEqual({ protocolVersion: 1, type: 'GET_SNAPSHOT' });
  });

  it('checkForAppUpdates sends CHECK_FOR_UPDATES', async () => {
    const postMessage = stubControlledServiceWorker();
    await checkForAppUpdates();
    expect(postMessage.mock.calls[0]?.[0]).toEqual({
      protocolVersion: 1,
      type: 'CHECK_FOR_UPDATES',
    });
  });

  it('setAppUpdateMode sends SET_MODE with the given mode', async () => {
    const postMessage = stubControlledServiceWorker();
    await setAppUpdateMode('automatic');
    expect(postMessage.mock.calls[0]?.[0]).toEqual({
      protocolVersion: 1,
      type: 'SET_MODE',
      mode: 'automatic',
    });
  });

  it('installAppUpdateOnNextLaunch sends INSTALL_ON_NEXT_LAUNCH', async () => {
    const postMessage = stubControlledServiceWorker();
    await installAppUpdateOnNextLaunch();
    expect(postMessage.mock.calls[0]?.[0]).toEqual({
      protocolVersion: 1,
      type: 'INSTALL_ON_NEXT_LAUNCH',
    });
  });

  it('cancelScheduledAppUpdate sends CANCEL_SCHEDULED_UPDATE', async () => {
    const postMessage = stubControlledServiceWorker();
    await cancelScheduledAppUpdate();
    expect(postMessage.mock.calls[0]?.[0]).toEqual({
      protocolVersion: 1,
      type: 'CANCEL_SCHEDULED_UPDATE',
    });
  });

  it('resolves undefined when the response is missing a valid protocolVersion (fails closed, never throws)', async () => {
    const postMessage = vi.fn((_request: unknown, ports: MessagePort[]) => {
      ports[0]?.postMessage({ snapshot });
    });
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: NEVER_SETTLES, controller: { postMessage } },
    });

    await expect(getAppUpdateSnapshot()).resolves.toBeUndefined();
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

  it('calls onStateChanged for a valid v1 state-invalidation broadcast', () => {
    const { dispatch } = stubServiceWorkerEventTarget();
    const onStateChanged = vi.fn();

    subscribeToAppUpdateStateChanged(onStateChanged);
    dispatch({ protocolVersion: 1, type: 'APP_UPDATE_STATE_CHANGED' });

    expect(onStateChanged).toHaveBeenCalledTimes(1);
  });

  it('ignores an unrelated broadcast, such as a rollback', () => {
    const { dispatch } = stubServiceWorkerEventTarget();
    const onStateChanged = vi.fn();

    subscribeToAppUpdateStateChanged(onStateChanged);
    dispatch({ protocolVersion: 1, type: 'APP_UPDATE_ROLLBACK', releaseId: 'release-a' });

    expect(onStateChanged).not.toHaveBeenCalled();
  });

  it('ignores a state-invalidation broadcast with a missing or unsupported protocol version (fails closed)', () => {
    const { dispatch } = stubServiceWorkerEventTarget();
    const onStateChanged = vi.fn();

    subscribeToAppUpdateStateChanged(onStateChanged);
    dispatch({ type: 'APP_UPDATE_STATE_CHANGED' });
    dispatch({ protocolVersion: 2, type: 'APP_UPDATE_STATE_CHANGED' });

    expect(onStateChanged).not.toHaveBeenCalled();
  });

  it('does not call onStateChanged again after unsubscribing', () => {
    const { dispatch } = stubServiceWorkerEventTarget();
    const onStateChanged = vi.fn();

    const unsubscribe = subscribeToAppUpdateStateChanged(onStateChanged);
    unsubscribe();
    dispatch({ type: 'APP_UPDATE_STATE_CHANGED' });

    expect(onStateChanged).not.toHaveBeenCalled();
  });

  it('adds exactly one listener per subscription and removes exactly that one on unsubscribe', () => {
    const { addEventListener, removeEventListener } = stubServiceWorkerEventTarget();
    const unsubscribe = subscribeToAppUpdateStateChanged(vi.fn());

    expect(addEventListener).toHaveBeenCalledTimes(1);
    unsubscribe();

    expect(removeEventListener).toHaveBeenCalledTimes(1);
    expect(removeEventListener.mock.calls[0]?.[1]).toBe(addEventListener.mock.calls[0]?.[1]);
  });
});

describe('appUpdate client timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('resolves undefined when the controller never responds to GET_SNAPSHOT (a fast, bounded command)', async () => {
    const postMessage = vi.fn();
    vi.stubGlobal('navigator', {
      serviceWorker: {
        ready: new Promise<never>(() => {}),
        controller: { postMessage },
      },
    });

    const resultPromise = getAppUpdateSnapshot();
    await vi.advanceTimersByTimeAsync(10_000);

    expect(await resultPromise).toBeUndefined();
  });

  it('CHECK_FOR_UPDATES carries no client-side timeout: it still resolves with the final snapshot after exceeding ten seconds', async () => {
    let capturedPorts: MessagePort[] | undefined;
    const postMessage = vi.fn((_request: unknown, ports: MessagePort[]) => {
      capturedPorts = ports;
    });
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: new Promise<never>(() => {}), controller: { postMessage } },
    });

    const resultPromise = checkForAppUpdates();
    // Well past the bounded transport timeout other commands use — this
    // command must never be marked unavailable merely for taking this long.
    await vi.advanceTimersByTimeAsync(15_000);
    capturedPorts?.[0]?.postMessage({ protocolVersion: 1, snapshot });

    expect(await resultPromise).toEqual(snapshot);
  });

  it('INSTALL_ON_NEXT_LAUNCH carries no client-side timeout: it still resolves with the final snapshot after exceeding ten seconds', async () => {
    let capturedPorts: MessagePort[] | undefined;
    const postMessage = vi.fn((_request: unknown, ports: MessagePort[]) => {
      capturedPorts = ports;
    });
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: new Promise<never>(() => {}), controller: { postMessage } },
    });

    const resultPromise = installAppUpdateOnNextLaunch();
    await vi.advanceTimersByTimeAsync(15_000);
    capturedPorts?.[0]?.postMessage({ protocolVersion: 1, snapshot });

    expect(await resultPromise).toEqual(snapshot);
  });

  it('SET_MODE to Automatic carries no client-side timeout: it still resolves with the final snapshot after exceeding ten seconds', async () => {
    let capturedPorts: MessagePort[] | undefined;
    const postMessage = vi.fn((_request: unknown, ports: MessagePort[]) => {
      capturedPorts = ports;
    });
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: new Promise<never>(() => {}), controller: { postMessage } },
    });

    const resultPromise = setAppUpdateMode('automatic');
    await vi.advanceTimersByTimeAsync(15_000);
    capturedPorts?.[0]?.postMessage({ protocolVersion: 1, snapshot });

    expect(await resultPromise).toEqual(snapshot);
  });

  it('SET_MODE to Manual keeps the bounded transport timeout and resolves undefined when unanswered', async () => {
    const postMessage = vi.fn();
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: new Promise<never>(() => {}), controller: { postMessage } },
    });

    const resultPromise = setAppUpdateMode('manual');
    await vi.advanceTimersByTimeAsync(10_000);

    expect(await resultPromise).toBeUndefined();
  });

  it('CANCEL_SCHEDULED_UPDATE keeps the bounded transport timeout and resolves undefined when unanswered', async () => {
    const postMessage = vi.fn();
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: new Promise<never>(() => {}), controller: { postMessage } },
    });

    const resultPromise = cancelScheduledAppUpdate();
    await vi.advanceTimersByTimeAsync(10_000);

    expect(await resultPromise).toBeUndefined();
  });
});
