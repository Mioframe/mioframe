import type { AppUpdateSnapshot } from './protocol';

/** Dependencies for one worker-local update reconciler. */
export type UpdateReconcilerDependencies = {
  /** Runs one complete reconciliation pass from fresh persisted state. */
  runPass(): Promise<AppUpdateSnapshot>;
};

/** Explicit reconciliation entry points used by worker events. */
export type UpdateReconciler = {
  /** Joins or starts reconciliation for an owned document navigation. */
  reconcileNavigation(): Promise<void>;
  /** Joins or starts reconciliation and returns its final settled snapshot. */
  checkForUpdates(): Promise<AppUpdateSnapshot>;
  /** Joins reconciliation and requests one fresh-state rerun when already active. */
  reconcileAfterModeChange(): Promise<void>;
};

/**
 * Creates the single update reconciler for one service-worker lifetime.
 * Navigation and explicit checks only join shared work. A durable mode change
 * additionally collapses into one pending fresh-state rerun.
 * @param dependencies - The fresh-state pass owned by update discovery.
 * @returns Three trigger-specific reconciliation entry points.
 */
export function createUpdateReconciler(
  dependencies: UpdateReconcilerDependencies,
): UpdateReconciler {
  let inFlightPromise: Promise<AppUpdateSnapshot> | undefined;
  let rerunRequested = false;
  const isRerunRequested = (): boolean => rerunRequested;

  const reconcile = (): Promise<AppUpdateSnapshot> => {
    if (inFlightPromise) return inFlightPromise;

    const runUntilSettled = async (): Promise<AppUpdateSnapshot> => {
      rerunRequested = false;
      let result:
        | { status: 'resolved'; snapshot: AppUpdateSnapshot }
        | { status: 'rejected'; error: unknown };
      try {
        result = { status: 'resolved', snapshot: await dependencies.runPass() };
      } catch (error) {
        result = { status: 'rejected', error };
      }
      if (isRerunRequested()) return runUntilSettled();
      if (result.status === 'rejected') throw result.error;
      return result.snapshot;
    };
    const attempt = Promise.resolve().then(runUntilSettled);
    inFlightPromise = attempt;
    void attempt
      .finally(() => {
        if (inFlightPromise === attempt) inFlightPromise = undefined;
      })
      .catch(() => {});
    return attempt;
  };

  return {
    async reconcileNavigation() {
      await reconcile();
    },
    checkForUpdates: reconcile,
    async reconcileAfterModeChange() {
      if (inFlightPromise) rerunRequested = true;
      await reconcile();
    },
  };
}
