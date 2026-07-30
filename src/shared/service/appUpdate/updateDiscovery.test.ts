import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseDescriptor, ReleaseRef, UpdateControllerState } from './contracts';

const readControllerStateMock = vi.fn();
const writeControllerStateMock = vi.fn();
const fetchLatestReleasePointerMock = vi.fn();
const fetchReleaseDescriptorMock = vi.fn();
const prepareMock = vi.fn();

vi.mock('./controllerState', () => ({
  readControllerState: (...args: unknown[]) => readControllerStateMock(...args),
  writeControllerState: (...args: unknown[]) => writeControllerStateMock(...args),
}));
vi.mock('./releasePreparation', () => ({
  fetchLatestReleasePointer: (...args: unknown[]) => fetchLatestReleasePointerMock(...args),
  fetchReleaseDescriptor: (...args: unknown[]) => fetchReleaseDescriptorMock(...args),
}));
vi.stubGlobal('caches', { keys: vi.fn().mockResolvedValue([]), delete: vi.fn() });

const enqueue = <T>(operation: () => Promise<T>): Promise<T> => operation();
const coordinator = {
  prepare: (...args: unknown[]) => prepareMock(...args),
  runCleanup: (cleanup: (inFlightReleaseIds: readonly string[]) => Promise<void>) => cleanup([]),
};

const baseState: UpdateControllerState = {
  schemaVersion: 1,
  mode: 'automatic',
  activeRelease: { releaseId: 'release-a', releaseSequence: 1 },
};

function buildDescriptor(release: ReleaseRef): ReleaseDescriptor {
  return {
    schemaVersion: 1,
    releaseId: release.releaseId,
    releaseSequence: release.releaseSequence,
    appVersion: '1.1.0',
    buildId: `build-${release.releaseId}`,
    buildDate: '2026-07-24T00:00:00.000Z',
    indexUrl: `/updates/releases/${release.releaseId}/index.html`,
    indexSha256: '0'.repeat(64),
    indexByteSize: 100,
    files: [{ path: 'assets/app.js', sha256: '0'.repeat(64), byteSize: 3 }],
  };
}

