import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UpdateControllerState } from './contracts';

const readControllerStateMock = vi.fn();
const writeControllerStateMock = vi.fn();
const fetchLatestReleasePointerMock = vi.fn();
const prepareMock = vi.fn();

vi.mock('./controllerState', () => ({
  readControllerState: (...args: unknown[]) => readControllerStateMock(...args),
  writeControllerState: (...args: unknown[]) => writeControllerStateMock(...args),
}));
vi.mock('./releasePreparation', () => ({
  fetchLatestReleasePointer: (...args: unknown[]) => fetchLatestReleasePointerMock(...args),
}));
vi.stubGlobal('caches', { keys: vi.fn().mockResolvedValue([]), delete: vi.fn() });

const enqueue = <T>(operation: () => Promise<T>): Promise<T> => operation();
const coordinator = { prepare: (...args: unknown[]) => prepareMock(...args) };

const baseState: UpdateControllerState = {
  schemaVersion: 1,
  mode: 'automatic',
  activeRelease: { releaseId: 'release-a', releaseSequence: 1 },
  failedReleaseIds: [],
};

function mockState(state: UpdateControllerState): void {
  readControllerStateMock.mockResolvedValue({ status: 'valid', state });
}

/**
 * Wires the mocked read/write so a write actually becomes visible to the
 * next read, unlike a static `mockResolvedValue` — needed whenever a test
 * exercises `runUpdateCheck`'s two separate lock acquisitions and the
 * second one must see the first one's persisted result.
 * @param initial
 */
function mockPersistentState(initial: UpdateControllerState): void {
  let current = initial;
  readControllerStateMock.mockImplementation(() => ({ status: 'valid', state: current }));
  writeControllerStateMock.mockImplementation((_channel: string, next: UpdateControllerState) => {
    current = next;
  });
}

describe('runUpdateCheck', () => {
  beforeEach(() => {
    readControllerStateMock.mockReset();
    writeControllerStateMock.mockReset();
    fetchLatestReleasePointerMock.mockReset();
    prepareMock.mockReset();
  });

  it('reports check-failed when latest.json cannot be fetched, without touching preparation', async () => {
    mockState(baseState);
    fetchLatestReleasePointerMock.mockRejectedValue(new Error('offline'));
    const { runUpdateCheck } = await import('./updateDiscovery');

    const result = await runUpdateCheck('stable', '/', enqueue, coordinator);

    expect(result.snapshot.error).toBe('check-failed');
    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('records a newer discovery but does not prepare/approve it in Manual mode', async () => {
    mockState({ ...baseState, mode: 'manual' });
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseId: 'release-b', releaseSequence: 2 });
    const { runUpdateCheck } = await import('./updateDiscovery');

    const result = await runUpdateCheck('stable', '/', enqueue, coordinator);

    expect(result.snapshot.latestRelease).toEqual({ releaseId: 'release-b', releaseSequence: 2 });
    expect(result.snapshot.scheduledRelease).toBeUndefined();
    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('prepares and approves a newer discovery in Automatic mode', async () => {
    mockPersistentState(baseState);
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseId: 'release-b', releaseSequence: 2 });
    prepareMock.mockResolvedValue(undefined);
    const { runUpdateCheck } = await import('./updateDiscovery');

    const result = await runUpdateCheck('stable', '/', enqueue, coordinator);

    expect(prepareMock).toHaveBeenCalledWith('stable', '/', {
      releaseId: 'release-b',
      releaseSequence: 2,
    });
    expect(result.snapshot.scheduledRelease).toEqual({
      releaseId: 'release-b',
      releaseSequence: 2,
    });
  });

  it('does not approve when the user switched to Manual while preparation was in flight', async () => {
    // First read (discovery/decide) sees Automatic; second read (post-prepare
    // re-validation) sees Manual, simulating a mode switch mid-download.
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state: baseState })
      .mockResolvedValueOnce({ status: 'valid', state: { ...baseState, mode: 'manual' } });
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseId: 'release-b', releaseSequence: 2 });
    prepareMock.mockResolvedValue(undefined);
    const { runUpdateCheck } = await import('./updateDiscovery');

    const result = await runUpdateCheck('stable', '/', enqueue, coordinator);

    expect(result.snapshot.scheduledRelease).toBeUndefined();
  });

  it('does not approve a stale preparation superseded by a newer discovery', async () => {
    // Second read shows a newer release already discovered (releaseSequence
    // 3) than the one this call just finished preparing (2) — a slower
    // preparation resolving after a faster, newer one must not overwrite it.
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state: baseState })
      .mockResolvedValueOnce({
        status: 'valid',
        state: { ...baseState, latestRelease: { releaseId: 'release-c', releaseSequence: 3 } },
      });
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseId: 'release-b', releaseSequence: 2 });
    prepareMock.mockResolvedValue(undefined);
    const { runUpdateCheck } = await import('./updateDiscovery');

    const result = await runUpdateCheck('stable', '/', enqueue, coordinator);

    expect(result.snapshot.scheduledRelease).toBeUndefined();
  });

  it('reports the discovery without approval when background preparation fails', async () => {
    mockState(baseState);
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseId: 'release-b', releaseSequence: 2 });
    prepareMock.mockRejectedValue(new Error('download failed'));
    const { runUpdateCheck } = await import('./updateDiscovery');

    const result = await runUpdateCheck('stable', '/', enqueue, coordinator);

    expect(result.snapshot.latestRelease).toEqual({ releaseId: 'release-b', releaseSequence: 2 });
    expect(result.snapshot.scheduledRelease).toBeUndefined();
    expect(result.snapshot.error).toBeUndefined();
  });
});

describe('runAutomaticCheckIfEnabled', () => {
  beforeEach(() => {
    readControllerStateMock.mockReset();
    writeControllerStateMock.mockReset();
    fetchLatestReleasePointerMock.mockReset();
    prepareMock.mockReset();
  });

  it('never fetches latest.json when mode is Manual', async () => {
    mockState({ ...baseState, mode: 'manual' });
    const { runAutomaticCheckIfEnabled } = await import('./updateDiscovery');

    await runAutomaticCheckIfEnabled('stable', '/', enqueue, coordinator);

    expect(fetchLatestReleasePointerMock).not.toHaveBeenCalled();
  });

  it('runs the check when mode is Automatic', async () => {
    mockState(baseState);
    fetchLatestReleasePointerMock.mockResolvedValue(baseState.activeRelease);
    const { runAutomaticCheckIfEnabled } = await import('./updateDiscovery');

    await runAutomaticCheckIfEnabled('stable', '/', enqueue, coordinator);

    expect(fetchLatestReleasePointerMock).toHaveBeenCalledTimes(1);
  });

  it('never throws when the check fails', async () => {
    mockState(baseState);
    fetchLatestReleasePointerMock.mockRejectedValue(new Error('offline'));
    const { runAutomaticCheckIfEnabled } = await import('./updateDiscovery');

    await expect(
      runAutomaticCheckIfEnabled('stable', '/', enqueue, coordinator),
    ).resolves.toBeUndefined();
  });
});
