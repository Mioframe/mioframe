import type { AppUpdateSnapshot } from './protocol';

/**
 * Declarative follow-up work one reconciliation pass requires. Never an
 * executable callback: a pass only reports what is required, never how or
 * when it runs. Only the reconciler's own attempt-level effect runner
 * translates these flags into the actual broadcast/cleanup calls, and only
 * after the owning response has been posted.
 */
export type ReconciliationEffects = {
  /** A same-channel `APP_UPDATE_STATE_CHANGED` invalidation broadcast is required. */
  broadcastStateChanged: boolean;
  /** This channel's release-cache cleanup is required. */
  cleanupReleaseCache: boolean;
};

const NO_EFFECTS: ReconciliationEffects = {
  broadcastStateChanged: false,
  cleanupReleaseCache: false,
};

/**
 * Combines two {@link ReconciliationEffects} with a logical OR per flag, so a
 * superseded pass's requirements are never lost when a rerun's own
 * requirements differ.
 * @param a - The first effects set.
 * @param b - The second effects set.
 * @returns The combined effects.
 */
export function mergeReconciliationEffects(
  a: ReconciliationEffects,
  b: ReconciliationEffects,
): ReconciliationEffects {
  return {
    broadcastStateChanged: a.broadcastStateChanged || b.broadcastStateChanged,
    cleanupReleaseCache: a.cleanupReleaseCache || b.cleanupReleaseCache,
  };
}

/** The durable result of one reconciliation pass, plus the effects it requires. */
export type ReconciliationPassResult = {
  /** The foreground-relevant snapshot, already safe to return as a command response. */
  snapshot: AppUpdateSnapshot;
  /** Follow-up work this pass alone requires. Merged, never executed, by the reconciler. */
  effects: ReconciliationEffects;
};

/**
 * One reconciliation attempt's final outcome: its durable snapshot or error,
 * plus the effects merged across every pass this exact attempt ran
 * (including a superseded pass whose own rerun later failed) — an internal
 * shape, never itself exposed outside this module. Preserving `effects` on
 * the `'failure'` branch is what lets a successful pass's own broadcast/
 * cleanup still run even when a later required rerun fails.
 */
export type ReconciliationSettlement =
  | { status: 'success'; snapshot: AppUpdateSnapshot; effects: ReconciliationEffects }
  | { status: 'failure'; error: unknown; effects: ReconciliationEffects };

/** Dependencies for one worker-local update reconciler. */
export type UpdateReconcilerDependencies = {
  /** Runs one complete reconciliation pass from fresh persisted state. */
  runPass(): Promise<ReconciliationPassResult>;
  /** Executes the given effects. Never invoked until the reconciler's own attempt-level runner explicitly starts it. */
  runEffects(effects: ReconciliationEffects): Promise<void>;
};

/**
 * The durable result `checkForUpdates()` returns: the safe-to-return
 * snapshot, plus deferred effect-running work only when this call itself
 * created the shared attempt (see {@link UpdateReconciler.checkForUpdates}).
 */
export type ReconciliationResult = {
  /** The durable, already-safe-to-return snapshot. */
  snapshot: AppUpdateSnapshot;
  /** Deferred effect-running work, invoked only after the owning response has been posted. */
  runLifetimeWork?: (() => Promise<void>) | undefined;
};

/**
 * Thrown by `checkForUpdates()` when this call created the shared attempt and
 * the attempt's final pass failed. Carries the original pass error as
 * `cause`, plus this attempt's own merged effects (from any earlier
 * successful pass this same attempt ran) as `runLifetimeWork`, so a catching
 * `src/sw.ts` can still run them exactly once, strictly after it has posted
 * its own fallback response — never before, and never lost to a later,
 * independent reconciliation attempt.
 */
export class ReconciliationFailure extends Error {
  /** Idempotently starts and awaits this failed attempt's own merged effects. */
  public readonly runLifetimeWork: () => Promise<void>;

