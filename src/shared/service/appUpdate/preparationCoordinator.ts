import type { ManagedChannel, ReleaseDescriptor, ReleaseRef } from './contracts';
import { fetchReleaseDescriptor, prepareRelease } from './releasePreparation';

/**
 * Deduplicates concurrent release preparation by release id, and arbitrates
 * preparation against managed release-cache cleanup, entirely outside the
 * short state lock (see `stateLock.ts`).
 *
 * A worker-local transient map, never persisted: two callers requesting the
 * same release id (e.g. an explicit `INSTALL_ON_NEXT_LAUNCH` racing an
 * automatic background check for the same discovered release) share one
 * in-flight fetch+hash+cache-write instead of duplicating the work. The map
 * entry is removed once the attempt settles, success or failure, so a later
 * retry always starts fresh rather than replaying a stale rejection.
 *
 * This is also the single worker-local owner of arbitration between
 * preparation and cleanup (see {@link runCleanup} on the returned value):
 * cleanup policy itself still belongs to `releaseCache.ts`.
 */
export type PreparationCoordinator = {
  /**
   * Prepares `target`, or joins an already in-flight preparation for the
   * same release id. While a cleanup started through {@link runCleanup} is
   * still running, a genuinely new preparation defers its own network fetch
   * and cache write until that cleanup settles, so the two can never touch
   * the same release cache at once.
   * @param channel - Managed channel.
   * @param channelBasePath - This worker's channel base path.
   * @param target - The release to prepare.
   * @returns The validated release descriptor once preparation succeeds.
   * @throws When fetching or preparing the release fails.
   */
  prepare: (
    channel: ManagedChannel,
    channelBasePath: string,
    target: ReleaseRef,
  ) => Promise<ReleaseDescriptor>;

  /**
   * Returns the release ids currently being prepared, so cache cleanup can
   * protect their caches from concurrent deletion.
   * @returns Every release id with an in-flight preparation right now.
   */
  getInFlightReleaseIds: () => readonly string[];

  /**
   * Runs `cleanup` under this coordinator's arbitration: every release id
   * already registered as in-flight at the moment this is called is passed
   * to `cleanup` as protected, and — synchronously, before `cleanup` can
   * yield — a worker-local barrier is raised that defers any genuinely new
   * `prepare()` call's own cache-touching work until `cleanup` settles
   * (success or failure). Never cancels an already in-flight preparation.
   * @param cleanup - Runs the actual cache-cleanup policy against the current in-flight release ids.
   * @returns Resolves or rejects exactly as `cleanup` does, once it settles.
   */
  runCleanup: (cleanup: (inFlightReleaseIds: readonly string[]) => Promise<void>) => Promise<void>;
};

/**
 * Creates a new, empty {@link PreparationCoordinator}.
 * @returns A coordinator with no in-flight preparations.
 */
export function createPreparationCoordinator(): PreparationCoordinator {
  const inFlight = new Map<string, Promise<ReleaseDescriptor>>();
  let cleanupBarrier: Promise<void> | undefined;

  return {
    prepare(channel, channelBasePath, target) {
      const existing = inFlight.get(target.releaseId);
      if (existing) return existing;

      const barrierToAwait = cleanupBarrier;
      const attempt = (async () => {
        // A cleanup already running at the moment this preparation was
        // requested read its protected-id snapshot before this attempt
        // existed, so it may legitimately delete a stale cache under this
        // exact release id — this attempt must not touch that cache until
        // cleanup has fully settled, win or lose.
        if (barrierToAwait) await barrierToAwait;
        const descriptor = await fetchReleaseDescriptor(channelBasePath, target);
        await prepareRelease(channelBasePath, channel, descriptor);
        return descriptor;
      })();

      inFlight.set(target.releaseId, attempt);
      attempt
        .catch(() => {})
        .finally(() => {
          if (inFlight.get(target.releaseId) === attempt) inFlight.delete(target.releaseId);
        });
      return attempt;
    },

    getInFlightReleaseIds() {
      return [...inFlight.keys()];
    },

    runCleanup(cleanup) {
      const inFlightSnapshot = [...inFlight.keys()];
      let releaseBarrier: () => void = () => {};
      const barrier = new Promise<void>((resolve) => {
        releaseBarrier = resolve;
      });
      cleanupBarrier = barrier;

      return (async () => {
        try {
          await cleanup(inFlightSnapshot);
        } finally {
          releaseBarrier();
          if (cleanupBarrier === barrier) cleanupBarrier = undefined;
        }
      })();
    },
  };
}
