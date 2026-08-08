import {
  releaseSummariesMatch,
  toReleaseSummary,
  type ManagedChannel,
  type ReleaseDescriptor,
  type ReleaseSummary,
} from './contracts';
import {
  fetchReleaseDescriptor,
  prepareRelease,
  releasePreparationError,
  ReleasePreparationFailureReason,
  reportReleasePreparationFailure,
} from './releasePreparation';

/**
 * Deduplicates concurrent release preparation by release number, and
 * arbitrates preparation against managed release-cache cleanup, entirely
 * outside the short state lock (see `stateLock.ts`).
 *
 * A worker-local transient map, never persisted: two callers requesting the
 * same exact release (e.g. an explicit `INSTALL_ON_NEXT_LAUNCH` racing an
 * automatic background check for the same discovered release) share one
 * in-flight fetch+hash+cache-write instead of duplicating the work. A
 * same-number caller with conflicting metadata rejects without affecting
 * the legitimate attempt. The map entry is removed once that attempt
 * settles, success or failure, so a later retry always starts fresh rather
 * than replaying a stale rejection.
 *
 * This is also the single worker-local owner of arbitration between
 * preparation and cleanup (see {@link runCleanup} on the returned value):
 * cleanup policy itself still belongs to `releaseCache.ts`.
 */
export type PreparationCoordinator = {
  /**
   * Prepares `target`, or joins an already in-flight preparation for the
   * same complete release identity. A genuinely new preparation waits for every cleanup
   * already scheduled through {@link runCleanup} at the moment it is
   * registered — including one still queued behind an earlier cleanup —
   * before touching the network or cache, so the two can never touch the
   * same release cache at once. A cleanup scheduled after this call instead
   * sees this preparation as in-flight and protects its release number.
   * @param channel - Managed channel.
   * @param channelBasePath - This worker's channel base path.
   * @param target - The release to prepare.
   * @param validatedDescriptor - An already fetched and validated descriptor
   * for the exact same release, when the caller has one (e.g. discovery just
   * fetched it), so preparation can skip a redundant descriptor fetch.
   * Ignored, falling back to an ordinary fetch, when its identity does not
   * exactly match `target`.
   * @returns The validated release descriptor once preparation succeeds.
   * @throws When the target conflicts with an in-flight release identity, or fetching or preparing the release fails.
   */
  prepare: (
    channel: ManagedChannel,
    channelBasePath: string,
    target: ReleaseSummary,
    validatedDescriptor?: ReleaseDescriptor,
  ) => Promise<ReleaseDescriptor>;

  /**
   * Runs `cleanup` under this coordinator's arbitration, serialized against
   * every other cleanup run through this coordinator: cleanups never run
   * concurrently with each other, and each one only starts once every
   * earlier-scheduled cleanup has settled. The in-flight release number
   * snapshot passed to `cleanup` is captured when the cleanup actually starts
   * (not when it is scheduled), so it protects every preparation still
   * in-flight at that moment instead of racing to delete its cache.
   *
   * This arbitration is one-directional: `prepare()` waits for the cleanup
   * work already scheduled at the moment it is registered (see
   * {@link prepare}), but a cleanup scheduled *after* an already-registered
   * `prepare()` call never retroactively delays that preparation's own
   * already-running cache-touching work — it simply observes that
   * preparation's release number as in-flight and protects its cache from
   * this cleanup pass instead. Only a `prepare()` call registered after this
   * `runCleanup()` call is itself deferred until this cleanup (and any other
   * already scheduled ahead of it) settles. Never cancels an already
   * in-flight preparation.
   * @param cleanup - Runs the actual cache-cleanup policy against the in-flight release numbers at cleanup start.
   * @returns Resolves or rejects exactly as `cleanup` does, once it settles.
   */
  runCleanup: (
    cleanup: (inFlightReleaseNumbers: readonly number[]) => Promise<void>,
  ) => Promise<void>;
};

type InFlightPreparation = {
  expectedRelease: ReleaseSummary;
  promise: Promise<ReleaseDescriptor>;
};

/**
 * Creates a new, empty {@link PreparationCoordinator}.
 * @returns A coordinator with no in-flight preparations.
 */
export function createPreparationCoordinator(): PreparationCoordinator {
  const inFlight = new Map<number, InFlightPreparation>();
  // Chains every runCleanup() call so cleanups never overlap. Always settled
  // (never rejects), so a failed cleanup cannot block later cleanups or
  // preparations waiting behind it.
  let cleanupTail: Promise<void> = Promise.resolve();

  return {
    prepare(channel, channelBasePath, target, validatedDescriptor) {
      const existing = inFlight.get(target.releaseNumber);
      if (existing) {
        if (releaseSummariesMatch(existing.expectedRelease, target)) return existing.promise;
        return Promise.reject(new Error('Conflicting release identity is already being prepared'));
      }

      const reusableDescriptor =
        validatedDescriptor && releaseSummariesMatch(toReleaseSummary(validatedDescriptor), target)
          ? validatedDescriptor
          : undefined;

      const tailToAwait = cleanupTail;
      const runPreparation = async (): Promise<ReleaseDescriptor> => {
        // Every cleanup already scheduled at the moment this preparation was
        // registered read its protected-number snapshot before this attempt
        // existed, so it may legitimately delete a stale cache under this
        // exact release number — this attempt must not touch that cache
        // until all of them have fully settled, win or lose.
        await tailToAwait;
        let descriptor = reusableDescriptor;
        if (!descriptor) {
          const fetched = await fetchReleaseDescriptor(channelBasePath, target);
          // `fetchReleaseDescriptor` only proves `releaseNumber` matches
          // (the bootstrap-only guarantee available from a bare
          // `latest.json` pointer). Every other caller — restoration in
          // particular — already knows the complete expected release
          // identity, so a same-number descriptor that diverges on
          // `appVersion`/`buildId`/`buildDate` must never be accepted or
          // cached as `target`; see `releaseSummariesMatch`.
          if (!releaseSummariesMatch(toReleaseSummary(fetched), target)) {
            throw releasePreparationError(
              ReleasePreparationFailureReason.INVALID_ARCHIVE_METADATA,
              'Fetched release descriptor does not match the expected release identity',
            );
          }
          descriptor = fetched;
        }
        await prepareRelease(channelBasePath, channel, descriptor);
        return descriptor;
      };

      // The map entry must be released inside this same owned promise,
      // before `ownedAttempt`'s resolution or rejection becomes observable
      // to its caller — never through a detached `.catch().finally()` chain,
      // which would leave a window after this attempt settles but before
      // cleanup runs, in which an immediate retry could still observe the
      // stale entry and join this already-settled promise instead of
      // starting fresh. The `.promise === ownedAttempt` identity check
      // guards against a newer attempt (registered for the same release
      // number after this one already finished) ever being deleted by this
      // older attempt's own cleanup.
      const ownedAttempt: Promise<ReleaseDescriptor> = Promise.resolve().then(async () => {
        try {
          return await runPreparation();
        } catch (error) {
          // The single boundary every caller's own preparation failure funnels
          // through: reported exactly once here, never again by callers.
          reportReleasePreparationFailure(error);
          throw error;
        } finally {
          if (inFlight.get(target.releaseNumber)?.promise === ownedAttempt) {
            inFlight.delete(target.releaseNumber);
          }
        }
      });
      inFlight.set(target.releaseNumber, { expectedRelease: target, promise: ownedAttempt });
      return ownedAttempt;
    },

    runCleanup(cleanup) {
      const run = cleanupTail.then(() => cleanup([...inFlight.keys()]));
      cleanupTail = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    },
  };
}
