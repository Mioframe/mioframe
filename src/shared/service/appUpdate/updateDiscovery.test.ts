import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseDescriptor, ReleaseSummary, UpdateControllerState } from './contracts';

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
type MockWindowClient = { type: 'window'; url: string; postMessage: (message: unknown) => void };
const matchAllMock = vi.fn((): Promise<MockWindowClient[]> => Promise.resolve([]));
vi.stubGlobal('self', { clients: { matchAll: matchAllMock } });
const cachesKeysMock = vi.fn().mockResolvedValue([]);
const cachesDeleteMock = vi.fn();
vi.stubGlobal('caches', { keys: cachesKeysMock, delete: cachesDeleteMock });

const CHANNEL_ORIGIN = 'https://mioframe.example';
const enqueue = <T>(operation: () => Promise<T>): Promise<T> => operation();
const coordinator = {
  prepare: (...args: unknown[]) => prepareMock(...args),
  runCleanup: (cleanup: (inFlightReleaseNumbers: readonly number[]) => Promise<void>) =>
    cleanup([]),
};

const releaseA: ReleaseSummary = {
  releaseNumber: 1,
  appVersion: '1.0.0',
  buildId: 'build-a',
  buildDate: '2026-07-24T00:00:00.000Z',
};

const baseState: UpdateControllerState = {
  schemaVersion: 1,
  mode: 'automatic',
  activeRelease: releaseA,
};

function buildDescriptor(releaseNumber: number): ReleaseDescriptor {
  return {
    schemaVersion: 1,
    releaseNumber,
    appVersion: '1.1.0',
    buildId: `build-${releaseNumber}`,
    buildDate: '2026-07-24T00:00:00.000Z',
    indexSha256: '0'.repeat(64),
    indexByteSize: 100,
    files: [{ path: 'assets/app.js', sha256: '0'.repeat(64), byteSize: 3 }],
  };
}

const descriptorB = buildDescriptor(2);
const summaryB: ReleaseSummary = {
  releaseNumber: descriptorB.releaseNumber,
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
 * exercises multiple separate lock acquisitions and the later one must see
 * the earlier one's persisted result.
 * @param initial - The initial persisted state.
 * @returns A getter for the current persisted state.
 */
function mockPersistentState(initial: UpdateControllerState): { get: () => UpdateControllerState } {
  let current = initial;
  readControllerStateMock.mockImplementation(() => ({ status: 'valid', state: current }));
  writeControllerStateMock.mockImplementation((_channel: string, next: UpdateControllerState) => {
    current = next;
  });
  return { get: () => current };
}

beforeEach(() => {
  readControllerStateMock.mockReset();
  writeControllerStateMock.mockReset();
  fetchLatestReleasePointerMock.mockReset();
  fetchReleaseDescriptorMock.mockReset();
  prepareMock.mockReset();
  matchAllMock.mockClear();
  matchAllMock.mockResolvedValue([]);
  cachesKeysMock.mockClear();
  cachesKeysMock.mockResolvedValue([]);
  cachesDeleteMock.mockClear();
});

describe('runDiscovery', () => {
  it('reports check-failed when latest.json cannot be fetched, leaving state untouched', async () => {
    mockState(baseState);
    fetchLatestReleasePointerMock.mockRejectedValue(new Error('offline'));
    const { runDiscovery } = await import('./updateDiscovery');

    const result = await runDiscovery('stable', '/', enqueue);

    expect(result.response.snapshot.error).toBe('check-failed');
    expect(result.durablyChanged).toBe(false);
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('reports check-failed when the exact descriptor cannot be fetched', async () => {
    mockState(baseState);
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 2 });
    fetchReleaseDescriptorMock.mockRejectedValue(new Error('offline'));
    const { runDiscovery } = await import('./updateDiscovery');

    const result = await runDiscovery('stable', '/', enqueue);

    expect(result.response.snapshot.error).toBe('check-failed');
    expect(result.durablyChanged).toBe(false);
  });

  it('sets an available candidate for a genuinely newer release and reports candidateReplaced', async () => {
    mockState(baseState);
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 2 });
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorB);
    const { runDiscovery } = await import('./updateDiscovery');

    const result = await runDiscovery('stable', '/', enqueue);

    expect(result.response.snapshot.candidate).toEqual({ phase: 'available', release: summaryB });
    expect(result.durablyChanged).toBe(true);
    expect(result.candidateReplaced).toBe(true);
    expect(result.discoveredDescriptor).toEqual(descriptorB);
  });

  it('records an ignored-stale discovery (only lastSuccessfulCheckAt changes), without candidateReplaced', async () => {
    mockState(baseState);
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 1 });
    fetchReleaseDescriptorMock.mockResolvedValue(buildDescriptor(1));
    const { runDiscovery } = await import('./updateDiscovery');

    const result = await runDiscovery('stable', '/', enqueue);

    expect(result.durablyChanged).toBe(true);
    expect(result.candidateReplaced).toBe(false);
  });

  it('is a true no-op for a ready candidate: discovery is skipped entirely', async () => {
    mockState({ ...baseState, candidate: { phase: 'ready', release: summaryB } });
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 3 });
    fetchReleaseDescriptorMock.mockResolvedValue(buildDescriptor(3));
    const { runDiscovery } = await import('./updateDiscovery');

    const result = await runDiscovery('stable', '/', enqueue);

    expect(result.durablyChanged).toBe(false);
    expect(result.candidateReplaced).toBe(false);
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });
});

