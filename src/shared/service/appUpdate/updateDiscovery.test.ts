import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ReleaseDescriptor,
  ReleaseSummary,
  UpdateCandidate,
  UpdateControllerState,
  UpdateMode,
} from './contracts';
import { buildReleaseCacheName } from './releaseCache';
import { runReconciliationEffects, runUpdateReconciliationPass } from './updateDiscovery';

const readControllerStateMock = vi.fn();
const writeControllerStateMock = vi.fn();
const fetchLatestReleasePointerMock = vi.fn();
const fetchReleaseDescriptorMock = vi.fn();
const reportReleasePreparationFailureMock = vi.fn();
const reportDiscoveryIdentityConflictMock = vi.fn();
const prepareMock = vi.fn();
const postMessageMock = vi.fn();
const cachesKeysMock = vi.fn();
const cachesDeleteMock = vi.fn();

vi.mock('./controllerState', () => ({
  readControllerState: (...args: unknown[]) => readControllerStateMock(...args),
  writeControllerState: (...args: unknown[]) => writeControllerStateMock(...args),
}));
vi.mock('./releasePreparation', () => ({
  fetchLatestReleasePointer: (...args: unknown[]) => fetchLatestReleasePointerMock(...args),
  fetchReleaseDescriptor: (...args: unknown[]) => fetchReleaseDescriptorMock(...args),
  reportReleasePreparationFailure: (...args: unknown[]) =>
    reportReleasePreparationFailureMock(...args),
}));
vi.mock('./appUpdateDiagnosticEvents', () => ({
  reportDiscoveryIdentityConflict: (...args: unknown[]) =>
    reportDiscoveryIdentityConflictMock(...args),
}));
vi.stubGlobal('self', {
  clients: {
    matchAll: () =>
      Promise.resolve([
        {
          id: 'client',
          type: 'window',
          url: 'https://mioframe.example/',
          postMessage: postMessageMock,
        },
      ]),
  },
});
vi.stubGlobal('caches', { keys: cachesKeysMock, delete: cachesDeleteMock });

const release = (releaseNumber: number): ReleaseSummary => ({
  releaseNumber,
  appVersion: `1.${releaseNumber}.0`,
  buildId: `build-${releaseNumber}`,
  buildDate: '2026-08-02T00:00:00.000Z',
});
const descriptor = (releaseNumber: number): ReleaseDescriptor => ({
  schemaVersion: 1,
  ...release(releaseNumber),
  indexSha256: '0'.repeat(64),
  indexByteSize: 100,
  files: [{ path: 'assets/app.js', sha256: '0'.repeat(64), byteSize: 3 }],
});
const candidate = (phase: UpdateCandidate['phase'], releaseNumber: number): UpdateCandidate =>
  phase === 'activating'
    ? { phase, release: release(releaseNumber), deadlineAt: '2026-08-03T00:00:00.000Z' }
    : { phase, release: release(releaseNumber) };

const enqueue = <T>(operation: () => Promise<T>): Promise<T> => operation();
let currentState: UpdateControllerState;
const coordinator = {
  prepare: (...args: unknown[]) => prepareMock(...args),
  runCleanup: (cleanup: (inFlight: readonly number[]) => Promise<void>) => cleanup([]),
};
const dependencies = {
  channel: 'stable' as const,
  channelBasePath: '/',
  channelOrigin: 'https://mioframe.example',
  enqueue,
  coordinator,
};

function setState(mode: UpdateMode, currentCandidate?: UpdateCandidate): void {
  currentState = {
    schemaVersion: 1,
    mode,
    activeRelease: release(1),
    candidate: currentCandidate,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-08-02T12:00:00.000Z'));
  setState('automatic');
  readControllerStateMock
    .mockReset()
    .mockImplementation(() => ({ status: 'valid', state: currentState }));
  writeControllerStateMock.mockReset().mockImplementation((_channel, state) => {
    currentState = state;
  });
  fetchLatestReleasePointerMock.mockReset();
  fetchReleaseDescriptorMock.mockReset();
  reportReleasePreparationFailureMock.mockReset();
  reportDiscoveryIdentityConflictMock.mockReset();
  prepareMock.mockReset().mockResolvedValue(undefined);
  postMessageMock.mockReset();
  cachesKeysMock.mockReset().mockResolvedValue([]);
  cachesDeleteMock.mockReset().mockResolvedValue(true);
});

