/**
 * Schedules at most one background action per worker lifetime.
 *
 * Used to trigger discovery on the first same-channel application
 * navigation this worker instance handles (see `updateDiscovery.ts`'s
 * `runScheduledDiscoveryCheck`), without a periodic timer,
 * background-sync registration, or any persisted "check is due" state: the
 * browser's own worker lifecycle already gives this "once per revival"
 * scope for free. Runs regardless of update mode — only whether the
 * discovered release goes on to be prepared and approved differs by mode,
 * a decision `runUpdateCheck` makes internally, not this scheduler.
 *
 * Returns the scheduled attempt's promise so the caller can attach it to the
 * triggering event's `waitUntil` — a service worker may otherwise be
 * terminated once its event handler returns, killing an untracked
 * background check mid-flight.
 */
export type ScheduledDiscoveryCheckScheduler = {
  /**
   * Runs `run` the first time this is called and returns its promise; every
   * later call is a no-op that resolves immediately. Concurrent navigations
   * dispatched to the same worker instance all receive the same in-flight
   * promise rather than starting their own attempt.
   * @param run - The action to run at most once.
   * @returns The scheduled attempt's promise, for `event.waitUntil`.
   */
  scheduleOnce(run: () => Promise<void>): Promise<void>;
};

/**
 * Creates a new {@link ScheduledDiscoveryCheckScheduler} that has not yet run.
 * @returns A scheduler scoped to one worker lifetime.
 */
export function createScheduledDiscoveryCheckScheduler(): ScheduledDiscoveryCheckScheduler {
  let attempt: Promise<void> | undefined;

  return {
    scheduleOnce(run) {
      attempt ??= run().catch(() => {});
      return attempt;
    },
  };
}
