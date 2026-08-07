import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseDescriptor, ReleaseSummary } from './contracts';
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
  it('fails closed on a storage-unavailable initial read, before any network fetch: no state change, no cleanup target', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'storage-unavailable' });
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const outcome = await runRecoverInstallLatest(buildDependencies());

    expect(outcome).toEqual({ result: 'controller-storage-unavailable', stateChanged: false });
    expect(fetchLatestReleasePointerMock).not.toHaveBeenCalled();
    expect(prepareMock).not.toHaveBeenCalled();
  });
});

describe('state-loss recovery (absent/invalid initial state)', () => {
  it.each(['absent', 'invalid'] as const)(
    'writes a fresh Automatic baseline with no candidate for %s state, reporting stateChanged and no cleanup target',
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

      const outcome = await runRecoverInstallLatest(buildDependencies());

      expect(outcome).toEqual({ result: 'success', stateChanged: true });
      expect(prepareMock).toHaveBeenCalledWith('stable', '/', latest, descriptorFor(latest));
      expect(writeControllerStateMock).toHaveBeenCalledWith('stable', {
        schemaVersion: 1,
        mode: 'automatic',
        activeRelease: latest,
      });
    },
  );

  it('classifies a latest.json/descriptor fetch failure as network-or-latest-unavailable, without preparing, writing, or a cleanup target', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 5 });
    const { releasePreparationError, ReleasePreparationFailureReason } =
      await import('./releasePreparation');
    fetchReleaseDescriptorMock.mockRejectedValue(
      releasePreparationError(
        ReleasePreparationFailureReason.ARCHIVE_UNAVAILABLE,
        'Failed to fetch release descriptor',
      ),
    );
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const outcome = await runRecoverInstallLatest(buildDependencies());

    expect(outcome).toEqual({ result: 'network-or-latest-unavailable', stateChanged: false });
    expect(prepareMock).not.toHaveBeenCalled();
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('classifies structurally invalid latest metadata as invalid-latest-metadata, with no cleanup target', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    const { releasePreparationError, ReleasePreparationFailureReason } =
      await import('./releasePreparation');
    fetchLatestReleasePointerMock.mockRejectedValue(
      releasePreparationError(
        ReleasePreparationFailureReason.INVALID_ARCHIVE_METADATA,
        'latest.json is structurally invalid',
      ),
    );
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const outcome = await runRecoverInstallLatest(buildDependencies());

    expect(outcome).toEqual({ result: 'invalid-latest-metadata', stateChanged: false });
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('classifies a preparation failure as release-preparation-failed, without writing or a cleanup target (prepareRelease already self-cleans)', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    mockLatest(release(5));
    prepareMock.mockRejectedValue(new Error('integrity failure'));
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const outcome = await runRecoverInstallLatest(buildDependencies());

    expect(outcome).toEqual({ result: 'release-preparation-failed', stateChanged: false });
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('never overwrites another window’s already-completed identical recovery: idempotent success, no write, no cleanup target', async () => {
    const latest = release(5);
    readControllerStateMock.mockResolvedValueOnce({ status: 'absent' }).mockResolvedValueOnce({
      status: 'valid',
      state: { schemaVersion: 1, mode: 'automatic', activeRelease: latest },
    });
    mockLatest(latest);
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const outcome = await runRecoverInstallLatest(buildDependencies());

    expect(outcome).toEqual({ result: 'success', stateChanged: false });
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('reports state-changed, without overwriting or scheduling cleanup, when another window landed a different valid state', async () => {
    const latest = release(5);
    readControllerStateMock.mockResolvedValueOnce({ status: 'absent' }).mockResolvedValueOnce({
      status: 'valid',
      state: { schemaVersion: 1, mode: 'manual', activeRelease: release(9) },
    });
    mockLatest(latest);
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const outcome = await runRecoverInstallLatest(buildDependencies());

    expect(outcome).toEqual({ result: 'state-changed', stateChanged: false });
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('reports controller-storage-unavailable when finalization cannot re-read state, without writing and without claiming the prepared target unowned', async () => {
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'absent' })
      .mockResolvedValueOnce({ status: 'storage-unavailable' });
    mockLatest(release(5));
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const outcome = await runRecoverInstallLatest(buildDependencies());

    expect(outcome).toEqual({ result: 'controller-storage-unavailable', stateChanged: false });
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('reports controller-state-persistence-failed without scheduling cleanup when the final write throws, leaving the just-prepared release cache untouched', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    const latest = release(5);
    mockLatest(latest);
    writeControllerStateMock.mockRejectedValue(new Error('quota exceeded'));
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const outcome = await runRecoverInstallLatest(buildDependencies());

    expect(outcome).toEqual({ result: 'controller-state-persistence-failed', stateChanged: false });
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
