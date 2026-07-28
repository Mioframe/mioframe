/**
 * Schedules at most one background action per worker lifetime.
 *
 * Used to trigger the Automatic-mode update check on the first same-channel
 * application navigation this worker instance handles (see
 * `updateDiscovery.ts`'s `runAutomaticCheckIfEnabled`), without a periodic
 * timer, background-sync registration, or any persisted "check is due"
 * state: the browser's own worker lifecycle already gives this "once per
 * revival" scope for free.
 */
export type AutomaticCheckScheduler = {
  /**
   * Runs `run` the first time this is called; every later call is a no-op.
   * Never awaited by the caller — `run`'s own promise settles independently.
   * @param run - The action to run at most once.
   */
  scheduleOnce(run: () => Promise<void>): void;
};

/**
 * Creates a new {@link AutomaticCheckScheduler} that has not yet run.
 * @returns A scheduler scoped to one worker lifetime.
 */
export function createAutomaticCheckScheduler(): AutomaticCheckScheduler {
  let started = false;

  return {
    scheduleOnce(run) {
      if (started) return;
      started = true;
      void run().catch(() => {});
    },
  };
}
