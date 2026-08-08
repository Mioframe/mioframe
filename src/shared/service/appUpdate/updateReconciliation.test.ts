import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainError } from '@shared/lib/error';
import type { AppUpdateSnapshot } from './protocol';
import {
  createUpdateReconciler,
  ReconciliationFailure,
  type ReconciliationEffects,
  type ReconciliationPassResult,
} from './updateReconciliation';

const captureDiagnosticExceptionMock = vi.fn();
vi.mock('@shared/lib/diagnostics', () => ({
  captureDiagnosticException: (...args: unknown[]) => captureDiagnosticExceptionMock(...args),
}));

const NO_EFFECTS: ReconciliationEffects = {
  broadcastStateChanged: false,
  cleanupReleaseCache: false,
};

const snapshot = (releaseNumber: number): AppUpdateSnapshot => ({
  mode: 'automatic',
  activeRelease: {
    releaseNumber,
    appVersion: '1.0.0',
    buildId: `build-${releaseNumber}`,
    buildDate: '2026-08-02T00:00:00.000Z',
  },
});

const passResult = (
  releaseNumber: number,
  effects: ReconciliationEffects = NO_EFFECTS,
): ReconciliationPassResult => ({ snapshot: snapshot(releaseNumber), effects });

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

const startPass = async () => {
  await Promise.resolve();
};

/**
 * Awaits `times` sequential microtask ticks, so a chain of `.then()`
 * continuations spanning multiple hops (e.g. the reconciler's own
 * `Promise.resolve().then(runUntilSettled)` plus its internal effect-runner
 * chain) has fully settled before the next assertion.
 * @param times - Number of microtask ticks to await.
 */
async function flushMicrotasks(times = 6): Promise<void> {
  let tick = Promise.resolve();
  for (let i = 0; i < times; i += 1) {
    tick = tick.then(() => undefined);
  }
  await tick;
}

