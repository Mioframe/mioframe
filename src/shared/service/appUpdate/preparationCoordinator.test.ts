import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseDescriptor, ReleaseSummary } from './contracts';

const fetchReleaseDescriptorMock = vi.fn();
const prepareReleaseMock = vi.fn();

vi.mock('./releasePreparation', async () => {
  const actual =
    await vi.importActual<typeof import('./releasePreparation')>('./releasePreparation');
  return {
    ...actual,
    fetchReleaseDescriptor: (...args: unknown[]) => fetchReleaseDescriptorMock(...args),
    prepareRelease: (...args: unknown[]) => prepareReleaseMock(...args),
  };
});

const releaseA: ReleaseSummary = {
  releaseNumber: 1,
  appVersion: '1.0.0',
  buildId: 'build-a',
  buildDate: '2026-07-24T00:00:00.000Z',
};
const releaseB: ReleaseSummary = {
  releaseNumber: 2,
  appVersion: '1.1.0',
  buildId: 'build-b',
  buildDate: '2026-07-24T00:00:00.000Z',
};

function buildDescriptor(release: ReleaseSummary): ReleaseDescriptor {
  return {
    schemaVersion: 1,
    releaseNumber: release.releaseNumber,
    appVersion: release.appVersion,
    buildId: release.buildId,
    buildDate: release.buildDate,
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

  it('joins concurrent prepare calls only when their complete release summaries match', async () => {
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

  it.each([
    ['appVersion', '9.9.9'],
    ['buildId', 'conflicting-build'],
    ['buildDate', '2026-07-25T00:00:00.000Z'],
  ] as const)(
    'rejects a concurrent same-number caller whose %s conflicts without replacing the legitimate attempt',
    async (field, value) => {
      const fetchGate = createDeferred<ReleaseDescriptor>();
      fetchReleaseDescriptorMock.mockReturnValue(fetchGate.promise);
      prepareReleaseMock.mockResolvedValue(undefined);
      const { createPreparationCoordinator } = await import('./preparationCoordinator');
      const coordinator = createPreparationCoordinator();

      const legitimateAttempt = coordinator.prepare('stable', '/', releaseA);
      const conflict = coordinator.prepare('stable', '/', { ...releaseA, [field]: value });

      await expect(conflict).rejects.toThrow('Conflicting release identity');
      expect(fetchReleaseDescriptorMock).toHaveBeenCalledTimes(1);
      expect(prepareReleaseMock).not.toHaveBeenCalled();
      const cleanup = vi.fn().mockResolvedValue(undefined);
      await coordinator.runCleanup(cleanup);
      expect(cleanup).toHaveBeenCalledWith([releaseA.releaseNumber]);

      fetchGate.resolve(descriptorA);
      await expect(legitimateAttempt).resolves.toBe(descriptorA);
      expect(prepareReleaseMock).toHaveBeenCalledTimes(1);
    },
  );

  it('does not deduplicate different release numbers', async () => {
    fetchReleaseDescriptorMock.mockImplementation((_base: string, target: ReleaseSummary) =>
      target.releaseNumber === releaseA.releaseNumber ? descriptorA : descriptorB,
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

  it.each([
    ['appVersion', '9.9.9'],
    ['buildId', 'conflicting-build'],
    ['buildDate', '2026-07-25T00:00:00.000Z'],
  ] as const)(
    'never prepares a provided same-number descriptor whose %s conflicts, and fetches the exact target instead',
    async (field, value) => {
      fetchReleaseDescriptorMock.mockResolvedValue(descriptorA);
      prepareReleaseMock.mockResolvedValue(undefined);
      const { createPreparationCoordinator } = await import('./preparationCoordinator');
      const coordinator = createPreparationCoordinator();
      const mismatchedDescriptor = { ...descriptorA, [field]: value };

      await expect(
        coordinator.prepare('stable', '/', releaseA, mismatchedDescriptor),
      ).resolves.toBe(descriptorA);

      expect(fetchReleaseDescriptorMock).toHaveBeenCalledTimes(1);
      expect(prepareReleaseMock).toHaveBeenCalledWith('/', 'stable', descriptorA);
      expect(prepareReleaseMock).not.toHaveBeenCalledWith('/', 'stable', mismatchedDescriptor);
    },
  );

  it.each([
    ['appVersion', '9.9.9'],
    ['buildId', 'different-build'],
    ['buildDate', '2026-07-25T00:00:00.000Z'],
  ] as const)(
    'rejects, without preparing, a fetched descriptor whose %s does not exactly match the target — a shared releaseNumber alone is not enough — as a typed INVALID_ARCHIVE_METADATA ReleasePreparationError, not a generic Error',
    async (field, value) => {
      // `fetchReleaseDescriptor` only proves `releaseNumber` matches; a
      // restoration target already knows the complete expected identity
      // (releaseNumber, appVersion, buildId, buildDate), and a same-number
      // descriptor that diverges on any other field must never be accepted.
      fetchReleaseDescriptorMock.mockResolvedValue({ ...descriptorA, [field]: value });
      prepareReleaseMock.mockResolvedValue(undefined);
      const { createPreparationCoordinator } = await import('./preparationCoordinator');
      const { ReleasePreparationError } = await import('./releasePreparation');
      const coordinator = createPreparationCoordinator();

      await expect(coordinator.prepare('stable', '/', releaseA)).rejects.toThrow(
        'does not match the expected release identity',
      );
      let caught: unknown;
      try {
        await coordinator.prepare('stable', '/', releaseA);
      } catch (error) {
        caught = error;
      }
      if (!(caught instanceof ReleasePreparationError)) {
        throw new Error('Expected a ReleasePreparationError');
      }
      expect(caught.reason).toBe('INVALID_ARCHIVE_METADATA');
      expect(prepareReleaseMock).not.toHaveBeenCalled();
    },
  );

  it('releases the map entry inside the same settlement segment: an immediate retry from the rejection catch continuation creates a genuinely new preparation, never joining the already-settled one', async () => {
    fetchReleaseDescriptorMock
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(descriptorA);
    prepareReleaseMock.mockResolvedValue(undefined);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    const firstAttempt = coordinator.prepare('stable', '/', releaseA);
    let secondAttempt: ReturnType<typeof coordinator.prepare> | undefined;
    await firstAttempt.catch(() => {
      // Immediately, in this same catch continuation — the exact microtask
      // boundary the settlement-race fix targets — retry.
      secondAttempt = coordinator.prepare('stable', '/', releaseA);
    });

    expect(secondAttempt).toBeDefined();
    expect(secondAttempt).not.toBe(firstAttempt);
    await expect(secondAttempt).resolves.toBe(descriptorA);
    expect(fetchReleaseDescriptorMock).toHaveBeenCalledTimes(2);
  });

  it('an immediate retry from a success continuation creates a new attempt rather than joining the already-settled promise', async () => {
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorA);
    prepareReleaseMock.mockResolvedValue(undefined);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    const firstAttempt = coordinator.prepare('stable', '/', releaseA);
    let secondAttempt: ReturnType<typeof coordinator.prepare> | undefined;
    await firstAttempt.then(() => {
      secondAttempt = coordinator.prepare('stable', '/', releaseA);
    });

    expect(secondAttempt).toBeDefined();
    expect(secondAttempt).not.toBe(firstAttempt);
    await expect(secondAttempt).resolves.toBe(descriptorA);
    // A genuinely new, independent no-op attempt against the already valid
    // cache — not a join of the first, already-settled promise.
    expect(fetchReleaseDescriptorMock).toHaveBeenCalledTimes(2);
    expect(prepareReleaseMock).toHaveBeenCalledTimes(2);
  });

  it('allows a fresh retry after an identity-mismatch rejection', async () => {
    fetchReleaseDescriptorMock
      .mockResolvedValueOnce({ ...descriptorA, buildId: 'different-build' })
      .mockResolvedValueOnce(descriptorA);
    prepareReleaseMock.mockResolvedValue(undefined);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    await expect(coordinator.prepare('stable', '/', releaseA)).rejects.toThrow();
    const retried = await coordinator.prepare('stable', '/', releaseA);

    expect(retried).toBe(descriptorA);
    expect(fetchReleaseDescriptorMock).toHaveBeenCalledTimes(2);
  });
});

/**
 * Drains the microtask queue repeatedly. Safe to over-flush: a promise
 * chained off a still-pending deferred never resolves early just because
 * unrelated microtasks were flushed, so this only guards against
 * under-counting the hops in a `.then` chain.
 */
async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 10; i += 1) {
    // oxlint-disable-next-line no-await-in-loop -- each hop must complete before scheduling the next microtask.
    // eslint-disable-next-line no-await-in-loop -- each hop must complete before scheduling the next microtask.
    await Promise.resolve();
  }
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

  it('protects a preparation already in flight: cleanup receives its release number', async () => {
    const fetchGate = createDeferred<ReleaseDescriptor>();
    fetchReleaseDescriptorMock.mockReturnValue(fetchGate.promise);
    prepareReleaseMock.mockResolvedValue(undefined);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    const prepareAttempt = coordinator.prepare('stable', '/', releaseA);
    const cleanup = vi.fn().mockResolvedValue(undefined);
    await coordinator.runCleanup(cleanup);

    expect(cleanup).toHaveBeenCalledWith([releaseA.releaseNumber]);

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

  it('still deduplicates concurrent callers for the same release number requested during cleanup', async () => {
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

    expect(cleanup2).toHaveBeenCalledWith([releaseA.releaseNumber]);
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
