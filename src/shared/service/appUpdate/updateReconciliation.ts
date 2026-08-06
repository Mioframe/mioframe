import type { AppUpdateSnapshot } from './protocol';

/**
 * The durable result of one reconciliation pass: the foreground-relevant
 * snapshot, already safe to return as a command response, plus optional
 * deferred follow-up work (same-channel broadcast, release-cache cleanup).
 *
 * `runLifetimeWork` is cold: constructing or returning it must never start
 * any work. Only explicitly invoking it starts the underlying broadcast or
 * cleanup — this is what lets a caller return `snapshot` as a response before
 * any of that best-effort work begins.
 */
export type ReconciliationResult = {
  /** The durable, already-safe-to-return snapshot. */
  snapshot: AppUpdateSnapshot;
  /** Deferred broadcast/cleanup work, invoked only after the owning response has been posted. */
  runLifetimeWork?: (() => Promise<void>) | undefined;
};

/** Dependencies for one worker-local update reconciler. */
export type UpdateReconcilerDependencies = {
  /** Runs one complete reconciliation pass from fresh persisted state. */
  runPass(): Promise<ReconciliationResult>;
};

/** Explicit reconciliation entry points used by worker events. */
export type UpdateReconciler = {
  /**
   * Joins or starts reconciliation for an owned document navigation, and
   * releases its deferred work exactly once this call itself created the
   * shared attempt. Always resolves only once any owned deferred work this
   * call is responsible for has finished, so the caller's own event lifetime
   * (`fetch` event `waitUntil`) can safely depend on it.
   */
  reconcileNavigation(): Promise<void>;
  /**
   * Joins or starts reconciliation and returns its final settled result.
   * Never invokes `runLifetimeWork` itself — the caller (a foreground
   * `CHECK_FOR_UPDATES` command) owns invoking it only after posting its own
   * response, and only when this call is the one that created the shared
   * attempt (see `ReconciliationResult`).
   */
  checkForUpdates(): Promise<ReconciliationResult>;
  /**
   * Joins reconciliation and requests one fresh-state rerun when already
   * active, exactly like before. Releases deferred work exactly once this
   * call itself created the shared attempt, and always resolves only once any
   * owned deferred work has finished.
   */
  reconcileAfterModeChange(): Promise<void>;
};

/** One reconciliation attempt shared by every joining caller. */
type SharedAttempt = {
  /** Resolves to the final (rerun-combined) durable result. */
  passPromise: Promise<ReconciliationResult>;
  /** Resolved once this attempt's deferred work has been released and has finished, by whichever trigger created it. */
  released: Promise<void>;
  /** Resolves `released` above. Never called directly by a joiner — only by this attempt's own creator. */
  resolveReleased: () => void;
  /** Whether {@link release} has already started for this attempt, so a repeated call is a safe no-op. */
  releaseStarted: boolean;
};

/**
 * Creates the single update reconciler for one service-worker lifetime.
 *
 * Exactly one trigger call creates a given shared attempt (the first call
 * while none is in flight); every other concurrent call joins it. Only the
 * creating call may ever invoke that attempt's deferred `runLifetimeWork` —
 * a joining call must never independently trigger it, so a `CHECK_FOR_UPDATES`
 * that creates the attempt keeps full control over never starting its
 * broadcast/cleanup before its own response has been posted, even when a
 * concurrent navigation joins the same attempt. A joining call still awaits
 * the same `released` signal so its own event lifetime correctly covers the
 * shared work, without ever starting it itself.
 * @param dependencies - The fresh-state pass owned by update discovery.
 * @returns Three trigger-specific reconciliation entry points.
 */
export function createUpdateReconciler(
  dependencies: UpdateReconcilerDependencies,
): UpdateReconciler {
  let inFlight: SharedAttempt | undefined;
  let rerunRequested = false;
  let accumulatedWork: Array<() => Promise<void>> = [];
  const isRerunRequested = (): boolean => rerunRequested;

  function startOrJoin(): { attempt: SharedAttempt; created: boolean } {
    if (inFlight) return { attempt: inFlight, created: false };

    let resolveReleased!: () => void;
    const released = new Promise<void>((resolve) => {
      resolveReleased = resolve;
    });

    // Ownership of `inFlight` must be released synchronously, in the same
    // uninterrupted execution segment as the final "no rerun pending"
    // decision below — never through a separate `.finally()` callback. A
    // `.finally()` attached to `passPromise` only runs one or more microtask
    // hops after this decision, leaving a window where a mode-change call can
    // observe `inFlight` still assigned to the already-decided attempt, set
    // `rerunRequested`, and join a settling attempt that has already made its
    // final check and will never look at the flag again, silently losing the
    // required fresh-state rerun.
    const runUntilSettled = async (): Promise<ReconciliationResult> => {
      rerunRequested = false;
      let outcome:
        | { status: 'resolved'; result: ReconciliationResult }
        | { status: 'rejected'; error: unknown };
      try {
        outcome = { status: 'resolved', result: await dependencies.runPass() };
      } catch (error) {
        outcome = { status: 'rejected', error };
      }
      if (outcome.status === 'resolved' && outcome.result.runLifetimeWork) {
        accumulatedWork.push(outcome.result.runLifetimeWork);
      }
      if (isRerunRequested()) return runUntilSettled();
      if (inFlight === attempt) inFlight = undefined;
      if (outcome.status === 'rejected') throw outcome.error;

      const work = accumulatedWork;
      accumulatedWork = [];
      const combined =
        work.length === 0
          ? undefined
          : () => Promise.all(work.map((run) => run())).then(() => undefined);
      return { snapshot: outcome.result.snapshot, runLifetimeWork: combined };
    };

    // Deferred through a resolved-promise microtask so `attempt` is already
    // assigned to `inFlight` (below) by the time `runUntilSettled` itself
    // starts running and later needs to compare against it.
    const passPromise = Promise.resolve().then(runUntilSettled);
    const attempt: SharedAttempt = {
      passPromise,
      released,
      resolveReleased,
      releaseStarted: false,
    };
    inFlight = attempt;
    return { attempt, created: true };
  }

  /**
   * Invoked only by the creator of `attempt`: triggers and awaits its
   * deferred work. Idempotent — a repeated call (e.g. two joiners of the same
   * creator, or a defensive duplicate invocation) never re-runs the
   * underlying broadcast/cleanup work, it only awaits the same completion.
   * @param attempt - The shared attempt whose deferred work to release.
   * @returns Resolves once the deferred work has finished (or failed, best effort).
   */
  function release(attempt: SharedAttempt): Promise<void> {
    if (!attempt.releaseStarted) {
      attempt.releaseStarted = true;
      void (async () => {
        try {
          const result = await attempt.passPromise;
          await result.runLifetimeWork?.();
        } catch {
          // Best effort: a rejected pass or failed deferred work never
          // surfaces through this release path.
        } finally {
          attempt.resolveReleased();
        }
      })();
    }
    return attempt.released;
  }

  return {
    async checkForUpdates() {
      const { attempt, created } = startOrJoin();
      const result = await attempt.passPromise;
      if (!created) return { snapshot: result.snapshot };
      return { snapshot: result.snapshot, runLifetimeWork: () => release(attempt) };
    },
    async reconcileNavigation() {
      const { attempt, created } = startOrJoin();
      await attempt.passPromise;
      if (created) await release(attempt);
      else await attempt.released;
    },
    async reconcileAfterModeChange() {
      if (inFlight) rerunRequested = true;
      const { attempt, created } = startOrJoin();
      await attempt.passPromise;
      if (created) await release(attempt);
      else await attempt.released;
    },
  };
}