type MatrixCase = {
  name: string;
  mode: UpdateMode;
  initial?: UpdateCandidate;
  discovered?: number;
  failure?: boolean;
  expectedPhase?: UpdateCandidate['phase'];
  expectedRelease?: number;
  prepared?: number;
};

const matrix: MatrixCase[] = [
  {
    name: 'Manual none + newer',
    mode: 'manual',
    discovered: 2,
    expectedPhase: 'available',
    expectedRelease: 2,
  },
  {
    name: 'Manual available + newer',
    mode: 'manual',
    initial: candidate('available', 2),
    discovered: 3,
    expectedPhase: 'available',
    expectedRelease: 3,
  },
  {
    name: 'Manual available + equal',
    mode: 'manual',
    initial: candidate('available', 2),
    discovered: 2,
    expectedPhase: 'available',
    expectedRelease: 2,
  },
  {
    name: 'Manual failed + newer',
    mode: 'manual',
    initial: candidate('failed', 2),
    discovered: 3,
    expectedPhase: 'available',
    expectedRelease: 3,
  },
  {
    name: 'Manual failed + equal',
    mode: 'manual',
    initial: candidate('failed', 2),
    discovered: 2,
    expectedPhase: 'failed',
    expectedRelease: 2,
  },
  {
    name: 'Automatic none + newer',
    mode: 'automatic',
    discovered: 2,
    expectedPhase: 'ready',
    expectedRelease: 2,
    prepared: 2,
  },
  {
    name: 'Automatic none + current release',
    mode: 'automatic',
    discovered: 1,
  },
  {
    name: 'Automatic available + newer',
    mode: 'automatic',
    initial: candidate('available', 2),
    discovered: 3,
    expectedPhase: 'ready',
    expectedRelease: 3,
    prepared: 3,
  },
  {
    name: 'Automatic available + equal',
    mode: 'automatic',
    initial: candidate('available', 2),
    discovered: 2,
    expectedPhase: 'ready',
    expectedRelease: 2,
    prepared: 2,
  },
  {
    name: 'Automatic available + discovery failure',
    mode: 'automatic',
    initial: candidate('available', 2),
    failure: true,
    expectedPhase: 'ready',
    expectedRelease: 2,
    prepared: 2,
  },
  {
    name: 'Automatic failed + newer',
    mode: 'automatic',
    initial: candidate('failed', 2),
    discovered: 3,
    expectedPhase: 'ready',
    expectedRelease: 3,
    prepared: 3,
  },
  {
    name: 'Automatic failed + equal',
    mode: 'automatic',
    initial: candidate('failed', 2),
    discovered: 2,
    expectedPhase: 'failed',
    expectedRelease: 2,
  },
  {
    name: 'Automatic failed + discovery failure',
    mode: 'automatic',
    initial: candidate('failed', 2),
    failure: true,
    expectedPhase: 'failed',
    expectedRelease: 2,
  },
];

