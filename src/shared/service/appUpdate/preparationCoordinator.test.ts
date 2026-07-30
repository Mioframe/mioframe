import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseDescriptor, ReleaseRef } from './contracts';

const fetchReleaseDescriptorMock = vi.fn();
const prepareReleaseMock = vi.fn();

vi.mock('./releasePreparation', () => ({
  fetchReleaseDescriptor: (...args: unknown[]) => fetchReleaseDescriptorMock(...args),
  prepareRelease: (...args: unknown[]) => prepareReleaseMock(...args),
}));

const releaseA: ReleaseRef = { releaseId: 'release-a', releaseSequence: 1 };
const releaseB: ReleaseRef = { releaseId: 'release-b', releaseSequence: 2 };

function buildDescriptor(release: ReleaseRef): ReleaseDescriptor {
  return {
    schemaVersion: 1,
    releaseId: release.releaseId,
    releaseSequence: release.releaseSequence,
    appVersion: '1.0.0',
    buildId: 'build-1',
    buildDate: '2026-07-24T00:00:00.000Z',
    indexUrl: `/updates/releases/${release.releaseId}/index.html`,
    indexSha256: '0'.repeat(64),
    indexByteSize: 100,
    files: [{ path: 'assets/app.js', sha256: '0'.repeat(64), byteSize: 3 }],
  };
}

const descriptorA = buildDescriptor(releaseA);
const descriptorB = buildDescriptor(releaseB);

describe('createPreparationCoordinator', () => {
  beforeEach(() => {
    fetchReleaseDescriptorMock.mockReset();
    prepareReleaseMock.mockReset();
  });

  it('prepares a release by fetching its descriptor then preparing it', async () => {
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorA);
    prepareReleaseMock.mockResolvedValue(undefined);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    const result = await coordinator.prepare('stable', '/', releaseA);

    expect(result).toBe(descriptorA);
    expect(prepareReleaseMock).toHaveBeenCalledWith('/', 'stable', descriptorA);
  });

  it('deduplicates concurrent prepare calls for the same release id', async () => {
    let resolveFetch: (value: ReleaseDescriptor) => void = () => {};
    fetchReleaseDescriptorMock.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    prepareReleaseMock.mockResolvedValue(undefined);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    const first = coordinator.prepare('stable', '/', releaseA);
    const second = coordinator.prepare('stable', '/', releaseA);
    resolveFetch(descriptorA);
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult).toBe(descriptorA);
    expect(secondResult).toBe(descriptorA);
    expect(fetchReleaseDescriptorMock).toHaveBeenCalledTimes(1);
    expect(prepareReleaseMock).toHaveBeenCalledTimes(1);
  });

  it('does not deduplicate different release ids', async () => {
    fetchReleaseDescriptorMock.mockImplementation((_base: string, target: ReleaseRef) =>
      target.releaseId === releaseA.releaseId ? descriptorA : descriptorB,
    );
    prepareReleaseMock.mockResolvedValue(undefined);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    const [a, b] = await Promise.all([
      coordinator.prepare('stable', '/', releaseA),
      coordinator.prepare('stable', '/', releaseB),
    ]);

    expect(a).toBe(descriptorA);
    expect(b).toBe(descriptorB);
    expect(fetchReleaseDescriptorMock).toHaveBeenCalledTimes(2);
  });

  it('allows a fresh retry after a failed preparation, rather than replaying the rejection', async () => {
    fetchReleaseDescriptorMock
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(descriptorA);
    prepareReleaseMock.mockResolvedValue(undefined);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    await expect(coordinator.prepare('stable', '/', releaseA)).rejects.toThrow('network down');
    const retried = await coordinator.prepare('stable', '/', releaseA);

    expect(retried).toBe(descriptorA);
    expect(fetchReleaseDescriptorMock).toHaveBeenCalledTimes(2);
  });

  it('reuses an already validated descriptor for the same release, skipping a redundant fetch', async () => {
    prepareReleaseMock.mockResolvedValue(undefined);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    const result = await coordinator.prepare('stable', '/', releaseA, descriptorA);

    expect(result).toBe(descriptorA);
    expect(fetchReleaseDescriptorMock).not.toHaveBeenCalled();
    expect(prepareReleaseMock).toHaveBeenCalledWith('/', 'stable', descriptorA);
  });

  it('falls back to an ordinary fetch when the given descriptor does not match the target identity', async () => {
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorA);
    prepareReleaseMock.mockResolvedValue(undefined);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    const result = await coordinator.prepare('stable', '/', releaseA, descriptorB);

    expect(result).toBe(descriptorA);
    expect(fetchReleaseDescriptorMock).toHaveBeenCalledTimes(1);
  });
});

