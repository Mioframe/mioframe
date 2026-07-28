import type { ManagedChannel, ReleaseDescriptor, ReleaseRef } from './contracts';
import { fetchReleaseDescriptor, prepareRelease } from './releasePreparation';

/**
 * Deduplicates concurrent release preparation by release id, entirely
 * outside the short state lock (see `stateLock.ts`).
 *
 * A worker-local transient map, never persisted: two callers requesting the
 * same release id (e.g. an explicit `INSTALL_ON_NEXT_LAUNCH` racing an
 * automatic background check for the same discovered release) share one
 * in-flight fetch+hash+cache-write instead of duplicating the work. The map
 * entry is removed once the attempt settles, success or failure, so a later
 * retry always starts fresh rather than replaying a stale rejection.
 */
export type PreparationCoordinator = {
  /**
   * Prepares `target`, or joins an already in-flight preparation for the
   * same release id.
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
};

/**
 * Creates a new, empty {@link PreparationCoordinator}.
 * @returns A coordinator with no in-flight preparations.
 */
export function createPreparationCoordinator(): PreparationCoordinator {
  const inFlight = new Map<string, Promise<ReleaseDescriptor>>();

  return {
    prepare(channel, channelBasePath, target) {
      const existing = inFlight.get(target.releaseId);
      if (existing) return existing;

      const attempt = (async () => {
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
  };
}
