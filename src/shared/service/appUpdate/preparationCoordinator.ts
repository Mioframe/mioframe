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
   * same release id. A genuinely new preparation waits for every cleanup
   * already scheduled through {@link runCleanup} at the moment it is
   * registered — including one still queued behind an earlier cleanup —
   * before touching the network or cache, so the two can never touch the
   * same release cache at once. A cleanup scheduled after this call instead
   * sees this preparation as in-flight and protects its release id.
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
   * Runs `cleanup` under this coordinator's arbitration, serialized against
   * every other cleanup run through this coordinator: cleanups never run
   * concurrently with each other, and each one only starts once every
   * earlier-scheduled cleanup has settled. The in-flight release id snapshot
   * passed to `cleanup` is captured when the cleanup actually starts (not
   * when it is scheduled), so it protects every preparation registered up to
   * that point. A `prepare()` call registered before this call sees this
   * cleanup — and any cleanup scheduled after it — defer that preparation's
   * own cache-touching work until they settle, so preparation and cleanup
   * can never touch the same release cache at once. Never cancels an
   * already in-flight preparation.
   * @param cleanup - Runs the actual cache-cleanup policy against the in-flight release ids at cleanup start.
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
  // Chains every runCleanup() call so cleanups never overlap. Always settled
  // (never rejects), so a failed cleanup cannot block later cleanups or
  // preparations waiting behind it.
  let cleanupTail: Promise<void> = Promise.resolve();

  return {
    prepare(channel, channelBasePath, target) {
      const existing = inFlight.get(target.releaseId);
      if (existing) return existing;

      const tailToAwait = cleanupTail;
      const attempt = (async () => {
        // Every cleanup already scheduled at the moment this preparation was
        // registered read its protected-id snapshot before this attempt
        // existed, so it may legitimately delete a stale cache under this
        // exact release id — this attempt must not touch that cache until
        // all of them have fully settled, win or lose.
        await tailToAwait;
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

    runCleanup(cleanup) {
      const run = cleanupTail.then(
        () => cleanup([...inFlight.keys()]),
        () => cleanup([...inFlight.keys()]),
      );
      cleanupTail = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    },
  };
}
