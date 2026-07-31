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
  buildDate: '2026-07-24T00:00:00.000Z',
};

describe('useAppUpdate', () => {
  beforeEach(() => {
    vi.resetModules();
    getAppUpdateSnapshotMock.mockReset();
    subscribeToAppUpdateStateChangedMock.mockReset();
    unsubscribeStateChangedMock.mockReset();
    subscribeToAppUpdateStateChangedMock.mockReturnValue(unsubscribeStateChangedMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports unavailable when the initial refresh resolves undefined', async () => {
    getAppUpdateSnapshotMock.mockResolvedValue(undefined);
    const { useAppUpdate } = await import('./useAppUpdate');
    const { status, refresh } = useAppUpdate();
    await refresh();

    expect(status.value).toBe('unavailable');
  });

  it('reports not-checked before any successful check', async () => {
    getAppUpdateSnapshotMock.mockResolvedValue({ mode: 'manual', activeRelease });
    const { useAppUpdate } = await import('./useAppUpdate');
    const { status, refresh } = useAppUpdate();
    await refresh();

    expect(status.value).toBe('not-checked');
  });

  it('reports up-to-date once checked with no candidate', async () => {
    getAppUpdateSnapshotMock.mockResolvedValue({
      mode: 'manual',
      activeRelease,
      lastSuccessfulCheckAt: '2026-07-24T00:00:00.000Z',
    });
    const { useAppUpdate } = await import('./useAppUpdate');
    const { status, refresh } = useAppUpdate();
    await refresh();

    expect(status.value).toBe('up-to-date');
  });

  it('reports update-available for an available candidate', async () => {
    getAppUpdateSnapshotMock.mockResolvedValue({
      mode: 'manual',
      activeRelease,
      candidate: { phase: 'available', release: releaseB },
      lastSuccessfulCheckAt: '2026-07-24T00:00:00.000Z',
    });
    const { useAppUpdate } = await import('./useAppUpdate');
    const { status, refresh } = useAppUpdate();
    await refresh();

    expect(status.value).toBe('update-available');
  });

  it('reports failed for a failed candidate', async () => {
    getAppUpdateSnapshotMock.mockResolvedValue({
      mode: 'manual',
      activeRelease,
      candidate: { phase: 'failed', release: releaseB },
      lastSuccessfulCheckAt: '2026-07-24T00:00:00.000Z',
    });
    const { useAppUpdate } = await import('./useAppUpdate');
    const { status, refresh } = useAppUpdate();
    await refresh();

    expect(status.value).toBe('failed');
  });

  it('reports ready for a ready candidate', async () => {
    getAppUpdateSnapshotMock.mockResolvedValue({
      mode: 'manual',
      activeRelease,
      candidate: { phase: 'ready', release: releaseB },
    });
    const { useAppUpdate } = await import('./useAppUpdate');
    const { status, candidate, refresh } = useAppUpdate();
    await refresh();

    expect(status.value).toBe('ready');
    expect(candidate.value).toEqual({ phase: 'ready', release: releaseB });
  });

  it('reports activating for an activating candidate', async () => {
    getAppUpdateSnapshotMock.mockResolvedValue({
      mode: 'manual',
      activeRelease,
      candidate: { phase: 'activating', release: releaseB, deadlineAt: '2026-07-24T00:00:30.000Z' },
    });
    const { useAppUpdate } = await import('./useAppUpdate');
    const { status, candidate, refresh } = useAppUpdate();
    await refresh();

    expect(status.value).toBe('activating');
    expect(candidate.value).toEqual({
      phase: 'activating',
      release: releaseB,
      deadlineAt: '2026-07-24T00:00:30.000Z',
    });
  });

  it('reports activating with priority over an ephemeral error', async () => {
    getAppUpdateSnapshotMock.mockResolvedValue({
      mode: 'manual',
      activeRelease,
      candidate: { phase: 'activating', release: releaseB, deadlineAt: '2026-07-24T00:00:30.000Z' },
      error: 'install-failed',
    });
    const { useAppUpdate } = await import('./useAppUpdate');
    const { status, refresh } = useAppUpdate();
    await refresh();

    expect(status.value).toBe('activating');
  });

  it('reports check-failed and install-failed from the applied snapshot error', async () => {
    getAppUpdateSnapshotMock.mockResolvedValue({ mode: 'manual', activeRelease });
    const { useAppUpdate } = await import('./useAppUpdate');
    const { status, applySnapshot } = useAppUpdate();

    applySnapshot({ mode: 'manual', activeRelease, error: 'check-failed' });
    expect(status.value).toBe('check-failed');

    applySnapshot({ mode: 'manual', activeRelease, error: 'install-failed' });
    expect(status.value).toBe('install-failed');
  });

  it('refreshes the snapshot through GET_SNAPSHOT when the worker reports a background state change', async () => {
    getAppUpdateSnapshotMock.mockResolvedValue({ mode: 'manual', activeRelease });
    const { useAppUpdate } = await import('./useAppUpdate');
    useAppUpdate();
    await Promise.resolve();
    getAppUpdateSnapshotMock.mockClear();
    const call = subscribeToAppUpdateStateChangedMock.mock.calls[0];
    if (!call) throw new Error('Expected a state-changed subscription to be registered');
    const onStateChanged = call[0];

    onStateChanged();
    await Promise.resolve();

    expect(getAppUpdateSnapshotMock).toHaveBeenCalledTimes(1);
  });

  it('subscribes to state-changed notifications exactly once for the shared singleton', async () => {
    getAppUpdateSnapshotMock.mockResolvedValue({ mode: 'manual', activeRelease });
    const { useAppUpdate } = await import('./useAppUpdate');

    useAppUpdate();
    useAppUpdate();
    await Promise.resolve();

    expect(subscribeToAppUpdateStateChangedMock).toHaveBeenCalledTimes(1);
  });

  it('applySnapshot(undefined) marks the capability unavailable without discarding the last known snapshot', async () => {
    getAppUpdateSnapshotMock.mockResolvedValue({ mode: 'manual', activeRelease });
    const { useAppUpdate } = await import('./useAppUpdate');
    const { status, activeRelease: activeReleaseRef, applySnapshot, refresh } = useAppUpdate();
    await refresh();

    applySnapshot(undefined);

    expect(status.value).toBe('unavailable');
    expect(activeReleaseRef.value).toEqual(activeRelease);
  });
});