describe('createUpdateReconciler', () => {
  beforeEach(() => {
    captureDiagnosticExceptionMock.mockReset();
  });

  it('starts one pass for idle navigation', async () => {
    const runPass = vi.fn().mockResolvedValue(passResult(1));
    const runEffects = vi.fn().mockResolvedValue(undefined);
    const reconciler = createUpdateReconciler({ runPass, runEffects });
    await reconciler.reconcileNavigation();
    expect(runPass).toHaveBeenCalledTimes(1);
  });

  it('joins concurrent navigation without requesting a rerun', async () => {
    const pass = deferred<ReconciliationPassResult>();
    const runPass = vi.fn(() => pass.promise);
    const runEffects = vi.fn().mockResolvedValue(undefined);
    const reconciler = createUpdateReconciler({ runPass, runEffects });
    const first = reconciler.reconcileNavigation();
    const second = reconciler.reconcileNavigation();
    await startPass();
    expect(runPass).toHaveBeenCalledTimes(1);
    pass.resolve(passResult(1));
    await Promise.all([first, second]);
    expect(runPass).toHaveBeenCalledTimes(1);
  });

  it('joins an explicit Check and returns the final durable snapshot without a rerun', async () => {
    const pass = deferred<ReconciliationPassResult>();
    const runPass = vi.fn(() => pass.promise);
    const runEffects = vi.fn().mockResolvedValue(undefined);
    const reconciler = createUpdateReconciler({ runPass, runEffects });
    const navigation = reconciler.reconcileNavigation();
    const check = reconciler.checkForUpdates();
    await startPass();
    pass.resolve(passResult(2));
    await navigation;
    await expect(check).resolves.toEqual({ snapshot: snapshot(2) });
    expect(runPass).toHaveBeenCalledTimes(1);
  });

  it('a mode-change rerun retains and combines effects from both the superseded and the rerun pass', async () => {
    const first = deferred<ReconciliationPassResult>();
    const second = deferred<ReconciliationPassResult>();
    const runEffects = vi.fn().mockResolvedValue(undefined);
    const runPass = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const reconciler = createUpdateReconciler({ runPass, runEffects });
    const check = reconciler.checkForUpdates();
    await startPass();
    const modeChange = reconciler.reconcileAfterModeChange();
    first.resolve(passResult(1, { broadcastStateChanged: true, cleanupReleaseCache: false }));
    await startPass();
    second.resolve(passResult(2, { broadcastStateChanged: false, cleanupReleaseCache: true }));

    const settled = await check;
    expect(settled.snapshot).toEqual(snapshot(2));
    expect(runEffects).not.toHaveBeenCalled();

    await settled.runLifetimeWork?.();
    expect(runEffects).toHaveBeenCalledTimes(1);
    expect(runEffects).toHaveBeenCalledWith({
      broadcastStateChanged: true,
      cleanupReleaseCache: true,
    });
    await modeChange;
  });

  it('requests exactly one rerun for a mode change during a pass', async () => {
    const first = deferred<ReconciliationPassResult>();
    const second = deferred<ReconciliationPassResult>();
    const runEffects = vi.fn().mockResolvedValue(undefined);
    const runPass = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const reconciler = createUpdateReconciler({ runPass, runEffects });
    const check = reconciler.checkForUpdates();
    await startPass();
    const modeChange = reconciler.reconcileAfterModeChange();
    first.resolve(passResult(1));
    await startPass();
    expect(runPass).toHaveBeenCalledTimes(2);
    second.resolve(passResult(2));
    // `modeChange` joined the Check-created attempt, so only releasing the
    // Check's own returned callback (as `workerMessages` would, after
    // posting its response) lets the joined mode-change resolve.
    const settled = await check;
    expect(settled.snapshot).toEqual(snapshot(2));
    await settled.runLifetimeWork?.();
    await modeChange;
  });

  it('collapses multiple mode changes during one pass into one rerun', async () => {
    const first = deferred<ReconciliationPassResult>();
    const second = deferred<ReconciliationPassResult>();
    const runEffects = vi.fn().mockResolvedValue(undefined);
    const runPass = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const reconciler = createUpdateReconciler({ runPass, runEffects });
    const check = reconciler.checkForUpdates();
    await startPass();
    const changes = [reconciler.reconcileAfterModeChange(), reconciler.reconcileAfterModeChange()];
    first.resolve(passResult(1));
    await startPass();
    second.resolve(passResult(2));
    const settled = await check;
    await settled.runLifetimeWork?.();
    await Promise.all(changes);
    expect(runPass).toHaveBeenCalledTimes(2);
  });

  it('allows a mode change during a rerun to request one additional rerun', async () => {
    const first = deferred<ReconciliationPassResult>();
    const second = deferred<ReconciliationPassResult>();
    const third = deferred<ReconciliationPassResult>();
    const passes = [first, second, third];
    const runPass = vi.fn().mockImplementation(() => {
      const pass = passes[runPass.mock.calls.length - 1];
      if (!pass) throw new Error('Unexpected reconciliation pass');
      return pass.promise;
    });
    const runEffects = vi.fn().mockResolvedValue(undefined);
    const reconciler = createUpdateReconciler({ runPass, runEffects });
    const check = reconciler.checkForUpdates();
    await startPass();
    void reconciler.reconcileAfterModeChange();
    first.resolve(passResult(1));
    await startPass();
    void reconciler.reconcileAfterModeChange();
    second.resolve(passResult(2));
    await startPass();
    third.resolve(passResult(3));
    const settled = await check;
    expect(settled.snapshot).toEqual(snapshot(3));
    expect(runPass).toHaveBeenCalledTimes(3);
  });

  it('keeps the shared promise pending until required reruns finish', async () => {
    const first = deferred<ReconciliationPassResult>();
    const second = deferred<ReconciliationPassResult>();
    const runPass = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const runEffects = vi.fn().mockResolvedValue(undefined);
    const reconciler = createUpdateReconciler({ runPass, runEffects });
    const settled = vi.fn();
    const check = reconciler.checkForUpdates().then(settled);
    await startPass();
    void reconciler.reconcileAfterModeChange();
    first.resolve(passResult(1));
    await startPass();
    expect(settled).not.toHaveBeenCalled();
    second.resolve(passResult(2));
    await check;
    expect(settled).toHaveBeenCalledWith(expect.objectContaining({ snapshot: snapshot(2) }));
  });

  it('discards a failed pass when a mode change requested a successful rerun', async () => {
    const first = deferred<ReconciliationPassResult>();
    const second = deferred<ReconciliationPassResult>();
    const runEffects = vi.fn().mockResolvedValue(undefined);
    const runPass = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const reconciler = createUpdateReconciler({ runPass, runEffects });
    const check = reconciler.checkForUpdates();
    await startPass();
    const modeChange = reconciler.reconcileAfterModeChange();
    first.reject(new Error('superseded failed pass'));
    await startPass();
    expect(runPass).toHaveBeenCalledTimes(2);
    second.resolve(passResult(2));
    const settled = await check;
    expect(settled.snapshot).toEqual(snapshot(2));
    await settled.runLifetimeWork?.();
    await modeChange;
  });

  it('rejects with a ReconciliationFailure carrying the original error when a requested rerun is the final failed pass', async () => {
    const first = deferred<ReconciliationPassResult>();
    const finalFailure = new Error('failed rerun');
    const runPass = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockRejectedValueOnce(finalFailure);
    const runEffects = vi.fn().mockResolvedValue(undefined);
    const reconciler = createUpdateReconciler({ runPass, runEffects });
    const check = reconciler.checkForUpdates();
    await startPass();
    // A joiner (never the creator) rejects with the raw pass error, unwrapped.
    const modeChange = expect(reconciler.reconcileAfterModeChange()).rejects.toBe(finalFailure);
    first.reject(new Error('superseded failed pass'));
    // The creator rejects with a ReconciliationFailure carrying the original
    // error as `cause`, so a catching `src/sw.ts` can still run this
    // attempt's own (here empty) effects after posting its fallback response.
    await expect(check).rejects.toBeInstanceOf(ReconciliationFailure);
    await expect(check).rejects.toMatchObject({ cause: finalFailure });
    await modeChange;
    expect(runPass).toHaveBeenCalledTimes(2);
  });

  it('clears the in-flight reference after success so a later trigger starts fresh', async () => {
    const runPass = vi
      .fn()
      .mockResolvedValueOnce(passResult(1))
      .mockResolvedValueOnce(passResult(2));
    const runEffects = vi.fn().mockResolvedValue(undefined);
    const reconciler = createUpdateReconciler({ runPass, runEffects });
    await reconciler.checkForUpdates();
    await reconciler.checkForUpdates();
    expect(runPass).toHaveBeenCalledTimes(2);
  });

  it('clears the in-flight reference after failure so a later trigger starts fresh', async () => {
    const failure = new Error('failed pass');
    const runPass = vi.fn().mockRejectedValueOnce(failure).mockResolvedValueOnce(passResult(2));
    const runEffects = vi.fn().mockResolvedValue(undefined);
    const reconciler = createUpdateReconciler({ runPass, runEffects });
    await expect(reconciler.checkForUpdates()).rejects.toMatchObject({ cause: failure });
    const settled = await reconciler.checkForUpdates();
    expect(settled.snapshot).toEqual(snapshot(2));
    expect(runPass).toHaveBeenCalledTimes(2);
  });

  it('never loses a mode-change rerun requested exactly at the old settlement-cleanup boundary', async () => {
    // Reproduces the settlement microtask race: `first.resolve()` schedules
    // the pass continuation's reaction first; the `Promise.resolve().then()`
    // scheduled immediately afterward (same synchronous tick, no `await`
    // between them) is queued directly behind it — landing exactly where a
    // buggy `.finally()`-based cleanup would run several microtask hops
    // later. Against a buggy implementation this mode-change would still
    // observe `inFlight` assigned to the already-decided attempt, set
    // `rerunRequested`, and join that same settling promise — the flag would
    // never be re-checked, so the required fresh-state rerun would be
    // silently dropped and `runPass` called only once. Releasing ownership of
    // `inFlight` synchronously with the final decision closes that window, so
    // this same-tick mode-change instead starts its own fresh reconciliation
    // and a second `runPass()` genuinely executes.
    const first = deferred<ReconciliationPassResult>();
    const second = deferred<ReconciliationPassResult>();
    const runPass = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const runEffects = vi.fn().mockResolvedValue(undefined);
    const reconciler = createUpdateReconciler({ runPass, runEffects });
    const check = reconciler.checkForUpdates();
    await startPass();

    let modeChange!: Promise<void>;
    first.resolve(passResult(1));
    const scheduled = Promise.resolve().then(() => {
      modeChange = reconciler.reconcileAfterModeChange();
    });
    await scheduled;
    await startPass();
    await startPass();

    expect(runPass).toHaveBeenCalledTimes(2);
    second.resolve(passResult(2));
    await modeChange;
    const settled = await check;
    expect(settled.snapshot).toEqual(snapshot(1));
  });

  describe('attempt-local effects: ownership, retention, and isolation', () => {
    it('hands the effect runner back to a Check that creates the attempt, uninvoked', async () => {
      const runEffects = vi.fn().mockResolvedValue(undefined);
      const effects = { broadcastStateChanged: true, cleanupReleaseCache: false };
      const runPass = vi.fn().mockResolvedValue(passResult(1, effects));
      const reconciler = createUpdateReconciler({ runPass, runEffects });

      const settled = await reconciler.checkForUpdates();

      expect(settled.runLifetimeWork).toBeTypeOf('function');
      expect(runEffects).not.toHaveBeenCalled();
      await settled.runLifetimeWork?.();
      expect(runEffects).toHaveBeenCalledTimes(1);
      expect(runEffects).toHaveBeenCalledWith(effects);
    });

    it('never exposes an effect runner to a Check that only joins an existing attempt', async () => {
      const runEffects = vi.fn().mockResolvedValue(undefined);
      const effects = { broadcastStateChanged: true, cleanupReleaseCache: false };
      const pass = deferred<ReconciliationPassResult>();
      const runPass = vi.fn(() => pass.promise);
      const reconciler = createUpdateReconciler({ runPass, runEffects });

      const creatorCheck = reconciler.checkForUpdates();
      const joinerCheck = reconciler.checkForUpdates();
      await startPass();
      pass.resolve(passResult(1, effects));

      const [creatorResult, joinerResult] = await Promise.all([creatorCheck, joinerCheck]);
      expect(creatorResult.runLifetimeWork).toBeTypeOf('function');
      expect(joinerResult.runLifetimeWork).toBeUndefined();
      expect(runEffects).not.toHaveBeenCalled();
    });

    it('shares one durable pass and executes effects exactly once for multiple Check joiners', async () => {
      const runEffects = vi.fn().mockResolvedValue(undefined);
      const effects = { broadcastStateChanged: true, cleanupReleaseCache: true };
      const pass = deferred<ReconciliationPassResult>();
      const runPass = vi.fn(() => pass.promise);
      const reconciler = createUpdateReconciler({ runPass, runEffects });

      const first = reconciler.checkForUpdates();
      const second = reconciler.checkForUpdates();
      const third = reconciler.checkForUpdates();
      await startPass();
      pass.resolve(passResult(1, effects));

      const [firstResult] = await Promise.all([first, second, third]);
      expect(runPass).toHaveBeenCalledTimes(1);
      await firstResult.runLifetimeWork?.();
      // A later, no-op invocation (e.g. a genuinely duplicate release call)
      // must never re-run the underlying broadcast/cleanup work.
      await firstResult.runLifetimeWork?.();
      expect(runEffects).toHaveBeenCalledTimes(1);
    });

    it('releases automatically for a navigation that creates the attempt, only after its own effects finish', async () => {
      const effects = { broadcastStateChanged: true, cleanupReleaseCache: false };
      const effectsGate = deferred<undefined>();
      const runEffects = vi.fn(() => effectsGate.promise);
      const pass = deferred<ReconciliationPassResult>();
      const runPass = vi.fn(() => pass.promise);
      const reconciler = createUpdateReconciler({ runPass, runEffects });

      const settled = vi.fn();
      const navigation = reconciler.reconcileNavigation().then(settled);
      await startPass();
      pass.resolve(passResult(1, effects));
      await flushMicrotasks();

      expect(runEffects).toHaveBeenCalledTimes(1);
      expect(runEffects).toHaveBeenCalledWith(effects);
      expect(settled).not.toHaveBeenCalled();

      effectsGate.resolve(undefined);
      await navigation;
      expect(settled).toHaveBeenCalledTimes(1);
    });

    it('a navigation joining a Check-created attempt never executes the effects itself, and cannot observe them starting before the Check response', async () => {
      const effects = { broadcastStateChanged: true, cleanupReleaseCache: false };
      const releaseOrder: string[] = [];
      const effectsGate = deferred<undefined>();
      const runEffects = vi.fn(() => {
        releaseOrder.push('effects-started');
        return effectsGate.promise;
      });
      const pass = deferred<ReconciliationPassResult>();
      const runPass = vi.fn(() => pass.promise);
      const reconciler = createUpdateReconciler({ runPass, runEffects });

      const check = reconciler.checkForUpdates();
      const navigationSettled = vi.fn();
      const navigation = reconciler.reconcileNavigation().then(navigationSettled);
      await startPass();
      pass.resolve(passResult(1, effects));
      await flushMicrotasks();

      // The pass has settled and Navigation has joined, but only the Check
      // creator owns invoking this attempt's effects — they must not have
      // started yet, and Navigation's own promise must still be pending.
      expect(runEffects).not.toHaveBeenCalled();
      expect(navigationSettled).not.toHaveBeenCalled();

      const checkResult = await check;
      expect(checkResult.runLifetimeWork).toBeTypeOf('function');
      // Simulates workerMessages posting the Check response, then invoking
      // the effect runner only afterwards.
      releaseOrder.push('check-response-posted');
      const released = checkResult.runLifetimeWork?.();
      await startPass();
      expect(releaseOrder).toEqual(['check-response-posted', 'effects-started']);
      expect(navigationSettled).not.toHaveBeenCalled();

      effectsGate.resolve(undefined);
      await released;
      await navigation;
      expect(navigationSettled).toHaveBeenCalledTimes(1);
      expect(runEffects).toHaveBeenCalledTimes(1);
    });

    it('a Check joining a background-created attempt never executes the effects, and background keeps owning them', async () => {
      const effects = { broadcastStateChanged: false, cleanupReleaseCache: true };
      const effectsGate = deferred<undefined>();
      const runEffects = vi.fn(() => effectsGate.promise);
      const pass = deferred<ReconciliationPassResult>();
      const runPass = vi.fn(() => pass.promise);
      const reconciler = createUpdateReconciler({ runPass, runEffects });

      const navigationSettled = vi.fn();
      const navigation = reconciler.reconcileNavigation().then(navigationSettled);
      const check = reconciler.checkForUpdates();
      await startPass();
      pass.resolve(passResult(4, effects));
      await flushMicrotasks();

      // Navigation created the attempt and owns invoking its effects; the
      // joined Check must never invoke them itself.
      expect(runEffects).toHaveBeenCalledTimes(1);
      expect(navigationSettled).not.toHaveBeenCalled();
      await expect(check).resolves.toEqual({ snapshot: snapshot(4) });

      effectsGate.resolve(undefined);
      await navigation;
      expect(navigationSettled).toHaveBeenCalledTimes(1);
      expect(runEffects).toHaveBeenCalledTimes(1);
    });

    it('a failed broadcast or cleanup never rejects the effect runner and never changes the already-returned result', async () => {
      const effects = { broadcastStateChanged: true, cleanupReleaseCache: true };
      const runEffects = vi.fn().mockRejectedValue(new Error('broadcast failed'));
      const runPass = vi.fn().mockResolvedValue(passResult(1, effects));
      const reconciler = createUpdateReconciler({ runPass, runEffects });

      const settled = await reconciler.checkForUpdates();
      expect(settled.snapshot).toEqual(snapshot(1));
      await expect(settled.runLifetimeWork?.()).resolves.toBeUndefined();
      expect(runEffects).toHaveBeenCalledTimes(1);
    });

    it('retains a successful pass effects across a later failed rerun, and a Check-created attempt runs them exactly once after its own fallback response', async () => {
      // pass 1 persists state and requests a broadcast; a mode change then
      // requests a rerun; pass 2 fails. The Check that created the attempt
      // must still receive access to pass 1's effects through the thrown
      // ReconciliationFailure, so a caller can run them once after already
      // returning its existing stable unavailable response.
      const first = deferred<ReconciliationPassResult>();
      const second = deferred<ReconciliationPassResult>();
      const finalFailure = new Error('pass 2 failed');
      const runPass = vi
        .fn()
        .mockImplementationOnce(() => first.promise)
        .mockImplementationOnce(() => second.promise);
      const runEffects = vi.fn().mockResolvedValue(undefined);
      const reconciler = createUpdateReconciler({ runPass, runEffects });

      const check = reconciler.checkForUpdates();
      await startPass();
      // A joiner rejects with the raw pass error, unwrapped; only the
      // creator (`check`) receives the effect-carrying `ReconciliationFailure`.
      const modeChange = expect(reconciler.reconcileAfterModeChange()).rejects.toBe(finalFailure);
      first.resolve(passResult(1, { broadcastStateChanged: true, cleanupReleaseCache: false }));
      await startPass();
      second.reject(finalFailure);
      await modeChange;

      let caught: unknown;
      try {
        await check;
      } catch (error) {
        caught = error;
      }
      if (!(caught instanceof ReconciliationFailure))
        throw new Error('Expected a ReconciliationFailure');
      const failure = caught;
      expect(failure.cause).toBe(finalFailure);
      expect(runEffects).not.toHaveBeenCalled();
      if (!failure.runLifetimeWork) throw new Error('Expected the creator to own runLifetimeWork');

      await failure.runLifetimeWork();
      expect(runEffects).toHaveBeenCalledTimes(1);
      expect(runEffects).toHaveBeenCalledWith({
        broadcastStateChanged: true,
        cleanupReleaseCache: false,
      });
    });

    it('never leaks a failed attempt effects into the next independent attempt', async () => {
      // The first attempt's pass 1 succeeds with real effects, a mode change
      // requests a rerun, and pass 2 fails — exactly the leaking scenario the
      // fix targets. The caller here never invokes the returned
      // `runLifetimeWork` at all (e.g. it crashed before doing so): the
      // effects must still never surface through a brand-new, independent
      // attempt — proving effects are attempt-local, not reconciler-level.
      const first = deferred<ReconciliationPassResult>();
      const second = deferred<ReconciliationPassResult>();
      const runEffects = vi.fn().mockResolvedValue(undefined);
      const runPass = vi
        .fn()
        .mockImplementationOnce(() => first.promise)
        .mockImplementationOnce(() => second.promise)
        .mockResolvedValueOnce(passResult(3, NO_EFFECTS));
      const reconciler = createUpdateReconciler({ runPass, runEffects });

      const failedCheck = reconciler.checkForUpdates();
      await startPass();
      const rerunFailure = new Error('rerun failed');
      const modeChange = expect(reconciler.reconcileAfterModeChange()).rejects.toBe(rerunFailure);
      first.resolve(passResult(1, { broadcastStateChanged: true, cleanupReleaseCache: true }));
      await startPass();
      second.reject(rerunFailure);
      await modeChange;
      await expect(failedCheck).rejects.toBeInstanceOf(ReconciliationFailure);
      expect(runEffects).not.toHaveBeenCalled();

      const nextCheck = await reconciler.checkForUpdates();
      expect(nextCheck.snapshot).toEqual(snapshot(3));
      await nextCheck.runLifetimeWork?.();
      expect(runEffects).toHaveBeenCalledTimes(1);
      expect(runEffects).toHaveBeenLastCalledWith(NO_EFFECTS);
    });
  });

  describe('unexpected reconciliation failure reporting', () => {
    it('reports an unexpected background-created (navigation) attempt failure once', async () => {
      const unexpected = new Error('reconciliation pass bug');
      const runPass = vi.fn().mockRejectedValue(unexpected);
      const runEffects = vi.fn().mockResolvedValue(undefined);
      const reconciler = createUpdateReconciler({ runPass, runEffects });

      await expect(reconciler.reconcileNavigation()).rejects.toBe(unexpected);

      expect(captureDiagnosticExceptionMock).toHaveBeenCalledExactlyOnceWith(unexpected, {
        operation: 'updateReconciliation',
      });
    });

    it('reports an unexpected background-created (mode-change) attempt failure once', async () => {
      const unexpected = new Error('reconciliation pass bug');
      const runPass = vi.fn().mockRejectedValue(unexpected);
      const runEffects = vi.fn().mockResolvedValue(undefined);
      const reconciler = createUpdateReconciler({ runPass, runEffects });

      await expect(reconciler.reconcileAfterModeChange()).rejects.toBe(unexpected);

      expect(captureDiagnosticExceptionMock).toHaveBeenCalledExactlyOnceWith(unexpected, {
        operation: 'updateReconciliation',
      });
    });

    it('reports a background attempt failure only once even when a second navigation joins it', async () => {
      const unexpected = new Error('reconciliation pass bug');
      const pass = deferred<ReconciliationPassResult>();
      const runPass = vi.fn(() => pass.promise);
      const runEffects = vi.fn().mockResolvedValue(undefined);
      const reconciler = createUpdateReconciler({ runPass, runEffects });

      const first = reconciler.reconcileNavigation();
      const second = reconciler.reconcileNavigation();
      await startPass();
      pass.reject(unexpected);

      await expect(first).rejects.toBe(unexpected);
      await expect(second).rejects.toBe(unexpected);
      expect(captureDiagnosticExceptionMock).toHaveBeenCalledExactlyOnceWith(unexpected, {
        operation: 'updateReconciliation',
      });
    });

    it('reports an unexpected Check-created attempt failure once, and its ReconciliationFailure retains runLifetimeWork', async () => {
      const unexpected = new Error('reconciliation pass bug');
      const runPass = vi.fn().mockRejectedValue(unexpected);
      const runEffects = vi.fn().mockResolvedValue(undefined);
      const reconciler = createUpdateReconciler({ runPass, runEffects });

      let caught: unknown;
      try {
        await reconciler.checkForUpdates();
      } catch (error) {
        caught = error;
      }
      if (!(caught instanceof ReconciliationFailure))
        throw new Error('Expected a ReconciliationFailure');
      expect(caught.cause).toBe(unexpected);
      expect(caught.runLifetimeWork).toBeTypeOf('function');

      expect(captureDiagnosticExceptionMock).toHaveBeenCalledExactlyOnceWith(unexpected, {
        operation: 'updateReconciliation',
      });
    });

    it('reports a Check-created attempt failure once even when a background call joins it', async () => {
      const unexpected = new Error('reconciliation pass bug');
      const pass = deferred<ReconciliationPassResult>();
      const runPass = vi.fn(() => pass.promise);
      const runEffects = vi.fn().mockResolvedValue(undefined);
      const reconciler = createUpdateReconciler({ runPass, runEffects });

      const check = reconciler.checkForUpdates();
      const navigation = reconciler.reconcileNavigation();
      await startPass();
      pass.reject(unexpected);

      await expect(check).rejects.toBeInstanceOf(ReconciliationFailure);
      await expect(navigation).rejects.toBe(unexpected);
      expect(captureDiagnosticExceptionMock).toHaveBeenCalledExactlyOnceWith(unexpected, {
        operation: 'updateReconciliation',
      });
    });

    it('reports a background-created attempt failure once even when a Check joins it', async () => {
      const unexpected = new Error('reconciliation pass bug');
      const pass = deferred<ReconciliationPassResult>();
      const runPass = vi.fn(() => pass.promise);
      const runEffects = vi.fn().mockResolvedValue(undefined);
      const reconciler = createUpdateReconciler({ runPass, runEffects });

      const navigation = reconciler.reconcileNavigation();
      const check = reconciler.checkForUpdates();
      await startPass();
      pass.reject(unexpected);

      await expect(navigation).rejects.toBe(unexpected);
      let caught: unknown;
      try {
        await check;
      } catch (error) {
        caught = error;
      }
      if (!(caught instanceof ReconciliationFailure))
        throw new Error('Expected a ReconciliationFailure');
      expect(caught.cause).toBe(unexpected);
      // A joining Check never created the attempt, so it must never gain
      // ownership of the background creator's effects.
      expect(caught.runLifetimeWork).toBeUndefined();
      expect(captureDiagnosticExceptionMock).toHaveBeenCalledExactlyOnceWith(unexpected, {
        operation: 'updateReconciliation',
      });
    });

    it('never reports a background attempt failure already classified as a release-preparation error', async () => {
      const { releasePreparationError, ReleasePreparationFailureReason } =
        await import('./releasePreparation');
      const classified = releasePreparationError(
        ReleasePreparationFailureReason.CACHE_STORAGE_UNAVAILABLE,
        'cache write failed',
      );
      const runPass = vi.fn().mockRejectedValue(classified);
      const runEffects = vi.fn().mockResolvedValue(undefined);
      const reconciler = createUpdateReconciler({ runPass, runEffects });

      await expect(reconciler.reconcileNavigation()).rejects.toBe(classified);

      expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
    });

    it('never reports a background attempt failure already classified as a controller-state write error', async () => {
      const { ControllerStateWriteFailureReason } = await import('./controllerState');
      const classified = new DomainError('Failed to persist controller state', {
        code: ControllerStateWriteFailureReason.STORAGE_UNAVAILABLE,
      });
      const runPass = vi.fn().mockRejectedValue(classified);
      const runEffects = vi.fn().mockResolvedValue(undefined);
      const reconciler = createUpdateReconciler({ runPass, runEffects });

      await expect(reconciler.reconcileNavigation()).rejects.toBe(classified);

      expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
    });

    it('never reports a background attempt failure already classified as controller-state-unavailable', async () => {
      const { ControllerStateUnavailableReason } = await import('./stateLock');
      const classified = new DomainError('Controller state is unavailable', {
        code: ControllerStateUnavailableReason.STORAGE_UNAVAILABLE,
      });
      const runPass = vi.fn().mockRejectedValue(classified);
      const runEffects = vi.fn().mockResolvedValue(undefined);
      const reconciler = createUpdateReconciler({ runPass, runEffects });

      await expect(reconciler.reconcileNavigation()).rejects.toBe(classified);

      expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
    });
  });
});
