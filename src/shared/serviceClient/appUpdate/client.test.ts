import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cancelScheduledAppUpdate,
  checkForAppUpdates,
  getAppUpdateSnapshot,
  installAppUpdateOnNextLaunch,
  setAppUpdateMode,
} from './client';

const snapshot = {
  mode: 'manual' as const,
  activeRelease: { releaseId: 'release-a', releaseSequence: 1 },
};

/** A promise that never settles, standing in for a `ready` that never resolves. */
const NEVER_SETTLES = new Promise<never>(() => {});

function stubControlledServiceWorker() {
  const postMessage = vi.fn((_request: unknown, ports: MessagePort[]) => {
    ports[0]?.postMessage({ snapshot });
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
    expect(postMessage.mock.calls[0]?.[0]).toEqual({ type: 'GET_SNAPSHOT' });
  });

  it('checkForAppUpdates sends CHECK_FOR_UPDATES', async () => {
    const postMessage = stubControlledServiceWorker();
    await checkForAppUpdates();
    expect(postMessage.mock.calls[0]?.[0]).toEqual({ type: 'CHECK_FOR_UPDATES' });
  });

  it('setAppUpdateMode sends SET_MODE with the given mode', async () => {
    const postMessage = stubControlledServiceWorker();
    await setAppUpdateMode('automatic');
    expect(postMessage.mock.calls[0]?.[0]).toEqual({ type: 'SET_MODE', mode: 'automatic' });
  });

  it('installAppUpdateOnNextLaunch sends INSTALL_ON_NEXT_LAUNCH', async () => {
    const postMessage = stubControlledServiceWorker();
    await installAppUpdateOnNextLaunch();
    expect(postMessage.mock.calls[0]?.[0]).toEqual({ type: 'INSTALL_ON_NEXT_LAUNCH' });
  });

  it('cancelScheduledAppUpdate sends CANCEL_SCHEDULED_UPDATE', async () => {
    const postMessage = stubControlledServiceWorker();
    await cancelScheduledAppUpdate();
    expect(postMessage.mock.calls[0]?.[0]).toEqual({ type: 'CANCEL_SCHEDULED_UPDATE' });
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

  it('resolves undefined when the controller never responds', async () => {
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
});
