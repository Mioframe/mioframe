import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseDescriptor, ReleaseSummary, UpdateControllerState } from './contracts';

const readControllerStateMock = vi.fn();
const writeControllerStateMock = vi.fn();
const fetchLatestReleasePointerMock = vi.fn();
const fetchReleaseDescriptorMock = vi.fn();
const prepareMock = vi.fn();
const reportReleasePreparationFailureMock = vi.fn();

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
    reportReleasePreparationFailure: (...args: unknown[]) =>
      reportReleasePreparationFailureMock(...args),
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
  reportReleasePreparationFailureMock.mockReset();
  prepareMock.mockReset().mockResolvedValue(undefined);
});

describe('direct discovery failure reporting', () => {
  it('reports a latest.json/descriptor fetch failure exactly once, before any preparation attempt', async () => {
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: { schemaVersion: 1, mode: 'automatic', activeRelease: release(1) },
    });
    const { releasePreparationError, ReleasePreparationFailureReason } =
      await import('./releasePreparation');
    const discoveryError = releasePreparationError(
      ReleasePreparationFailureReason.INVALID_ARCHIVE_METADATA,
      'latest.json is structurally invalid',
    );
    fetchLatestReleasePointerMock.mockRejectedValue(discoveryError);
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const outcome = await runRecoverInstallLatest(buildDependencies());

    expect(outcome).toEqual({ result: 'invalid-latest-metadata', stateChanged: false });
    expect(prepareMock).not.toHaveBeenCalled();
    expect(reportReleasePreparationFailureMock).toHaveBeenCalledExactlyOnceWith(discoveryError);
  });
});