describe('runAutomaticPreparationFollowUp', () => {
  it('is a no-op when nothing requires Automatic preparation', async () => {
    mockState(baseState);
    const { runAutomaticPreparationFollowUp } = await import('./updateDiscovery');

    await runAutomaticPreparationFollowUp('stable', '/', CHANNEL_ORIGIN, enqueue, coordinator);

    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('prepares the available candidate and persists ready, broadcasting once', async () => {
    const { get } = mockPersistentState({
      ...baseState,
      candidate: { phase: 'available', release: summaryB },
    });
    prepareMock.mockResolvedValue(descriptorB);
    const postMessage = vi.fn();
    matchAllMock.mockResolvedValue([{ type: 'window', url: `${CHANNEL_ORIGIN}/`, postMessage }]);
    const { runAutomaticPreparationFollowUp } = await import('./updateDiscovery');

    await runAutomaticPreparationFollowUp('stable', '/', CHANNEL_ORIGIN, enqueue, coordinator);

    expect(prepareMock).toHaveBeenCalledWith('stable', '/', summaryB, undefined);
    expect(get().candidate).toEqual({ phase: 'ready', release: summaryB });
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'APP_UPDATE_STATE_CHANGED' }),
    );
  });

  it('reuses an already-validated descriptor for the same release, skipping a redundant fetch elsewhere', async () => {
    mockPersistentState({
      ...baseState,
      candidate: { phase: 'available', release: summaryB },
    });
    prepareMock.mockResolvedValue(descriptorB);
    const { runAutomaticPreparationFollowUp } = await import('./updateDiscovery');

    await runAutomaticPreparationFollowUp(
      'stable',
      '/',
      CHANNEL_ORIGIN,
      enqueue,
      coordinator,
      descriptorB,
    );

    expect(prepareMock).toHaveBeenCalledWith('stable', '/', summaryB, descriptorB);
  });

  it('does not persist or broadcast on a transient preparation failure: a later trigger retries', async () => {
    const { get } = mockPersistentState({
      ...baseState,
      candidate: { phase: 'available', release: summaryB },
    });
    prepareMock.mockRejectedValue(new Error('offline'));
    const { runAutomaticPreparationFollowUp } = await import('./updateDiscovery');

    await runAutomaticPreparationFollowUp('stable', '/', CHANNEL_ORIGIN, enqueue, coordinator);

    expect(get().candidate).toEqual({ phase: 'available', release: summaryB });
    expect(matchAllMock).not.toHaveBeenCalled();
  });

  // Required deterministic race proof (1): Automatic preparation starts for
  // available(B); another window switches mode to Manual while preparation
  // is in flight; preparation completes; the candidate remains available(B)
  // and mode remains Manual.
  it('leaves the candidate available and mode Manual when mode switches away mid-preparation', async () => {
    const state = mockPersistentState({
      ...baseState,
      candidate: { phase: 'available', release: summaryB },
    });
    let resolvePrepare: (value: ReleaseDescriptor) => void = () => {};
    prepareMock.mockReturnValue(
      new Promise<ReleaseDescriptor>((resolve) => {
        resolvePrepare = resolve;
      }),
    );
    const { runAutomaticPreparationFollowUp } = await import('./updateDiscovery');

    const followUp = runAutomaticPreparationFollowUp(
      'stable',
      '/',
      CHANNEL_ORIGIN,
      enqueue,
      coordinator,
    );
    await vi.waitFor(() => {
      expect(prepareMock).toHaveBeenCalledTimes(1);
    });

    // Another window's SET_MODE durably switches to Manual while preparation
    // is still in flight (unlocked, so this concurrent write is visible).
    writeControllerStateMock('stable', { ...state.get(), mode: 'manual' });

    resolvePrepare(descriptorB);
    await followUp;

    expect(state.get().mode).toBe('manual');
    expect(state.get().candidate).toEqual({ phase: 'available', release: summaryB });
  });

  // Required deterministic race proof (3): Automatic preparation starts for
  // B; the candidate changes phase or number while preparing; B preparation
  // completes; completion is a no-op; the resulting unowned cache is
  // eligible for best-effort cleanup.
  it('cleans up a stale prepared cache when the candidate changed number while preparing', async () => {
    const state = mockPersistentState({
      ...baseState,
      candidate: { phase: 'available', release: summaryB },
    });
    let resolvePrepare: (value: ReleaseDescriptor) => void = () => {};
    prepareMock.mockReturnValue(
      new Promise<ReleaseDescriptor>((resolve) => {
        resolvePrepare = resolve;
      }),
    );
    cachesKeysMock.mockResolvedValue(['stable-release-1', 'stable-release-2', 'stable-release-3']);
    const { runAutomaticPreparationFollowUp } = await import('./updateDiscovery');

    const followUp = runAutomaticPreparationFollowUp(
      'stable',
      '/',
      CHANNEL_ORIGIN,
      enqueue,
      coordinator,
    );
    await vi.waitFor(() => {
      expect(prepareMock).toHaveBeenCalledTimes(1);
    });

    const releaseC: ReleaseSummary = { ...summaryB, releaseNumber: 3 };
    writeControllerStateMock('stable', {
      ...state.get(),
      candidate: { phase: 'available', release: releaseC },
    });

    resolvePrepare(descriptorB);
    await followUp;

    // Stale completion: candidate number moved on, so nothing was persisted
    // for B, but cleanup ran (protecting only active=1 and candidate=3).
    expect(state.get().candidate).toEqual({ phase: 'available', release: releaseC });
    expect(cachesDeleteMock).toHaveBeenCalledWith('stable-release-2');
    expect(cachesDeleteMock).not.toHaveBeenCalledWith('stable-release-1');
    expect(cachesDeleteMock).not.toHaveBeenCalledWith('stable-release-3');
  });
});

