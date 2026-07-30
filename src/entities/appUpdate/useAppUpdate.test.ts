import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getAppUpdateSnapshotMock = vi.fn();
const subscribeToAppUpdateStateChangedMock = vi.fn();
const unsubscribeStateChangedMock = vi.fn();

vi.mock('@shared/serviceClient/appUpdate/client', () => ({
  getAppUpdateSnapshot: () => getAppUpdateSnapshotMock(),
  subscribeToAppUpdateStateChanged: (onStateChanged: () => void) =>
    subscribeToAppUpdateStateChangedMock(onStateChanged),
}));

const activeRelease = { releaseId: 'release-a', releaseSequence: 1 };

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

  it('reports up-to-date once checked with no newer release', async () => {
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

  it('reports update-available when latestRelease differs from activeRelease', async () => {
    getAppUpdateSnapshotMock.mockResolvedValue({
      mode: 'manual',
      activeRelease,
      latestRelease: { releaseId: 'release-b', releaseSequence: 2 },
      lastSuccessfulCheckAt: '2026-07-24T00:00:00.000Z',
    });
    const { useAppUpdate } = await import('./useAppUpdate');
    const { status, refresh } = useAppUpdate();
    await refresh();

    expect(status.value).toBe('update-available');
  });

  it('reports rolled-back when the latest known release is the one that just failed', async () => {
    getAppUpdateSnapshotMock.mockResolvedValue({
      mode: 'manual',
      activeRelease,
      latestRelease: { releaseId: 'release-b', releaseSequence: 2 },
      failedRelease: { releaseId: 'release-b', releaseSequence: 2 },
      lastSuccessfulCheckAt: '2026-07-24T00:00:00.000Z',
    });
    const { useAppUpdate } = await import('./useAppUpdate');
    const { status, refresh } = useAppUpdate();
    await refresh();

    expect(status.value).toBe('rolled-back');
  });

  it('reports update-available, not rolled-back, once a newer release supersedes the failed one', async () => {
    getAppUpdateSnapshotMock.mockResolvedValue({
      mode: 'manual',
      activeRelease,
      latestRelease: { releaseId: 'release-c', releaseSequence: 3 },
      failedRelease: { releaseId: 'release-b', releaseSequence: 2 },
      lastSuccessfulCheckAt: '2026-07-24T00:00:00.000Z',
    });
    const { useAppUpdate } = await import('./useAppUpdate');
    const { status, refresh } = useAppUpdate();
    await refresh();

    expect(status.value).toBe('update-available');
  });

  it('reports ready when a release is scheduled', async () => {
    getAppUpdateSnapshotMock.mockResolvedValue({
      mode: 'manual',
      activeRelease,
      scheduledRelease: { releaseId: 'release-b', releaseSequence: 2 },
    });
    const { useAppUpdate } = await import('./useAppUpdate');
    const { status, scheduledRelease, refresh } = useAppUpdate();
    await refresh();

    expect(status.value).toBe('ready');
    expect(scheduledRelease.value).toEqual({ releaseId: 'release-b', releaseSequence: 2 });
  });

  it('reports activating when activatingRelease is present', async () => {
    getAppUpdateSnapshotMock.mockResolvedValue({
      mode: 'manual',
      activeRelease,
      activatingRelease: { releaseId: 'release-b', releaseSequence: 2 },
    });
    const { useAppUpdate } = await import('./useAppUpdate');
    const { status, activatingRelease, refresh } = useAppUpdate();
    await refresh();

    expect(status.value).toBe('activating');
    expect(activatingRelease.value).toEqual({ releaseId: 'release-b', releaseSequence: 2 });
  });

  it('reports activating with priority over ready, update-available, and rolled-back', async () => {
    getAppUpdateSnapshotMock.mockResolvedValue({
      mode: 'manual',
      activeRelease,
      latestRelease: { releaseId: 'release-b', releaseSequence: 2 },
      scheduledRelease: { releaseId: 'release-b', releaseSequence: 2 },
      activatingRelease: { releaseId: 'release-b', releaseSequence: 2 },
      failedRelease: { releaseId: 'release-b', releaseSequence: 2 },
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