const releaseB: ReleaseRef = { releaseId: 'release-b', releaseSequence: 2 };
const descriptorB = buildDescriptor(releaseB);
const summaryB = {
  releaseId: descriptorB.releaseId,
  releaseSequence: descriptorB.releaseSequence,
  appVersion: descriptorB.appVersion,
  buildId: descriptorB.buildId,
  buildDate: descriptorB.buildDate,
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
    fetchReleaseDescriptorMock.mockReset();
    prepareMock.mockReset();
  });

  it('reports check-failed when latest.json cannot be fetched, without touching preparation', async () => {
    mockState(baseState);
    fetchLatestReleasePointerMock.mockRejectedValue(new Error('offline'));
    const { runUpdateCheck } = await import('./updateDiscovery');

    const result = await runUpdateCheck('stable', '/', enqueue, coordinator);

    expect(result.response.snapshot.error).toBe('check-failed');
    expect(fetchReleaseDescriptorMock).not.toHaveBeenCalled();
    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('reports check-failed when the exact descriptor cannot be fetched, without touching preparation', async () => {
    mockState(baseState);
    fetchLatestReleasePointerMock.mockResolvedValue(releaseB);
    fetchReleaseDescriptorMock.mockRejectedValue(new Error('offline'));
    const { runUpdateCheck } = await import('./updateDiscovery');

    const result = await runUpdateCheck('stable', '/', enqueue, coordinator);

    expect(result.response.snapshot.error).toBe('check-failed');
    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('records a newer discovery but does not prepare/approve it in Manual mode', async () => {
    mockState({ ...baseState, mode: 'manual' });
    fetchLatestReleasePointerMock.mockResolvedValue(releaseB);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorB);
    const { runUpdateCheck } = await import('./updateDiscovery');

    const result = await runUpdateCheck('stable', '/', enqueue, coordinator);

    expect(result.response.snapshot.latestRelease).toEqual(summaryB);
    expect(result.response.snapshot.scheduledRelease).toBeUndefined();
    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('prepares and approves a newer discovery in Automatic mode, reusing the already-validated descriptor', async () => {
    mockPersistentState(baseState);
    fetchLatestReleasePointerMock.mockResolvedValue(releaseB);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorB);
    prepareMock.mockResolvedValue(descriptorB);
    const { runUpdateCheck } = await import('./updateDiscovery');

    const result = await runUpdateCheck('stable', '/', enqueue, coordinator);

    expect(fetchReleaseDescriptorMock).toHaveBeenCalledTimes(1);
    expect(prepareMock).toHaveBeenCalledWith('stable', '/', summaryB, descriptorB);
    expect(result.response.snapshot.scheduledRelease).toEqual(summaryB);
  });

  it('does not approve when the user switched to Manual while preparation was in flight', async () => {
    // First read (discovery/decide) sees Automatic; second read (post-prepare
    // re-validation) sees Manual, simulating a mode switch mid-download.
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state: baseState })
      .mockResolvedValueOnce({ status: 'valid', state: { ...baseState, mode: 'manual' } });
    fetchLatestReleasePointerMock.mockResolvedValue(releaseB);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorB);
    prepareMock.mockResolvedValue(descriptorB);
    const { runUpdateCheck } = await import('./updateDiscovery');

    const result = await runUpdateCheck('stable', '/', enqueue, coordinator);

    expect(result.response.snapshot.scheduledRelease).toBeUndefined();
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
    fetchLatestReleasePointerMock.mockResolvedValue(releaseB);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorB);
    prepareMock.mockResolvedValue(descriptorB);
    const { runUpdateCheck } = await import('./updateDiscovery');

    const result = await runUpdateCheck('stable', '/', enqueue, coordinator);

    expect(result.response.snapshot.scheduledRelease).toBeUndefined();
  });

  it('does not approve its prepared target if that target became activeRelease while preparation was in flight', async () => {
    // Second read shows the target release already committed as activeRelease
    // (e.g. a concurrent clean-launch activation resolved while this check's
    // background preparation was still running) — mode is still Automatic
    // and latestRelease still matches the target, so only the activeRelease
    // comparison inside approveAutomaticRelease can catch this.
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state: baseState })
      .mockResolvedValueOnce({
        status: 'valid',
        state: { ...baseState, activeRelease: releaseB, latestRelease: summaryB },
      });
    fetchLatestReleasePointerMock.mockResolvedValue(releaseB);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorB);
    prepareMock.mockResolvedValue(descriptorB);
    const { runUpdateCheck } = await import('./updateDiscovery');

    const result = await runUpdateCheck('stable', '/', enqueue, coordinator);

    expect(result.response.snapshot.scheduledRelease).toBeUndefined();
    expect(writeControllerStateMock).toHaveBeenCalledTimes(1);
  });

  it('records discovery but does not prepare or approve while an activation is in progress', async () => {
    const activation = {
      targetRelease: {
        releaseId: 'release-c',
        releaseSequence: 3,
        appVersion: '1.2.0',
        buildId: 'build-c',
        buildDate: '2026-07-24T00:00:00.000Z',
      },
      deadlineAt: '2026-07-24T00:00:30.000Z',
    };
    mockPersistentState({ ...baseState, activation });
    fetchLatestReleasePointerMock.mockResolvedValue(releaseB);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorB);
    const { runUpdateCheck } = await import('./updateDiscovery');

    const result = await runUpdateCheck('stable', '/', enqueue, coordinator);

    expect(result.response.snapshot.latestRelease).toEqual(summaryB);
    expect(result.response.snapshot.scheduledRelease).toBeUndefined();
    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('reports the discovery without approval when background preparation fails', async () => {
    mockState(baseState);
    fetchLatestReleasePointerMock.mockResolvedValue(releaseB);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorB);
    prepareMock.mockRejectedValue(new Error('download failed'));
    const { runUpdateCheck } = await import('./updateDiscovery');

    const result = await runUpdateCheck('stable', '/', enqueue, coordinator);

    expect(result.response.snapshot.latestRelease).toEqual(summaryB);
    expect(result.response.snapshot.scheduledRelease).toBeUndefined();
    expect(result.response.snapshot.error).toBeUndefined();
  });

  it('retries preparation on a later check of the same latestRelease after a prior preparation failure, reuses the matching descriptor, and approves once preparation succeeds', async () => {
    mockPersistentState(baseState);
    fetchLatestReleasePointerMock.mockResolvedValue(releaseB);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorB);
    prepareMock.mockRejectedValueOnce(new Error('temporary failure'));
    const { runUpdateCheck } = await import('./updateDiscovery');

    const first = await runUpdateCheck('stable', '/', enqueue, coordinator);
    expect(first.response.snapshot.latestRelease).toEqual(summaryB);
    expect(first.response.snapshot.scheduledRelease).toBeUndefined();

    prepareMock.mockResolvedValueOnce(descriptorB);
    const second = await runUpdateCheck('stable', '/', enqueue, coordinator);

    expect(prepareMock).toHaveBeenCalledTimes(2);
    expect(prepareMock).toHaveBeenLastCalledWith('stable', '/', summaryB, descriptorB);
    expect(second.response.snapshot.scheduledRelease).toEqual(summaryB);
  });

  it('does not retry preparation once the latestRelease is already approved', async () => {
    mockPersistentState(baseState);
    fetchLatestReleasePointerMock.mockResolvedValue(releaseB);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorB);
    prepareMock.mockResolvedValue(descriptorB);
    const { runUpdateCheck } = await import('./updateDiscovery');

    const first = await runUpdateCheck('stable', '/', enqueue, coordinator);
    expect(first.response.snapshot.scheduledRelease).toEqual(summaryB);
    expect(prepareMock).toHaveBeenCalledTimes(1);

    const second = await runUpdateCheck('stable', '/', enqueue, coordinator);

    expect(prepareMock).toHaveBeenCalledTimes(1);
    expect(second.response.snapshot.scheduledRelease).toEqual(summaryB);
  });

  it('does not prepare a latestRelease recorded as the failed activation release', async () => {
    mockState({ ...baseState, latestRelease: summaryB, failedActivationRelease: summaryB });
    fetchLatestReleasePointerMock.mockResolvedValue(releaseB);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorB);
    const { runUpdateCheck } = await import('./updateDiscovery');

    const result = await runUpdateCheck('stable', '/', enqueue, coordinator);

    expect(prepareMock).not.toHaveBeenCalled();
    expect(result.response.snapshot.scheduledRelease).toBeUndefined();
  });

  it('returns check-failed and preserves the complete previous state on a same-sequence conflicting discovery, without preparing', async () => {
    const withPriorState: UpdateControllerState = {
      ...baseState,
      latestRelease: summaryB,
      lastSuccessfulCheckAt: '2026-07-20T00:00:00.000Z',
    };
    mockState(withPriorState);
    const conflictingDescriptor: ReleaseDescriptor = {
      ...descriptorB,
      releaseId: 'release-b-imposter',
    };
    fetchLatestReleasePointerMock.mockResolvedValue({
      releaseId: conflictingDescriptor.releaseId,
      releaseSequence: conflictingDescriptor.releaseSequence,
    });
    fetchReleaseDescriptorMock.mockResolvedValue(conflictingDescriptor);
    const { runUpdateCheck } = await import('./updateDiscovery');

    const result = await runUpdateCheck('stable', '/', enqueue, coordinator);

    expect(result.response.snapshot.error).toBe('check-failed');
    expect(result.response.snapshot.latestRelease).toEqual(summaryB);
    expect(result.response.snapshot.lastSuccessfulCheckAt).toBe('2026-07-20T00:00:00.000Z');
    expect(writeControllerStateMock).not.toHaveBeenCalled();
    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('recovers with an ordinary successful check once a later discovery is a genuinely valid newer release', async () => {
    mockPersistentState({
      ...baseState,
      latestRelease: summaryB,
      lastSuccessfulCheckAt: '2026-07-20T00:00:00.000Z',
    });
    const conflictingDescriptor: ReleaseDescriptor = {
      ...descriptorB,
      releaseId: 'release-b-imposter',
    };
    fetchLatestReleasePointerMock.mockResolvedValueOnce({
      releaseId: conflictingDescriptor.releaseId,
      releaseSequence: conflictingDescriptor.releaseSequence,
    });
    fetchReleaseDescriptorMock.mockResolvedValueOnce(conflictingDescriptor);
    const { runUpdateCheck } = await import('./updateDiscovery');

    const conflictResult = await runUpdateCheck('stable', '/', enqueue, coordinator);
    expect(conflictResult.response.snapshot.error).toBe('check-failed');

    const releaseC: ReleaseRef = { releaseId: 'release-c', releaseSequence: 3 };
    const descriptorC = buildDescriptor(releaseC);
    fetchLatestReleasePointerMock.mockResolvedValueOnce(releaseC);
    fetchReleaseDescriptorMock.mockResolvedValueOnce(descriptorC);
    prepareMock.mockResolvedValue(descriptorC);

    const recovered = await runUpdateCheck('stable', '/', enqueue, coordinator);

    expect(recovered.response.snapshot.error).toBeUndefined();
    expect(recovered.response.snapshot.latestRelease?.releaseId).toBe('release-c');
  });
});