  /**
   * @param cause - The original error the attempt's final pass rejected with.
   * @param runLifetimeWork - Idempotently starts and awaits this attempt's own merged effects.
   */
  constructor(cause: unknown, runLifetimeWork: () => Promise<void>) {
    super('Update reconciliation failed', { cause });
    this.name = 'ReconciliationFailure';
    this.runLifetimeWork = runLifetimeWork;
  }
}

/** Explicit reconciliation entry points used by worker events. */
export type UpdateReconciler = {
  /**
   * Joins or starts reconciliation for an owned document navigation, and
   * releases its own attempt's effects exactly once this call itself created
   * the shared attempt. Always resolves (or rejects with the pass's own
   * error) only once any owned effect-running work this call is responsible
   * for has finished, so the caller's own event lifetime (`fetch` event
   * `waitUntil`) can safely depend on it.
   */
  reconcileNavigation(): Promise<void>;
  /**
   * Joins or starts reconciliation and returns its final settled result.
   * Never invokes effects itself — the caller (a foreground
   * `CHECK_FOR_UPDATES` command) owns invoking `runLifetimeWork` only after
   * posting its own response, and only when this call is the one that
   * created the shared attempt. On a failed final pass, throws a
   * {@link ReconciliationFailure} carrying this attempt's own effects when
   * this call created the attempt, or the raw pass error when it only joined.
   */
  checkForUpdates(): Promise<ReconciliationResult>;
  /**
   * Joins reconciliation and requests one fresh-state rerun when already
   * active, exactly like before. Releases its own attempt's effects exactly
   * once this call itself created the shared attempt, and always resolves
   * only once any owned effect-running work has finished.
   */
  reconcileAfterModeChange(): Promise<void>;
};

/** Which trigger created a given shared attempt. */
type ReconciliationOwner = 'check' | 'background';

/** One reconciliation attempt shared by every joining caller. */
type SharedAttempt = {
  /** Which trigger created this attempt. */
  owner: ReconciliationOwner;
  /** Resolves to this attempt's final (rerun-combined) settlement. Never itself rejects. */
  settlementPromise: Promise<ReconciliationSettlement>;
  /**
   * Idempotently starts (on first call) and always returns this attempt's
   * effect-running completion. Must only ever be invoked by this attempt's
   * own owner — a joiner must never call this itself, only await
   * {@link effectsCompletion}, so effects can never start before the owner's
   * own response boundary.
   */
  runEffectsOnce: () => Promise<void>;
  /** Resolves once this attempt's effects have finished, however they were started. */
  effectsCompletion: Promise<void>;
};

/**
 * Creates the single update reconciler for one service-worker lifetime.
 *
 * Exactly one trigger call creates a given shared attempt (the first call
 * while none is in flight); every other concurrent call joins it. Effects
 * belong only to the attempt that produced them: each attempt merges its own
 * passes' {@link ReconciliationEffects} locally (via logical OR across
 * reruns) and starts with both flags `false` — there is no reconciler-level
 * accumulation, so a superseded or failed attempt's effects can never leak
 * into a later, independent attempt.
 *
 * Only the creating call may ever start that attempt's effects — a joining
 * call must never independently trigger them, so a `CHECK_FOR_UPDATES` that
 * creates the attempt keeps full control over never starting its
 * broadcast/cleanup before its own response has been posted, even when a
 * concurrent navigation joins the same attempt. A joining navigation or
 * mode-change call still awaits the same completion signal so its own event
 * lifetime correctly covers the shared work, without ever starting it
 * itself; a joining Check never waits at all, exactly like before.
 * @param dependencies - The fresh-state pass and effect runner owned by update discovery.
 * @returns Three trigger-specific reconciliation entry points.
 */
