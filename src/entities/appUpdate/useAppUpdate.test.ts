import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getAppUpdateSnapshotMock = vi.fn();

vi.mock('@shared/serviceClient/appUpdate/client', () => ({
  getAppUpdateSnapshot: () => getAppUpdateSnapshotMock(),
}));

const activeRelease = { releaseId: 'release-a', releaseSequence: 1 };

describe('useAppUpdate', () => {
  beforeEach(() => {
    vi.resetModules();
    getAppUpdateSnapshotMock.mockReset();
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

  it('reports check-failed and install-failed from the applied snapshot error', async () => {
    getAppUpdateSnapshotMock.mockResolvedValue({ mode: 'manual', activeRelease });
    const { useAppUpdate } = await import('./useAppUpdate');
    const { status, applySnapshot } = useAppUpdate();

    applySnapshot({ mode: 'manual', activeRelease, error: 'check-failed' });
    expect(status.value).toBe('check-failed');

    applySnapshot({ mode: 'manual', activeRelease, error: 'install-failed' });
    expect(status.value).toBe('install-failed');
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