/**
 * Drains the microtask queue repeatedly. Safe to over-flush: a promise
 * chained off a still-pending deferred never resolves early just because
 * unrelated microtasks were flushed, so this only guards against
 * under-counting the hops in a `.then` chain.
 */
async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
}

/**
 * A promise plus its externally callable resolve/reject, for deterministic sequencing.
 * @returns The deferred promise and its resolve/reject functions.
 */
function createDeferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('createPreparationCoordinator: runCleanup arbitration', () => {
  beforeEach(() => {
    fetchReleaseDescriptorMock.mockReset();
    prepareReleaseMock.mockReset();
  });

  it('protects a preparation already in flight: cleanup receives its release id', async () => {
    const fetchGate = createDeferred<ReleaseDescriptor>();
    fetchReleaseDescriptorMock.mockReturnValue(fetchGate.promise);
    prepareReleaseMock.mockResolvedValue(undefined);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    const prepareAttempt = coordinator.prepare('stable', '/', releaseA);
    const cleanup = vi.fn().mockResolvedValue(undefined);
    await coordinator.runCleanup(cleanup);

    expect(cleanup).toHaveBeenCalledWith([releaseA.releaseId]);

    fetchGate.resolve(descriptorA);
    await expect(prepareAttempt).resolves.toBe(descriptorA);
  });

  it('defers a preparation requested during cleanup until cleanup settles, so it never touches its cache concurrently', async () => {
    const cleanupGate = createDeferred();
    const cleanup = vi.fn().mockReturnValue(cleanupGate.promise);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorA);
    prepareReleaseMock.mockResolvedValue(undefined);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    const cleanupDone = coordinator.runCleanup(cleanup);
    const prepareAttempt = coordinator.prepare('stable', '/', releaseA);

    // Give the microtask queue a chance to run: the preparation must not
    // have touched the network or cache yet while cleanup is still pending.
    await Promise.resolve();
    await Promise.resolve();
    expect(fetchReleaseDescriptorMock).not.toHaveBeenCalled();

    cleanupGate.resolve();
    await cleanupDone;
    await expect(prepareAttempt).resolves.toBe(descriptorA);
    expect(fetchReleaseDescriptorMock).toHaveBeenCalledTimes(1);
  });

  it('lets a preparation proceed immediately once cleanup succeeds', async () => {
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorA);
    prepareReleaseMock.mockResolvedValue(undefined);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    await coordinator.runCleanup(() => Promise.resolve());
    const result = await coordinator.prepare('stable', '/', releaseA);

    expect(result).toBe(descriptorA);
  });

  it('releases waiting work and lets a waiting preparation proceed even when cleanup rejects', async () => {
    const cleanupGate = createDeferred();
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorA);
    prepareReleaseMock.mockResolvedValue(undefined);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    const cleanupResult = coordinator.runCleanup(() => cleanupGate.promise);
    const prepareAttempt = coordinator.prepare('stable', '/', releaseA);

    cleanupGate.reject(new Error('cache cleanup failed'));
    await expect(cleanupResult).rejects.toThrow('cache cleanup failed');
    await expect(prepareAttempt).resolves.toBe(descriptorA);
  });

  it('never cancels a preparation already in flight when cleanup starts', async () => {
    const fetchGate = createDeferred<ReleaseDescriptor>();
    fetchReleaseDescriptorMock.mockReturnValue(fetchGate.promise);
    prepareReleaseMock.mockResolvedValue(undefined);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    const prepareAttempt = coordinator.prepare('stable', '/', releaseA);
    await coordinator.runCleanup(() => Promise.resolve());

    fetchGate.resolve(descriptorA);
    await expect(prepareAttempt).resolves.toBe(descriptorA);
    expect(fetchReleaseDescriptorMock).toHaveBeenCalledTimes(1);
  });

  it('still deduplicates concurrent callers for the same release id requested during cleanup', async () => {
    const cleanupGate = createDeferred();
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorA);
    prepareReleaseMock.mockResolvedValue(undefined);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    void coordinator.runCleanup(() => cleanupGate.promise);
    const first = coordinator.prepare('stable', '/', releaseA);
    const second = coordinator.prepare('stable', '/', releaseA);

    cleanupGate.resolve();
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult).toBe(descriptorA);
    expect(secondResult).toBe(descriptorA);
    expect(fetchReleaseDescriptorMock).toHaveBeenCalledTimes(1);
  });

  it('serializes two overlapping cleanup requests: the second never starts before the first resolves', async () => {
    const cleanup1Gate = createDeferred();
    const cleanup2Gate = createDeferred();
    const cleanup1 = vi.fn().mockReturnValue(cleanup1Gate.promise);
    const cleanup2 = vi.fn().mockReturnValue(cleanup2Gate.promise);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    const run1 = coordinator.runCleanup(cleanup1);
    const run2 = coordinator.runCleanup(cleanup2);

    await flushMicrotasks();
    expect(cleanup1).toHaveBeenCalledTimes(1);
    expect(cleanup2).not.toHaveBeenCalled();

    cleanup1Gate.resolve();
    await run1;
    await flushMicrotasks();
    expect(cleanup2).toHaveBeenCalledTimes(1);

    cleanup2Gate.resolve();
    await run2;
  });

  it('waits for both cleanup 1 and cleanup 2 before a preparation requested in between touches the cache', async () => {
    const cleanup1Gate = createDeferred();
    const cleanup2Gate = createDeferred();
    const cleanup1 = vi.fn().mockReturnValue(cleanup1Gate.promise);
    const cleanup2 = vi.fn().mockReturnValue(cleanup2Gate.promise);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorB);
    prepareReleaseMock.mockResolvedValue(undefined);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    const run1 = coordinator.runCleanup(cleanup1);
    const run2 = coordinator.runCleanup(cleanup2);
    const prepareAttempt = coordinator.prepare('stable', '/', releaseB);

    cleanup1Gate.resolve();
    await run1;
    await flushMicrotasks();
    expect(cleanup2).toHaveBeenCalledTimes(1);
    expect(fetchReleaseDescriptorMock).not.toHaveBeenCalled();

    cleanup2Gate.resolve();
    await run2;
    await expect(prepareAttempt).resolves.toBe(descriptorB);
    expect(fetchReleaseDescriptorMock).toHaveBeenCalledTimes(1);
  });

  it('protects a preparation registered before a later, already-scheduled cleanup', async () => {
    const cleanup1Gate = createDeferred();
    const fetchGate = createDeferred<ReleaseDescriptor>();
    const cleanup1 = vi.fn().mockReturnValue(cleanup1Gate.promise);
    const cleanup2 = vi.fn().mockResolvedValue(undefined);
    fetchReleaseDescriptorMock.mockReturnValue(fetchGate.promise);
    prepareReleaseMock.mockResolvedValue(undefined);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    void coordinator.runCleanup(cleanup1);
    const prepareAttempt = coordinator.prepare('stable', '/', releaseA);
    const run2 = coordinator.runCleanup(cleanup2);

    cleanup1Gate.resolve();
    await run2;

    expect(cleanup2).toHaveBeenCalledWith([releaseA.releaseId]);
    fetchGate.resolve(descriptorA);
    await expect(prepareAttempt).resolves.toBe(descriptorA);
  });

  it('does not poison the cleanup chain when a cleanup rejects: later cleanup and preparation still proceed', async () => {
    const cleanup1 = vi.fn().mockRejectedValue(new Error('cleanup 1 failed'));
    const cleanup2 = vi.fn().mockResolvedValue(undefined);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorA);
    prepareReleaseMock.mockResolvedValue(undefined);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    const run1 = coordinator.runCleanup(cleanup1);
    const run2 = coordinator.runCleanup(cleanup2);
    const prepareAttempt = coordinator.prepare('stable', '/', releaseA);

    await expect(run1).rejects.toThrow('cleanup 1 failed');
    await run2;
    expect(cleanup2).toHaveBeenCalledTimes(1);
    await expect(prepareAttempt).resolves.toBe(descriptorA);
  });
});
