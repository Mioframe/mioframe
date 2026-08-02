import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getAppUpdateSnapshotMock = vi.fn();
const subscribeToAppUpdateStateChangedMock = vi.fn();
const unsubscribeStateChangedMock = vi.fn();

vi.mock('@shared/serviceClient/appUpdate/client', () => ({
  getAppUpdateSnapshot: () => getAppUpdateSnapshotMock(),
  subscribeToAppUpdateStateChanged: (onStateChanged: () => void) =>
    subscribeToAppUpdateStateChangedMock(onStateChanged),
}));

const activeRelease = {
  releaseNumber: 1,
  appVersion: '1.0.0',
  buildId: 'build-a',
  buildDate: '2026-07-24T00:00:00.000Z',
};
const releaseB = {
  releaseNumber: 2,
  appVersion: '1.1.0',
  buildId: 'build-b',
  buildDate: '2026-07-25T00:00:00.000Z',
};

const success = <T>(value: T) => ({ status: 'success' as const, value });
const timeout = { status: 'timeout' as const };
const unavailable = { status: 'unavailable' as const };

describe('useAppUpdate', () => {
  beforeEach(() => {
    vi.resetModules();
    getAppUpdateSnapshotMock.mockReset();
    getAppUpdateSnapshotMock.mockResolvedValue(timeout);
    subscribeToAppUpdateStateChangedMock.mockReset();
    unsubscribeStateChangedMock.mockReset();
    subscribeToAppUpdateStateChangedMock.mockReturnValue(unsubscribeStateChangedMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('projects a successful client result and marks the capability available', async () => {
    const { useAppUpdate } = await import('./useAppUpdate');
    const {
      activeRelease: activeReleaseRef,
      isCapabilityAvailable,
      mode,
      applyClientResult,
    } = useAppUpdate();

    applyClientResult(success({ mode: 'manual' as const, activeRelease }));

    expect(isCapabilityAvailable.value).toBe(true);
    expect(mode.value).toBe('manual');
    expect(activeReleaseRef.value).toEqual(activeRelease);
  });

  it('preserves the last valid snapshot but marks the capability unavailable for an unavailable result', async () => {
    const { useAppUpdate } = await import('./useAppUpdate');
    const {
      activeRelease: activeReleaseRef,
      isCapabilityAvailable,
      status,
      applyClientResult,
    } = useAppUpdate();

    applyClientResult(success({ mode: 'manual' as const, activeRelease }));
    applyClientResult(unavailable);

    expect(status.value).toBe('unavailable');
    expect(isCapabilityAvailable.value).toBe(false);
    expect(activeReleaseRef.value).toEqual(activeRelease);
  });

  it('preserves both the snapshot and capability for a timeout', async () => {
    const { useAppUpdate } = await import('./useAppUpdate');
    const {
      activeRelease: activeReleaseRef,
      isCapabilityAvailable,
      status,
      applyClientResult,
    } = useAppUpdate();

    applyClientResult(success({ mode: 'manual' as const, activeRelease }));
    applyClientResult(timeout);

    expect(isCapabilityAvailable.value).toBe(true);
    expect(status.value).toBe('not-checked');
    expect(activeReleaseRef.value).toEqual(activeRelease);
  });

  it('does not restore capability when a timeout follows an unavailable result', async () => {
    const { useAppUpdate } = await import('./useAppUpdate');
    const { isCapabilityAvailable, status, applyClientResult } = useAppUpdate();

    applyClientResult(unavailable);
    applyClientResult(timeout);

    expect(status.value).toBe('unavailable');
    expect(isCapabilityAvailable.value).toBe(false);
  });

  it('restores capability when a later successful result follows unavailable', async () => {
    const { useAppUpdate } = await import('./useAppUpdate');
    const { isCapabilityAvailable, status, applyClientResult } = useAppUpdate();

    applyClientResult(unavailable);
    applyClientResult(success({ mode: 'manual' as const, activeRelease }));

    expect(isCapabilityAvailable.value).toBe(true);
    expect(status.value).toBe('not-checked');
  });

  it('projects one candidate without leaking activation deadline protocol data', async () => {
    const { useAppUpdate } = await import('./useAppUpdate');
    const { candidate, applyClientResult } = useAppUpdate();

    applyClientResult(
      success({
        mode: 'manual' as const,
        activeRelease,
        candidate: {
          phase: 'activating' as const,
          release: releaseB,
          deadlineAt: '2026-07-24T00:00:30.000Z',
        },
      }),
    );

    expect(candidate.value).toEqual({ phase: 'activating', release: releaseB });
    expect(candidate.value).not.toHaveProperty('deadlineAt');
  });

  it.each(['available', 'ready', 'failed'] as const)(
    'projects the %s candidate phase as a stable UI record',
    async (phase) => {
      const { useAppUpdate } = await import('./useAppUpdate');
      const { candidate, applyClientResult } = useAppUpdate();

      applyClientResult(
        success({
          mode: 'manual' as const,
          activeRelease,
          candidate: { phase, release: releaseB },
        }),
      );

      expect(candidate.value).toEqual({ phase, release: releaseB });
      expect(candidate.value).not.toHaveProperty('deadlineAt');
    },
  );

  it.each([
    ['not-checked', { mode: 'manual' as const, activeRelease }],
    [
      'up-to-date',
      {
        mode: 'manual' as const,
        activeRelease,
        lastSuccessfulCheckAt: '2026-07-24T00:00:00.000Z',
      },
    ],
    [
      'update-available',
      {
        mode: 'manual' as const,
        activeRelease,
        candidate: { phase: 'available' as const, release: releaseB },
      },
    ],
    [
      'failed',
      {
        mode: 'manual' as const,
        activeRelease,
        candidate: { phase: 'failed' as const, release: releaseB },
      },
    ],
    [
      'ready',
      {
        mode: 'manual' as const,
        activeRelease,
        candidate: { phase: 'ready' as const, release: releaseB },
      },
    ],
    [
      'activating',
      {
        mode: 'manual' as const,
        activeRelease,
        candidate: {
          phase: 'activating' as const,
          release: releaseB,
          deadlineAt: '2026-07-24T00:00:30.000Z',
        },
        error: 'install-failed' as const,
      },
    ],
    [
      'install-failed',
      { mode: 'manual' as const, activeRelease, error: 'install-failed' as const },
    ],
    ['check-failed', { mode: 'manual' as const, activeRelease, error: 'check-failed' as const }],
  ])('derives the stable %s status', async (expectedStatus, value) => {
    const { useAppUpdate } = await import('./useAppUpdate');
    const { status, applyClientResult } = useAppUpdate();

    applyClientResult(success(value));

    expect(status.value).toBe(expectedStatus);
  });

  it('does not let an older refresh overwrite a newer action result', async () => {
    let resolveOlderRefresh: (value: unknown) => void = () => {};
    getAppUpdateSnapshotMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOlderRefresh = resolve;
        }),
    );
    const { useAppUpdate } = await import('./useAppUpdate');
    const { activeRelease: activeReleaseRef, applyClientResult } = useAppUpdate();

    applyClientResult(success({ mode: 'manual' as const, activeRelease: releaseB }));
    resolveOlderRefresh(success({ mode: 'manual' as const, activeRelease }));
    await Promise.resolve();

    expect(activeReleaseRef.value).toEqual(releaseB);
  });

  it('does not let an older refresh overwrite a newer refresh result', async () => {
    let resolveOlderRefresh: (value: unknown) => void = () => {};
    getAppUpdateSnapshotMock
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOlderRefresh = resolve;
          }),
      )
      .mockResolvedValueOnce(success({ mode: 'manual' as const, activeRelease: releaseB }));
    const { useAppUpdate } = await import('./useAppUpdate');
    const { activeRelease: activeReleaseRef, refresh } = useAppUpdate();

    await refresh();
    resolveOlderRefresh(success({ mode: 'manual' as const, activeRelease }));
    await Promise.resolve();

    expect(activeReleaseRef.value).toEqual(releaseB);
  });

  it('performs one event-driven refresh when the worker broadcasts state changed', async () => {
    getAppUpdateSnapshotMock.mockResolvedValue(success({ mode: 'manual' as const, activeRelease }));
    const { useAppUpdate } = await import('./useAppUpdate');
    useAppUpdate();
    await Promise.resolve();
    getAppUpdateSnapshotMock.mockClear();
    const callback = subscribeToAppUpdateStateChangedMock.mock.calls[0]?.[0];
    if (!callback) throw new Error('Expected a state-changed subscription');

    callback();
    await Promise.resolve();

    expect(getAppUpdateSnapshotMock).toHaveBeenCalledTimes(1);
  });

  it('registers the global state-changed subscription once for the shared singleton', async () => {
    const { useAppUpdate } = await import('./useAppUpdate');

    useAppUpdate();
    useAppUpdate();
    await Promise.resolve();

    expect(subscribeToAppUpdateStateChangedMock).toHaveBeenCalledTimes(1);
  });
});
