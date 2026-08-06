import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseDescriptor, ReleaseSummary, UpdateControllerState } from './contracts';
import { createOperationQueue } from './operationQueue';

const readControllerStateMock = vi.fn();
const writeControllerStateMock = vi.fn();
const fetchLatestReleasePointerMock = vi.fn();
const fetchReleaseDescriptorMock = vi.fn();
const prepareMock = vi.fn();

vi.mock('./controllerState', () => ({
  readControllerState: (...args: unknown[]) => readControllerStateMock(...args),
  writeControllerState: (...args: unknown[]) => writeControllerStateMock(...args),
}));
vi.mock('./releasePreparation', async () => {
  const actual =
    await vi.importActual<typeof import('./releasePreparation')>('./releasePreparation');
  return {
    ...actual,
    fetchLatestReleasePointer: (...args: unknown[]) => fetchLatestReleasePointerMock(...args),
    fetchReleaseDescriptor: (...args: unknown[]) => fetchReleaseDescriptorMock(...args),
  };
});

const release = (
  releaseNumber: number,
  overrides: Partial<ReleaseSummary> = {},
): ReleaseSummary => ({
  releaseNumber,
  appVersion: `1.${releaseNumber}.0`,
  buildId: `build-${releaseNumber}`,
  buildDate: '2026-08-02T00:00:00.000Z',
  ...overrides,
});
const descriptorFor = (summary: ReleaseSummary): ReleaseDescriptor => ({
  schemaVersion: 1,
  ...summary,
  indexSha256: '0'.repeat(64),
  indexByteSize: 100,
  files: [{ path: 'assets/app.js', sha256: '0'.repeat(64), byteSize: 3 }],
});

const passthroughEnqueue = <T>(operation: () => Promise<T>): Promise<T> => operation();
const coordinator = { prepare: (...args: unknown[]) => prepareMock(...args), runCleanup: vi.fn() };

function buildDependencies(enqueue = passthroughEnqueue) {
  return {
    channel: 'stable' as const,
    channelBasePath: '/',
    enqueue,
    coordinator,
  };
}

function mockLatest(summary: ReleaseSummary): void {
  fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: summary.releaseNumber });
  fetchReleaseDescriptorMock.mockResolvedValue(descriptorFor(summary));
}

beforeEach(() => {
  readControllerStateMock.mockReset();
  writeControllerStateMock.mockReset().mockResolvedValue(undefined);
  fetchLatestReleasePointerMock.mockReset();
  fetchReleaseDescriptorMock.mockReset();
  prepareMock.mockReset().mockResolvedValue(undefined);
});

describe('runRecoverInstallLatest / top-level dispatch', () => {
  it('fails closed on a storage-unavailable initial read, before any network fetch', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'storage-unavailable' });
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const result = await runRecoverInstallLatest(buildDependencies());

    expect(result).toBe('controller-storage-unavailable');
    expect(fetchLatestReleasePointerMock).not.toHaveBeenCalled();
    expect(prepareMock).not.toHaveBeenCalled();
  });
});