describe('runUpdateReconciliationPass', () => {
  it.each(matrix)(
    '$name',
    async ({ mode, initial, discovered, failure, expectedPhase, expectedRelease, prepared }) => {
      setState(mode, initial);
      if (failure) fetchLatestReleasePointerMock.mockRejectedValue(new Error('offline'));
      else {
        if (discovered === undefined) throw new Error('Expected a discovered release number');
        fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: discovered });
        fetchReleaseDescriptorMock.mockResolvedValue(descriptor(discovered));
      }

      const result = await runUpdateReconciliationPass(dependencies);

      expect(result.snapshot.candidate?.phase).toBe(expectedPhase);
      expect(result.snapshot.candidate?.release.releaseNumber).toBe(expectedRelease);
      expect(prepareMock.mock.calls.map((call) => call[2].releaseNumber)).toEqual(
        prepared ? [prepared] : [],
      );
      expect(result.snapshot.error).toBe(failure ? 'check-failed' : undefined);
    },
  );

  it.each(['ready', 'activating'] as const)(
    'does no network or preparation for %s',
    async (phase) => {
      setState('automatic', candidate(phase, 2));
      await runUpdateReconciliationPass(dependencies);
      expect(fetchLatestReleasePointerMock).not.toHaveBeenCalled();
      expect(prepareMock).not.toHaveBeenCalled();
    },
  );

  it('reports a direct discovery failure exactly once at the release-preparation boundary', async () => {
    const discoveryError = new Error('offline');
    fetchLatestReleasePointerMock.mockRejectedValue(discoveryError);

    await runUpdateReconciliationPass(dependencies);

    expect(reportReleasePreparationFailureMock).toHaveBeenCalledExactlyOnceWith(discoveryError);
  });

  it('never double-reports when the fallback preparation attempt also fails after a discovery failure', async () => {
    setState('automatic', candidate('available', 2));
    const discoveryError = new Error('offline');
    fetchLatestReleasePointerMock.mockRejectedValue(discoveryError);
    prepareMock.mockRejectedValue(new Error('network down'));

    await runUpdateReconciliationPass(dependencies);

    // discoverLatest reports its own discovery failure once; the coordinator
    // owns prepareMock's own rejection separately (not through this mock).
    expect(reportReleasePreparationFailureMock).toHaveBeenCalledExactlyOnceWith(discoveryError);
  });

  it('does not advance lastSuccessfulCheckAt after discovery failure', async () => {
    setState('manual');
    currentState = { ...currentState, lastSuccessfulCheckAt: '2026-08-01T00:00:00.000Z' };
    fetchLatestReleasePointerMock.mockRejectedValue(new Error('offline'));
    await runUpdateReconciliationPass(dependencies);
    expect(currentState.lastSuccessfulCheckAt).toBe('2026-08-01T00:00:00.000Z');
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('updates lastSuccessfulCheckAt for a successful stale discovery', async () => {
    setState('manual', candidate('available', 2));
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 1 });
    fetchReleaseDescriptorMock.mockResolvedValue(descriptor(1));
    await runUpdateReconciliationPass(dependencies);
    expect(currentState.lastSuccessfulCheckAt).toBe('2026-08-02T12:00:00.000Z');
  });

  it('reuses a discovered descriptor only for the exact target identity', async () => {
    setState('automatic', candidate('available', 2));
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 2 });
    fetchReleaseDescriptorMock.mockResolvedValue(descriptor(2));
    await runUpdateReconciliationPass(dependencies);
    expect(prepareMock.mock.calls[0]?.[3]).toEqual(descriptor(2));
  });

  it('refetches instead of reusing a same-number descriptor with conflicting identity', async () => {
    setState('automatic', candidate('available', 2));
    const conflicting = { ...descriptor(2), buildId: 'conflicting-build' };
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 2 });
    fetchReleaseDescriptorMock.mockResolvedValue(conflicting);
    await runUpdateReconciliationPass(dependencies);
    expect(prepareMock.mock.calls[0]?.[3]).toBeUndefined();
  });

  it('fails closed as check-failed and reports the conflict once, without writing state, broadcasting, or cleaning caches, for a same-number conflicting discovery', async () => {
    setState('manual');
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 1 });
    fetchReleaseDescriptorMock.mockResolvedValue({
      ...descriptor(1),
      buildId: 'conflicting-build',
    });

    const result = await runUpdateReconciliationPass(dependencies);

    expect(result.snapshot.error).toBe('check-failed');
    expect(result.effects).toEqual({ broadcastStateChanged: false, cleanupReleaseCache: false });
    expect(writeControllerStateMock).not.toHaveBeenCalled();
    expect(reportDiscoveryIdentityConflictMock).toHaveBeenCalledExactlyOnceWith('stable', 1);
  });

  it('does not run fallback preparation when discovery fails without a candidate', async () => {
    setState('automatic');
    fetchLatestReleasePointerMock.mockRejectedValue(new Error('offline'));
    await expect(runUpdateReconciliationPass(dependencies)).resolves.toMatchObject({
      snapshot: { error: 'check-failed', candidate: undefined },
    });
    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('does not persist, broadcast, clean, or prepare when a candidate becomes pinned during discovery', async () => {
    setState('automatic', candidate('available', 2));
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 3 });
    fetchReleaseDescriptorMock.mockImplementation(() => {
      currentState = { ...currentState, candidate: candidate('ready', 2) };
      return Promise.resolve(descriptor(3));
    });
    const result = await runUpdateReconciliationPass(dependencies);
    expect(writeControllerStateMock).not.toHaveBeenCalled();
    expect(result.effects).toEqual({ broadcastStateChanged: false, cleanupReleaseCache: false });
    expect(postMessageMock).not.toHaveBeenCalled();
    expect(cachesKeysMock).not.toHaveBeenCalled();
    expect(prepareMock).not.toHaveBeenCalled();
  });

  it('cleans after candidate replacement but not after a successful stale discovery', async () => {
    setState('manual', candidate('available', 2));
    cachesKeysMock.mockResolvedValue([buildReleaseCacheName('stable', 2)]);
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 3 });
    fetchReleaseDescriptorMock.mockResolvedValue(descriptor(3));
    const first = await runUpdateReconciliationPass(dependencies);
    await runReconciliationEffects(dependencies, first.effects);
    expect(cachesDeleteMock).toHaveBeenCalledWith(buildReleaseCacheName('stable', 2));

    cachesDeleteMock.mockClear();
    cachesKeysMock.mockClear().mockResolvedValue([buildReleaseCacheName('stable', 4)]);
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 3 });
    fetchReleaseDescriptorMock.mockResolvedValue(descriptor(3));
    const second = await runUpdateReconciliationPass(dependencies);
    await runReconciliationEffects(dependencies, second.effects);
    expect(cachesKeysMock).not.toHaveBeenCalled();
    expect(cachesDeleteMock).not.toHaveBeenCalled();
  });

  it('does not persist a stale preparation completion and preserves its available cache', async () => {
    setState('automatic', candidate('available', 2));
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 2 });
    fetchReleaseDescriptorMock.mockResolvedValue(descriptor(2));
    prepareMock.mockImplementation(() => {
      currentState = { ...currentState, mode: 'manual' };
      return Promise.resolve();
    });
    cachesKeysMock.mockResolvedValue([buildReleaseCacheName('stable', 2)]);
    const result = await runUpdateReconciliationPass(dependencies);
    await runReconciliationEffects(dependencies, result.effects);
    expect(currentState.mode).toBe('manual');
    expect(currentState.candidate?.phase).toBe('available');
    expect(cachesDeleteMock).not.toHaveBeenCalled();
  });

  // Proves completeAutomaticPreparation receives the complete prepared
  // release (not just a bare releaseNumber): a same-number candidate whose
  // metadata changed during preparation must still be rejected as stale.
  it('does not persist a same-number, different-metadata completion and preserves its cache', async () => {
    setState('automatic', candidate('available', 2));
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 2 });
    fetchReleaseDescriptorMock.mockResolvedValue(descriptor(2));
    prepareMock.mockImplementation(() => {
      currentState = {
        ...currentState,
        candidate: { phase: 'available', release: { ...release(2), buildId: 'replaced-build' } },
      };
      return Promise.resolve();
    });
    cachesKeysMock.mockResolvedValue([buildReleaseCacheName('stable', 2)]);
    const result = await runUpdateReconciliationPass(dependencies);
    await runReconciliationEffects(dependencies, result.effects);
    expect(currentState.candidate).toEqual({
      phase: 'available',
      release: { ...release(2), buildId: 'replaced-build' },
    });
    expect(cachesDeleteMock).not.toHaveBeenCalled();
  });

  it('cleans an unprotected stale prepared cache', async () => {
    setState('automatic', candidate('available', 2));
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 2 });
    fetchReleaseDescriptorMock.mockResolvedValue(descriptor(2));
    prepareMock.mockImplementation(() => {
      currentState = { ...currentState, candidate: candidate('available', 3) };
      return Promise.resolve();
    });
    cachesKeysMock.mockResolvedValue([buildReleaseCacheName('stable', 2)]);
    const result = await runUpdateReconciliationPass(dependencies);
    await runReconciliationEffects(dependencies, result.effects);
    expect(cachesDeleteMock).toHaveBeenCalledWith(buildReleaseCacheName('stable', 2));
  });

  it('reports the required effects declaratively, without starting broadcast or cleanup until runReconciliationEffects is explicitly invoked', async () => {
    setState('automatic', candidate('available', 2));
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 3 });
    fetchReleaseDescriptorMock.mockResolvedValue(descriptor(3));
    cachesKeysMock.mockResolvedValue([buildReleaseCacheName('stable', 2)]);

    const result = await runUpdateReconciliationPass(dependencies);

    expect(postMessageMock).not.toHaveBeenCalled();
    expect(cachesKeysMock).not.toHaveBeenCalled();
    expect(cachesDeleteMock).not.toHaveBeenCalled();
    expect(result.effects).toEqual({ broadcastStateChanged: true, cleanupReleaseCache: true });

    await runReconciliationEffects(dependencies, result.effects);
    expect(postMessageMock).toHaveBeenCalled();
    expect(cachesDeleteMock).toHaveBeenCalledWith(buildReleaseCacheName('stable', 2));
  });

  it('merges the broadcast requirement from both discovery and preparation into one actual broadcast', async () => {
    setState('automatic');
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 2 });
    fetchReleaseDescriptorMock.mockResolvedValue(descriptor(2));
    const result = await runUpdateReconciliationPass(dependencies);
    expect(result.effects.broadcastStateChanged).toBe(true);
    await runReconciliationEffects(dependencies, result.effects);
    // Discovery and preparation each durably transitioned state and each
    // requested a broadcast, but declarative effects merge (OR), so only one
    // actual same-channel broadcast runs for this pass, not one per producer.
    expect(postMessageMock).toHaveBeenCalledTimes(1);
  });

  describe('Automatic preparation failure', () => {
    it('classifies a failed preparation as install-failed after successful discovery, leaving the candidate available', async () => {
      setState('automatic');
      fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 2 });
      fetchReleaseDescriptorMock.mockResolvedValue(descriptor(2));
      prepareMock.mockRejectedValue(new Error('network down'));

      const result = await runUpdateReconciliationPass(dependencies);

      expect(result.snapshot.error).toBe('install-failed');
      expect(result.snapshot.candidate).toEqual({ phase: 'available', release: release(2) });
      expect(result.snapshot.activeRelease).toEqual(release(1));
      expect(currentState.candidate?.phase).toBe('available');
    });

    it('classifies a failed fallback preparation as install-failed after a discovery failure, taking precedence over check-failed', async () => {
      setState('automatic', candidate('available', 2));
      fetchLatestReleasePointerMock.mockRejectedValue(new Error('offline'));
      prepareMock.mockRejectedValue(new Error('network down'));

      const result = await runUpdateReconciliationPass(dependencies);

      expect(result.snapshot.error).toBe('install-failed');
      expect(result.snapshot.candidate).toEqual({ phase: 'available', release: release(2) });
      expect(writeControllerStateMock).not.toHaveBeenCalled();
    });

    it('never attempts Automatic preparation, and never reports install-failed, in Manual mode', async () => {
      setState('manual', candidate('available', 2));
      fetchLatestReleasePointerMock.mockRejectedValue(new Error('offline'));

      const result = await runUpdateReconciliationPass(dependencies);

      expect(result.snapshot.error).toBe('check-failed');
      expect(prepareMock).not.toHaveBeenCalled();
    });

    it('does not persist a ready transition when preparation fails', async () => {
      setState('automatic', candidate('available', 2));
      fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 2 });
      fetchReleaseDescriptorMock.mockResolvedValue(descriptor(2));
      prepareMock.mockRejectedValue(new Error('network down'));

      await runUpdateReconciliationPass(dependencies);

      const persistedPhases = writeControllerStateMock.mock.calls.map((call: unknown[]) => {
        const state = call[1];
        const candidate =
          typeof state === 'object' && state !== null ? Reflect.get(state, 'candidate') : undefined;
        return typeof candidate === 'object' && candidate !== null
          ? Reflect.get(candidate, 'phase')
          : undefined;
      });
      expect(persistedPhases).not.toContain('ready');
      expect(currentState.candidate?.phase).toBe('available');
    });

    it('never logs or reports here: the coordinator is this failure single diagnostic owner', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      setState('automatic');
      fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: 2 });
      fetchReleaseDescriptorMock.mockResolvedValue(descriptor(2));
      prepareMock.mockRejectedValue(new Error('network down'));

      await runUpdateReconciliationPass(dependencies);

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