describe('runScheduledDiscoveryCheck', () => {
  beforeEach(() => {
    readControllerStateMock.mockReset();
    writeControllerStateMock.mockReset();
    fetchLatestReleasePointerMock.mockReset();
    fetchReleaseDescriptorMock.mockReset();
    prepareMock.mockReset();
  });

  it('fetches and validates the pointer and descriptor in Manual mode too, reporting a changed state', async () => {
    mockState({ ...baseState, mode: 'manual' });
    fetchLatestReleasePointerMock.mockResolvedValue(releaseB);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorB);
    const { runScheduledDiscoveryCheck } = await import('./updateDiscovery');

    const changed = await runScheduledDiscoveryCheck('stable', '/', enqueue, coordinator);

    expect(fetchLatestReleasePointerMock).toHaveBeenCalledTimes(1);
    expect(fetchReleaseDescriptorMock).toHaveBeenCalledTimes(1);
    expect(changed).toBe(true);
  });

  it('persists latestRelease and lastSuccessfulCheckAt in Manual mode, without preparing or approving', async () => {
    mockPersistentState({ ...baseState, mode: 'manual' });
    fetchLatestReleasePointerMock.mockResolvedValue(releaseB);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorB);
    const { runScheduledDiscoveryCheck } = await import('./updateDiscovery');

    await runScheduledDiscoveryCheck('stable', '/', enqueue, coordinator);

    expect(writeControllerStateMock).toHaveBeenCalledTimes(1);
    const call = writeControllerStateMock.mock.calls[0];
    if (!call) throw new Error('Expected writeControllerState to have been called');
    const [, writtenState] = call;
    expect(writtenState).toMatchObject({
      latestRelease: summaryB,
      lastSuccessfulCheckAt: expect.any(String),
    });
    expect(writtenState).not.toHaveProperty('approvedRelease');
    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('runs the check when mode is Automatic', async () => {
    mockState(baseState);
    fetchLatestReleasePointerMock.mockResolvedValue(baseState.activeRelease);
    fetchReleaseDescriptorMock.mockResolvedValue(buildDescriptor(baseState.activeRelease));
    const { runScheduledDiscoveryCheck } = await import('./updateDiscovery');

    await runScheduledDiscoveryCheck('stable', '/', enqueue, coordinator);

    expect(fetchLatestReleasePointerMock).toHaveBeenCalledTimes(1);
  });

  it('never throws when the check fails, and reports no state change', async () => {
    mockState(baseState);
    fetchLatestReleasePointerMock.mockRejectedValue(new Error('offline'));
    const { runScheduledDiscoveryCheck } = await import('./updateDiscovery');

    await expect(runScheduledDiscoveryCheck('stable', '/', enqueue, coordinator)).resolves.toBe(
      false,
    );
  });
});