describe('state-loss recovery (absent/invalid initial state)', () => {
  it.each(['absent', 'invalid'] as const)(
    'writes a fresh Automatic baseline with no candidate for %s state',
    async (status) => {
      readControllerStateMock
        .mockResolvedValueOnce(
          status === 'invalid'
            ? { status: 'invalid', reason: 'MALFORMED_RECORD' }
            : { status: 'absent' },
        )
        .mockResolvedValueOnce({ status: 'absent' });
      const latest = release(5);
      mockLatest(latest);
      const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

      const result = await runRecoverInstallLatest(buildDependencies());

      expect(result).toBe('success');
      expect(prepareMock).toHaveBeenCalledWith('stable', '/', latest, descriptorFor(latest));
      expect(writeControllerStateMock).toHaveBeenCalledWith('stable', {
        schemaVersion: 1,
        mode: 'automatic',
        activeRelease: latest,
      });
    },
  );

  it('classifies a latest.json/descriptor fetch failure as network-or-latest-unavailable, without preparing or writing', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 5 });
    const { ReleasePreparationError } = await import('./releasePreparation');
    fetchReleaseDescriptorMock.mockRejectedValue(
      new ReleasePreparationError('ARCHIVE_UNAVAILABLE', 'Failed to fetch release descriptor: 500'),
    );
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const result = await runRecoverInstallLatest(buildDependencies());

    expect(result).toBe('network-or-latest-unavailable');
    expect(prepareMock).not.toHaveBeenCalled();
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('classifies structurally invalid latest metadata as invalid-latest-metadata', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    const { ReleasePreparationError } = await import('./releasePreparation');
    fetchLatestReleasePointerMock.mockRejectedValue(
      new ReleasePreparationError(
        'INVALID_ARCHIVE_METADATA',
        'latest.json is structurally invalid',
      ),
    );
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const result = await runRecoverInstallLatest(buildDependencies());

    expect(result).toBe('invalid-latest-metadata');
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('classifies a preparation failure as release-preparation-failed, without writing', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    mockLatest(release(5));
    prepareMock.mockRejectedValue(new Error('integrity failure'));
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const result = await runRecoverInstallLatest(buildDependencies());

    expect(result).toBe('release-preparation-failed');
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('never overwrites another window’s already-completed identical recovery: idempotent success, no write', async () => {
    const latest = release(5);
    readControllerStateMock.mockResolvedValueOnce({ status: 'absent' }).mockResolvedValueOnce({
      status: 'valid',
      state: { schemaVersion: 1, mode: 'automatic', activeRelease: latest },
    });
    mockLatest(latest);
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const result = await runRecoverInstallLatest(buildDependencies());

    expect(result).toBe('success');
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('reports state-changed, without overwriting, when another window landed a different valid state', async () => {
    readControllerStateMock.mockResolvedValueOnce({ status: 'absent' }).mockResolvedValueOnce({
      status: 'valid',
      state: { schemaVersion: 1, mode: 'manual', activeRelease: release(9) },
    });
    mockLatest(release(5));
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const result = await runRecoverInstallLatest(buildDependencies());

    expect(result).toBe('state-changed');
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('reports controller-storage-unavailable when finalization cannot re-read state, without writing', async () => {
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'absent' })
      .mockResolvedValueOnce({ status: 'storage-unavailable' });
    mockLatest(release(5));
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const result = await runRecoverInstallLatest(buildDependencies());

    expect(result).toBe('controller-storage-unavailable');
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('reports controller-state-persistence-failed when the final write throws', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    mockLatest(release(5));
    writeControllerStateMock.mockRejectedValue(new Error('quota exceeded'));
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const result = await runRecoverInstallLatest(buildDependencies());

    expect(result).toBe('controller-state-persistence-failed');
  });

  it('never deletes the invalid record before preparation succeeds (write only happens after prepare resolves)', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'invalid', reason: 'INVARIANT_VIOLATION' });
    const latest = release(5);
    mockLatest(latest);
    const callOrder: string[] = [];
    prepareMock.mockImplementation(() => {
      callOrder.push('prepare');
    });
    writeControllerStateMock.mockImplementation(() => {
      callOrder.push('write');
    });
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    await runRecoverInstallLatest(buildDependencies());

    expect(callOrder).toEqual(['prepare', 'write']);
  });
});

describe('known-active recovery (valid initial state)', () => {
  function stateWith(overrides: Partial<UpdateControllerState>): UpdateControllerState {
    return { schemaVersion: 1, mode: 'automatic', activeRelease: release(1), ...overrides };
  }

  it('re-prepares exact active A when latest exactly matches it, without writing any state', async () => {
    const active = release(1);
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state: stateWith({ activeRelease: active }) })
      .mockResolvedValueOnce({ status: 'valid', state: stateWith({ activeRelease: active }) })
      .mockResolvedValueOnce({ status: 'valid', state: stateWith({ activeRelease: active }) });
    mockLatest(active);
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const result = await runRecoverInstallLatest(buildDependencies());

    expect(result).toBe('success');
    expect(prepareMock).toHaveBeenCalledWith('stable', '/', active, descriptorFor(active));
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('classifies against the fresh post-network read, never the stale dispatch-time read: active caught up to exactly latest while the network fetch was in flight', async () => {
    // Dispatch-time active (before the network round trip) is older than
    // latest — the exact shape that once fed `latest-older-than-active`/
    // `conflicting-release-identity` classification straight from the
    // stale pre-network read. By the time the classify read actually runs,
    // active has already caught up to exactly `latest` (e.g. another
    // window's own recovery landed first). Classification must use that
    // fresh read: the correct outcome is an exact-active re-preparation
    // success, never a rejection based on the stale snapshot.
    const latest = release(3);
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state: stateWith({ activeRelease: release(1) }) })
      .mockResolvedValueOnce({ status: 'valid', state: stateWith({ activeRelease: latest }) })
      .mockResolvedValueOnce({ status: 'valid', state: stateWith({ activeRelease: latest }) });
    mockLatest(latest);
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const result = await runRecoverInstallLatest(buildDependencies());

    expect(result).toBe('success');
    expect(prepareMock).toHaveBeenCalledWith('stable', '/', latest, descriptorFor(latest));
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('reports state-changed when active changed concurrently during exact-A re-preparation', async () => {
    const active = release(1);
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state: stateWith({ activeRelease: active }) })
      .mockResolvedValueOnce({ status: 'valid', state: stateWith({ activeRelease: active }) })
      .mockResolvedValueOnce({ status: 'valid', state: stateWith({ activeRelease: release(2) }) });
    mockLatest(active);
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    expect(await runRecoverInstallLatest(buildDependencies())).toBe('state-changed');
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('rejects a latest release older than active, without any preparation attempt', async () => {
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: stateWith({ activeRelease: release(5) }),
    });
    mockLatest(release(3));
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    expect(await runRecoverInstallLatest(buildDependencies())).toBe('latest-older-than-active');
    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('rejects a same-number latest release with conflicting identity against active', async () => {
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: stateWith({ activeRelease: release(5) }),
    });
    mockLatest(release(5, { buildId: 'conflicting-build' }));
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    expect(await runRecoverInstallLatest(buildDependencies())).toBe('conflicting-release-identity');
    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('stages a strictly newer latest B as ready, preserving mode/activeRelease/lastSuccessfulCheckAt, when there is no candidate', async () => {
    const active = release(1);
    const latest = release(3);
    const initialState = stateWith({
      activeRelease: active,
      mode: 'manual',
      lastSuccessfulCheckAt: '2026-08-01T00:00:00.000Z',
    });
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state: initialState })
      .mockResolvedValueOnce({ status: 'valid', state: initialState })
      .mockResolvedValueOnce({ status: 'valid', state: initialState });
    mockLatest(latest);
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const result = await runRecoverInstallLatest(buildDependencies());

    expect(result).toBe('success');
    expect(prepareMock).toHaveBeenCalledWith('stable', '/', latest, descriptorFor(latest));
    expect(writeControllerStateMock).toHaveBeenCalledWith('stable', {
      ...initialState,
      candidate: { phase: 'ready', release: latest },
    });
  });

  it('never supersedes a pinned ready candidate that differs from B: state-changed, no write, no wasted preparation', async () => {
    const active = release(1);
    const pinned = { phase: 'ready' as const, release: release(4) };
    const state = stateWith({ activeRelease: active, candidate: pinned });
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state })
      .mockResolvedValueOnce({ status: 'valid', state });
    mockLatest(release(3));
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    expect(await runRecoverInstallLatest(buildDependencies())).toBe('state-changed');
    expect(writeControllerStateMock).not.toHaveBeenCalled();
    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('never supersedes a pinned activating candidate that differs from B: state-changed, no write, no wasted preparation', async () => {
    const active = release(1);
    const pinned = {
      phase: 'activating' as const,
      release: release(4),
      deadlineAt: '2026-08-02T00:00:30.000Z',
    };
    const state = stateWith({ activeRelease: active, candidate: pinned });
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state })
      .mockResolvedValueOnce({ status: 'valid', state });
    mockLatest(release(3));
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    expect(await runRecoverInstallLatest(buildDependencies())).toBe('state-changed');
    expect(writeControllerStateMock).not.toHaveBeenCalled();
    // Classified against the fresh pinned candidate before ever preparing B:
    // a doomed target is never downloaded/verified only to be discarded.
    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('is idempotent when the pinned ready candidate already exactly matches B: success, no write', async () => {
    const active = release(1);
    const latest = release(3);
    const pinned = { phase: 'ready' as const, release: latest };
    const state = stateWith({ activeRelease: active, candidate: pinned });
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state })
      .mockResolvedValueOnce({ status: 'valid', state });
    mockLatest(latest);
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    expect(await runRecoverInstallLatest(buildDependencies())).toBe('success');
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('does not replace an existing available candidate that is already newer than B: state-changed, no write, no wasted preparation', async () => {
    const active = release(1);
    const state = stateWith({
      activeRelease: active,
      candidate: { phase: 'available' as const, release: release(5) },
    });
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state })
      .mockResolvedValueOnce({ status: 'valid', state });
    mockLatest(release(3));
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    expect(await runRecoverInstallLatest(buildDependencies())).toBe('state-changed');
    expect(writeControllerStateMock).not.toHaveBeenCalled();
    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('replaces an older available candidate with ready(B)', async () => {
    const active = release(1);
    const latest = release(5);
    const state = stateWith({
      activeRelease: active,
      candidate: { phase: 'available' as const, release: release(3) },
    });
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state })
      .mockResolvedValueOnce({ status: 'valid', state })
      .mockResolvedValueOnce({ status: 'valid', state });
    mockLatest(latest);
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    expect(await runRecoverInstallLatest(buildDependencies())).toBe('success');
    expect(writeControllerStateMock).toHaveBeenCalledWith('stable', {
      ...state,
      candidate: { phase: 'ready', release: latest },
    });
  });

  it('replaces an older failed candidate with ready(B)', async () => {
    const active = release(1);
    const latest = release(5);
    const state = stateWith({
      activeRelease: active,
      candidate: { phase: 'failed' as const, release: release(3) },
    });
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state })
      .mockResolvedValueOnce({ status: 'valid', state })
      .mockResolvedValueOnce({ status: 'valid', state });
    mockLatest(latest);
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    expect(await runRecoverInstallLatest(buildDependencies())).toBe('success');
    expect(writeControllerStateMock).toHaveBeenCalledWith('stable', {
      ...state,
      candidate: { phase: 'ready', release: latest },
    });
  });

  it('rejects a same-number conflicting available candidate against B as conflicting-release-identity', async () => {
    const active = release(1);
    const latest = release(5);
    const state = stateWith({
      activeRelease: active,
      candidate: { phase: 'available' as const, release: release(5, { buildId: 'other-build' }) },
    });
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state })
      .mockResolvedValueOnce({ status: 'valid', state });
    mockLatest(latest);
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    expect(await runRecoverInstallLatest(buildDependencies())).toBe('conflicting-release-identity');
    expect(writeControllerStateMock).not.toHaveBeenCalled();
    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('reports state-changed when active changed concurrently during B preparation (between classification and the final write), without writing', async () => {
    const state = stateWith({ activeRelease: release(1) });
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state })
      .mockResolvedValueOnce({ status: 'valid', state })
      .mockResolvedValueOnce({ status: 'valid', state: stateWith({ activeRelease: release(2) }) });
    mockLatest(release(5));
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    expect(await runRecoverInstallLatest(buildDependencies())).toBe('state-changed');
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('classifies a preparation failure for B as release-preparation-failed, without writing', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'valid', state: stateWith({}) });
    mockLatest(release(5));
    prepareMock.mockRejectedValue(new Error('integrity failure'));
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    expect(await runRecoverInstallLatest(buildDependencies())).toBe('release-preparation-failed');
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('reports controller-state-persistence-failed when the final candidate write throws', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'valid', state: stateWith({}) });
    mockLatest(release(5));
    writeControllerStateMock.mockRejectedValue(new Error('quota exceeded'));
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    expect(await runRecoverInstallLatest(buildDependencies())).toBe(
      'controller-state-persistence-failed',
    );
  });
});