export function createUpdateReconciler(
  dependencies: UpdateReconcilerDependencies,
): UpdateReconciler {
  let inFlight: SharedAttempt | undefined;
  let rerunRequested = false;
  const isRerunRequested = (): boolean => rerunRequested;

  function startOrJoin(owner: ReconciliationOwner): { attempt: SharedAttempt; created: boolean } {
    if (inFlight) return { attempt: inFlight, created: false };

    let mergedEffects: ReconciliationEffects = NO_EFFECTS;

    // Ownership of `inFlight` must be released synchronously, in the same
    // uninterrupted execution segment as the final "no rerun pending"
    // decision below — never through a separate `.finally()` callback. A
    // `.finally()` attached to `settlementPromise` only runs one or more
    // microtask hops after this decision, leaving a window where a
    // mode-change call can observe `inFlight` still assigned to the
    // already-decided attempt, set `rerunRequested`, and join a settling
    // attempt that has already made its final check and will never look at
    // the flag again, silently losing the required fresh-state rerun.
    const runUntilSettled = async (): Promise<ReconciliationSettlement> => {
      rerunRequested = false;
      let outcome:
        | { status: 'resolved'; result: ReconciliationPassResult }
        | { status: 'rejected'; error: unknown };
      try {
        outcome = { status: 'resolved', result: await dependencies.runPass() };
      } catch (error) {
        outcome = { status: 'rejected', error };
      }
      if (outcome.status === 'resolved') {
        mergedEffects = mergeReconciliationEffects(mergedEffects, outcome.result.effects);
      }
      if (isRerunRequested()) return runUntilSettled();
      if (inFlight === attempt) inFlight = undefined;
      if (outcome.status === 'rejected') {
        return { status: 'failure', error: outcome.error, effects: mergedEffects };
      }
      return { status: 'success', snapshot: outcome.result.snapshot, effects: mergedEffects };
    };

    // Deferred through a resolved-promise microtask so `attempt` is already
    // assigned to `inFlight` (below) by the time `runUntilSettled` itself
    // starts running and later needs to compare against it.
    const settlementPromise = Promise.resolve().then(runUntilSettled);

    let resolveEffectsCompletion!: () => void;
    const effectsCompletion = new Promise<void>((resolve) => {
      resolveEffectsCompletion = resolve;
    });
    let effectsStarted = false;
    const runEffectsOnce = (): Promise<void> => {
      if (!effectsStarted) {
        effectsStarted = true;
        void settlementPromise
          .then((settlement) => dependencies.runEffects(settlement.effects))
          .catch(() => {
            // Best effort: a failed broadcast or cleanup must never surface
            // through this attempt-level runner, nor change any
            // already-returned command result.
          })
          .finally(resolveEffectsCompletion);
      }
      return effectsCompletion;
    };

    const attempt: SharedAttempt = { owner, settlementPromise, runEffectsOnce, effectsCompletion };
    inFlight = attempt;
    return { attempt, created: true };
  }

  return {
    async checkForUpdates() {
      const { attempt, created } = startOrJoin('check');
      const settlement = await attempt.settlementPromise;
      if (settlement.status === 'failure') {
        if (created) throw new ReconciliationFailure(settlement.error, attempt.runEffectsOnce);
        throw settlement.error;
      }
      if (!created) return { snapshot: settlement.snapshot };
      return { snapshot: settlement.snapshot, runLifetimeWork: attempt.runEffectsOnce };
    },
    async reconcileNavigation() {
      const { attempt, created } = startOrJoin('background');
      const settlement = await attempt.settlementPromise;
      if (settlement.status === 'failure') {
        if (created) await attempt.runEffectsOnce();
        throw settlement.error;
      }
      if (created) await attempt.runEffectsOnce();
      else await attempt.effectsCompletion;
    },
    async reconcileAfterModeChange() {
      if (inFlight) rerunRequested = true;
      const { attempt, created } = startOrJoin('background');
      const settlement = await attempt.settlementPromise;
      if (settlement.status === 'failure') {
        if (created) await attempt.runEffectsOnce();
        throw settlement.error;
      }
      if (created) await attempt.runEffectsOnce();
      else await attempt.effectsCompletion;
    },
  };
}