describe('runScheduledDiscoveryCheck', () => {
  it('fetches and validates in Manual mode too, and broadcasts the resulting change', async () => {
    mockState({ ...baseState, mode: 'manual' });
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 2 });
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorB);
    const postMessage = vi.fn();
    matchAllMock.mockResolvedValue([{ type: 'window', url: `${CHANNEL_ORIGIN}/`, postMessage }]);
    const { runScheduledDiscoveryCheck } = await import('./updateDiscovery');

    await runScheduledDiscoveryCheck('stable', '/', CHANNEL_ORIGIN, enqueue, coordinator);

    expect(fetchLatestReleasePointerMock).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'APP_UPDATE_STATE_CHANGED' }),
    );
    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('prepares in Automatic mode after discovering an available candidate', async () => {
    mockPersistentState(baseState);
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 2 });
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorB);
    prepareMock.mockResolvedValue(descriptorB);
    const { runScheduledDiscoveryCheck } = await import('./updateDiscovery');

    await runScheduledDiscoveryCheck('stable', '/', CHANNEL_ORIGIN, enqueue, coordinator);

    expect(prepareMock).toHaveBeenCalledWith('stable', '/', summaryB, descriptorB);
  });

  it('skips entirely (no fetch) for a ready candidate', async () => {
    mockState({ ...baseState, candidate: { phase: 'ready', release: summaryB } });
    const { runScheduledDiscoveryCheck } = await import('./updateDiscovery');

    await runScheduledDiscoveryCheck('stable', '/', CHANNEL_ORIGIN, enqueue, coordinator);

    expect(fetchLatestReleasePointerMock).not.toHaveBeenCalled();
  });

  it('skips entirely (no fetch) for an activating candidate', async () => {
    mockState({
      ...baseState,
      candidate: { phase: 'activating', release: summaryB, deadlineAt: '2026-07-24T00:00:30.000Z' },
    });
    const { runScheduledDiscoveryCheck } = await import('./updateDiscovery');

    await runScheduledDiscoveryCheck('stable', '/', CHANNEL_ORIGIN, enqueue, coordinator);

    expect(fetchLatestReleasePointerMock).not.toHaveBeenCalled();
  });

  it('skips entirely (no fetch) for a Manual failed candidate, preserving explicit retry', async () => {
    mockState({ ...baseState, mode: 'manual', candidate: { phase: 'failed', release: summaryB } });
    const { runScheduledDiscoveryCheck } = await import('./updateDiscovery');

    await runScheduledDiscoveryCheck('stable', '/', CHANNEL_ORIGIN, enqueue, coordinator);

    expect(fetchLatestReleasePointerMock).not.toHaveBeenCalled();
  });

  it('does not skip an Automatic failed candidate: a strictly newer release may replace it', async () => {
    mockState({
      ...baseState,
      mode: 'automatic',
      candidate: { phase: 'failed', release: summaryB },
    });
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 3 });
    fetchReleaseDescriptorMock.mockResolvedValue(buildDescriptor(3));
    const { runScheduledDiscoveryCheck } = await import('./updateDiscovery');

    await runScheduledDiscoveryCheck('stable', '/', CHANNEL_ORIGIN, enqueue, coordinator);

    expect(fetchLatestReleasePointerMock).toHaveBeenCalledTimes(1);
  });

  it('never throws when the check fails', async () => {
    mockState(baseState);
    fetchLatestReleasePointerMock.mockRejectedValue(new Error('offline'));
    const { runScheduledDiscoveryCheck } = await import('./updateDiscovery');

    await expect(
      runScheduledDiscoveryCheck('stable', '/', CHANNEL_ORIGIN, enqueue, coordinator),
    ).resolves.toBeUndefined();
  });
});