describe('queue boundaries', () => {
  it('runs network fetch and preparation before ever entering the short OperationQueue, so a concurrent unrelated queued operation is never blocked behind them', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    const latest = release(5);
    mockLatest(latest);
    const callOrder: string[] = [];
    let releasePrepare: () => void = () => {};
    let resolvePrepareStarted: () => void = () => {};
    const prepareStarted = new Promise<void>((resolve) => {
      resolvePrepareStarted = resolve;
    });
    prepareMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          callOrder.push('prepare-start');
          resolvePrepareStarted();
          releasePrepare = () => {
            callOrder.push('prepare-end');
            resolve();
          };
        }),
    );
    writeControllerStateMock.mockImplementation(() => {
      callOrder.push('finalize-write');
    });

    const enqueue = createOperationQueue();
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const recoveryPromise = runRecoverInstallLatest(buildDependencies(enqueue));
    // A short unrelated queued operation, scheduled deterministically once
    // prepare() has actually started (proving it runs outside the queue)
    // but while it is still in-flight, must resolve immediately rather than
    // waiting for prepare() to finish.
    await prepareStarted;
    const unrelatedResult = await enqueue(() => {
      callOrder.push('unrelated-op');
      return Promise.resolve('done');
    });
    expect(unrelatedResult).toBe('done');
    expect(callOrder).toEqual(['prepare-start', 'unrelated-op']);

    releasePrepare();
    await recoveryPromise;
    expect(callOrder).toEqual(['prepare-start', 'unrelated-op', 'prepare-end', 'finalize-write']);
  });
});