describe('known-active recovery (valid initial state)', () => {
  function stateWith(overrides: Partial<UpdateControllerState>): UpdateControllerState {
    return { schemaVersion: 1, mode: 'automatic', activeRelease: release(1), ...overrides };
  }

  it('re-prepares exact active A when latest exactly matches it, without writing any state or scheduling cleanup', async () => {
    const active = release(1);
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state: stateWith({ activeRelease: active }) })
      .mockResolvedValueOnce({ status: 'valid', state: stateWith({ activeRelease: active }) })
      .mockResolvedValueOnce({ status: 'valid', state: stateWith({ activeRelease: active }) });
    mockLatest(active);
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const outcome = await runRecoverInstallLatest(buildDependencies());

    expect(outcome).toEqual({ result: 'success', stateChanged: false });
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

    const outcome = await runRecoverInstallLatest(buildDependencies());

    expect(outcome).toEqual({ result: 'success', stateChanged: false });
    expect(prepareMock).toHaveBeenCalledWith('stable', '/', latest, descriptorFor(latest));
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('reports state-changed, without scheduling cleanup, when active changed concurrently during exact-A re-preparation', async () => {
    const active = release(1);
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state: stateWith({ activeRelease: active }) })
      .mockResolvedValueOnce({ status: 'valid', state: stateWith({ activeRelease: active }) })
      .mockResolvedValueOnce({ status: 'valid', state: stateWith({ activeRelease: release(2) }) });
    mockLatest(active);
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const outcome = await runRecoverInstallLatest(buildDependencies());

    expect(outcome).toEqual({ result: 'state-changed', stateChanged: false });
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('reports controller-storage-unavailable during exact-A re-preparation finalization, without claiming the reprepared cache unowned', async () => {
    const active = release(1);
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state: stateWith({ activeRelease: active }) })
      .mockResolvedValueOnce({ status: 'valid', state: stateWith({ activeRelease: active }) })
      .mockResolvedValueOnce({ status: 'storage-unavailable' });
    mockLatest(active);
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const outcome = await runRecoverInstallLatest(buildDependencies());

    expect(outcome).toEqual({ result: 'controller-storage-unavailable', stateChanged: false });
  });

  it('rejects a latest release older than active, without any preparation attempt or cleanup target', async () => {
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: stateWith({ activeRelease: release(5) }),
    });
    mockLatest(release(3));
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const outcome = await runRecoverInstallLatest(buildDependencies());
    expect(outcome).toEqual({ result: 'latest-older-than-active', stateChanged: false });
    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('rejects a same-number latest release with conflicting identity against active, without a cleanup target', async () => {
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: stateWith({ activeRelease: release(5) }),
    });
    mockLatest(release(5, { buildId: 'conflicting-build' }));
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const outcome = await runRecoverInstallLatest(buildDependencies());
    expect(outcome).toEqual({ result: 'conflicting-release-identity', stateChanged: false });
    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('stages a strictly newer latest B as ready, preserving mode/activeRelease/lastSuccessfulCheckAt, when there is no candidate — reports stateChanged, no cleanup target', async () => {
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

    const outcome = await runRecoverInstallLatest(buildDependencies());

    expect(outcome).toEqual({ result: 'success', stateChanged: true });
    expect(prepareMock).toHaveBeenCalledWith('stable', '/', latest, descriptorFor(latest));
    expect(writeControllerStateMock).toHaveBeenCalledWith('stable', {
      ...initialState,
      candidate: { phase: 'ready', release: latest },
    });
  });

  it('never supersedes a pinned ready candidate that differs from B: state-changed, no write, no wasted preparation, no cleanup target', async () => {
    const active = release(1);
    const pinned = { phase: 'ready' as const, release: release(4) };
    const state = stateWith({ activeRelease: active, candidate: pinned });
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state })
      .mockResolvedValueOnce({ status: 'valid', state });
    mockLatest(release(3));
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const outcome = await runRecoverInstallLatest(buildDependencies());
    expect(outcome).toEqual({ result: 'state-changed', stateChanged: false });
    expect(writeControllerStateMock).not.toHaveBeenCalled();
    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('never supersedes a pinned activating candidate that differs from B: state-changed, no write, no wasted preparation, no cleanup target', async () => {
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

    const outcome = await runRecoverInstallLatest(buildDependencies());
    expect(outcome).toEqual({ result: 'state-changed', stateChanged: false });
    expect(writeControllerStateMock).not.toHaveBeenCalled();
    // Classified against the fresh pinned candidate before ever preparing B:
    // a doomed target is never downloaded/verified only to be discarded.
    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('is idempotent when the pinned ready candidate already exactly matches B: success, no write, no cleanup target', async () => {
    const active = release(1);
    const latest = release(3);
    const pinned = { phase: 'ready' as const, release: latest };
    const state = stateWith({ activeRelease: active, candidate: pinned });
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state })
      .mockResolvedValueOnce({ status: 'valid', state });
    mockLatest(latest);
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const outcome = await runRecoverInstallLatest(buildDependencies());
    expect(outcome).toEqual({ result: 'success', stateChanged: false });
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('does not replace an existing available candidate that is already newer than B: state-changed, no write, no wasted preparation, no cleanup target', async () => {
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

    const outcome = await runRecoverInstallLatest(buildDependencies());
    expect(outcome).toEqual({ result: 'state-changed', stateChanged: false });
    expect(writeControllerStateMock).not.toHaveBeenCalled();
    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('replaces an older available candidate with ready(B), reporting stateChanged and no cleanup target', async () => {
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

    const outcome = await runRecoverInstallLatest(buildDependencies());
    expect(outcome).toEqual({ result: 'success', stateChanged: true });
    expect(writeControllerStateMock).toHaveBeenCalledWith('stable', {
      ...state,
      candidate: { phase: 'ready', release: latest },
    });
  });

  it('replaces an older failed candidate with ready(B), reporting stateChanged and no cleanup target', async () => {
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

    const outcome = await runRecoverInstallLatest(buildDependencies());
    expect(outcome).toEqual({ result: 'success', stateChanged: true });
    expect(writeControllerStateMock).toHaveBeenCalledWith('stable', {
      ...state,
      candidate: { phase: 'ready', release: latest },
    });
  });

  it('rejects a same-number conflicting available candidate against B as conflicting-release-identity, without a cleanup target (decided before preparation)', async () => {
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

    const outcome = await runRecoverInstallLatest(buildDependencies());
    expect(outcome).toEqual({ result: 'conflicting-release-identity', stateChanged: false });
    expect(writeControllerStateMock).not.toHaveBeenCalled();
    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('rejects a same-number conflicting available candidate discovered only after preparing B: post-preparation conflicting-release-identity, without scheduling cleanup', async () => {
    const active = release(1);
    const latest = release(5);
    const preClassificationState = stateWith({ activeRelease: active });
    const postPrepState = stateWith({
      activeRelease: active,
      candidate: { phase: 'available' as const, release: release(5, { buildId: 'other-build' }) },
    });
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state: preClassificationState })
      .mockResolvedValueOnce({ status: 'valid', state: preClassificationState })
      .mockResolvedValueOnce({ status: 'valid', state: postPrepState });
    mockLatest(latest);
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const outcome = await runRecoverInstallLatest(buildDependencies());
    expect(outcome).toEqual({ result: 'conflicting-release-identity', stateChanged: false });
    expect(writeControllerStateMock).not.toHaveBeenCalled();
    expect(prepareMock).toHaveBeenCalled();
  });

  it('reports state-changed, without scheduling cleanup, when active changed concurrently during B preparation (between classification and the final write), without writing', async () => {
    const latest = release(5);
    const state = stateWith({ activeRelease: release(1) });
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state })
      .mockResolvedValueOnce({ status: 'valid', state })
      .mockResolvedValueOnce({ status: 'valid', state: stateWith({ activeRelease: release(2) }) });
    mockLatest(latest);
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const outcome = await runRecoverInstallLatest(buildDependencies());
    expect(outcome).toEqual({ result: 'state-changed', stateChanged: false });
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('reports controller-storage-unavailable during B finalization, without claiming the prepared cache unowned', async () => {
    const state = stateWith({ activeRelease: release(1) });
    readControllerStateMock
      .mockResolvedValueOnce({ status: 'valid', state })
      .mockResolvedValueOnce({ status: 'valid', state })
      .mockResolvedValueOnce({ status: 'storage-unavailable' });
    mockLatest(release(5));
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const outcome = await runRecoverInstallLatest(buildDependencies());
    expect(outcome).toEqual({ result: 'controller-storage-unavailable', stateChanged: false });
  });

  it('classifies a preparation failure for B as release-preparation-failed, without writing or a cleanup target', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'valid', state: stateWith({}) });
    mockLatest(release(5));
    prepareMock.mockRejectedValue(new Error('integrity failure'));
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const outcome = await runRecoverInstallLatest(buildDependencies());
    expect(outcome).toEqual({ result: 'release-preparation-failed', stateChanged: false });
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('reports controller-state-persistence-failed without scheduling cleanup when the final candidate write throws', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'valid', state: stateWith({}) });
    mockLatest(release(5));
    writeControllerStateMock.mockRejectedValue(new Error('quota exceeded'));
    const { runRecoverInstallLatest } = await import('./recoveryOrchestration');

    const outcome = await runRecoverInstallLatest(buildDependencies());
    expect(outcome).toEqual({ result: 'controller-state-persistence-failed', stateChanged: false });
  });
});
