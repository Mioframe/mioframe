import { describe, expect, it, vi } from 'vitest';
import type { AppUpdateSnapshot } from './protocol';
import { createUpdateReconciler, type ReconciliationResult } from './updateReconciliation';

const snapshot = (releaseNumber: number): AppUpdateSnapshot => ({
  mode: 'automatic',
  activeRelease: {
    releaseNumber,
    appVersion: '1.0.0',
    buildId: `build-${releaseNumber}`,
    buildDate: '2026-08-02T00:00:00.000Z',
  },
});

const result = (
  releaseNumber: number,
  runLifetimeWork?: () => Promise<void>,
): ReconciliationResult => ({ snapshot: snapshot(releaseNumber), runLifetimeWork });

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
 * `Promise.resolve().then(runUntilSettled)` plus its internal `release()`
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
  it('starts one pass for idle navigation', async () => {
    const runPass = vi.fn().mockResolvedValue(result(1));
    const reconciler = createUpdateReconciler({ runPass });
    await reconciler.reconcileNavigation();
    expect(runPass).toHaveBeenCalledTimes(1);
  });

  it('joins concurrent navigation without requesting a rerun', async () => {
    const pass = deferred<ReconciliationResult>();
    const runPass = vi.fn(() => pass.promise);
    const reconciler = createUpdateReconciler({ runPass });
    const first = reconciler.reconcileNavigation();
    const second = reconciler.reconcileNavigation();
    await startPass();
    expect(runPass).toHaveBeenCalledTimes(1);
    pass.resolve(result(1));
    await Promise.all([first, second]);
    expect(runPass).toHaveBeenCalledTimes(1);
  });

  it('joins an explicit Check and returns the final durable snapshot without a rerun', async () => {
    const pass = deferred<ReconciliationResult>();
    const runPass = vi.fn(() => pass.promise);
    const reconciler = createUpdateReconciler({ runPass });
    const navigation = reconciler.reconcileNavigation();
    const check = reconciler.checkForUpdates();
    await startPass();
    pass.resolve(result(2));
    await navigation;
    await expect(check).resolves.toEqual({ snapshot: snapshot(2) });
    expect(runPass).toHaveBeenCalledTimes(1);
  });

  it('a mode-change rerun retains and combines deferred work from both the superseded and the rerun pass', async () => {
    const first = deferred<ReconciliationResult>();
    const second = deferred<ReconciliationResult>();
    const firstWork = vi.fn().mockResolvedValue(undefined);
    const secondWork = vi.fn().mockResolvedValue(undefined);
    const runPass = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const reconciler = createUpdateReconciler({ runPass });
    const check = reconciler.checkForUpdates();
    await startPass();
    const modeChange = reconciler.reconcileAfterModeChange();
    first.resolve(result(1, firstWork));
    await startPass();
    second.resolve(result(2, secondWork));

    const settled = await check;
    expect(settled.snapshot).toEqual(snapshot(2));
    expect(firstWork).not.toHaveBeenCalled();
    expect(secondWork).not.toHaveBeenCalled();

    await settled.runLifetimeWork?.();
    expect(firstWork).toHaveBeenCalledTimes(1);
    expect(secondWork).toHaveBeenCalledTimes(1);
    await modeChange;
  });

  it('requests exactly one rerun for a mode change during a pass', async () => {
    const first = deferred<ReconciliationResult>();
    const second = deferred<ReconciliationResult>();
    const runPass = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const reconciler = createUpdateReconciler({ runPass });
    const check = reconciler.checkForUpdates();
    await startPass();
    const modeChange = reconciler.reconcileAfterModeChange();
    first.resolve(result(1));
    await startPass();
    expect(runPass).toHaveBeenCalledTimes(2);
    second.resolve(result(2));
    // `modeChange` joined the Check-created attempt, so only releasing the
    // Check's own returned callback (as `workerMessages` would, after
    // posting its response) lets the joined mode-change resolve.
    const settled = await check;
    expect(settled.snapshot).toEqual(snapshot(2));
    await settled.runLifetimeWork?.();
    await modeChange;
  });

  it('collapses multiple mode changes during one pass into one rerun', async () => {
    const first = deferred<ReconciliationResult>();
    const second = deferred<ReconciliationResult>();
    const runPass = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const reconciler = createUpdateReconciler({ runPass });
    const check = reconciler.checkForUpdates();
    await startPass();
    const changes = [reconciler.reconcileAfterModeChange(), reconciler.reconcileAfterModeChange()];
    first.resolve(result(1));
    await startPass();
    second.resolve(result(2));
    const settled = await check;
    await settled.runLifetimeWork?.();
    await Promise.all(changes);
    expect(runPass).toHaveBeenCalledTimes(2);
  });

  it('allows a mode change during a rerun to request one additional rerun', async () => {
    const first = deferred<ReconciliationResult>();
    const second = deferred<ReconciliationResult>();
    const third = deferred<ReconciliationResult>();
    const passes = [first, second, third];
    const runPass = vi.fn().mockImplementation(() => {
      const pass = passes[runPass.mock.calls.length - 1];
      if (!pass) throw new Error('Unexpected reconciliation pass');
      return pass.promise;
    });
    const reconciler = createUpdateReconciler({ runPass });
    const check = reconciler.checkForUpdates();
    await startPass();
    void reconciler.reconcileAfterModeChange();
    first.resolve(result(1));
    await startPass();
    void reconciler.reconcileAfterModeChange();
    second.resolve(result(2));
    await startPass();
    third.resolve(result(3));
    const settled = await check;
    expect(settled.snapshot).toEqual(snapshot(3));
    expect(runPass).toHaveBeenCalledTimes(3);
  });

  it('keeps the shared promise pending until required reruns finish', async () => {
    const first = deferred<ReconciliationResult>();
    const second = deferred<ReconciliationResult>();
    const runPass = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const reconciler = createUpdateReconciler({ runPass });
    const settled = vi.fn();
    const check = reconciler.checkForUpdates().then(settled);
    await startPass();
    void reconciler.reconcileAfterModeChange();
    first.resolve(result(1));
    await startPass();
    expect(settled).not.toHaveBeenCalled();
    second.resolve(result(2));
    await check;
    expect(settled).toHaveBeenCalledWith(expect.objectContaining({ snapshot: snapshot(2) }));
  });

  it('discards a failed pass when a mode change requested a successful rerun', async () => {
    const first = deferred<ReconciliationResult>();
    const second = deferred<ReconciliationResult>();
    const runPass = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const reconciler = createUpdateReconciler({ runPass });
    const check = reconciler.checkForUpdates();
    await startPass();
    const modeChange = reconciler.reconcileAfterModeChange();
    first.reject(new Error('superseded failed pass'));
    await startPass();
    expect(runPass).toHaveBeenCalledTimes(2);
    second.resolve(result(2));
    const settled = await check;
    expect(settled.snapshot).toEqual(snapshot(2));
    await settled.runLifetimeWork?.();
    await modeChange;
  });

  it('rejects when a requested rerun is the final failed pass', async () => {
    const first = deferred<ReconciliationResult>();
    const finalFailure = new Error('failed rerun');
    const runPass = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockRejectedValueOnce(finalFailure);
    const reconciler = createUpdateReconciler({ runPass });
    const check = reconciler.checkForUpdates();
    await startPass();
    const modeChange = expect(reconciler.reconcileAfterModeChange()).rejects.toBe(finalFailure);
    first.reject(new Error('superseded failed pass'));
    await expect(check).rejects.toBe(finalFailure);
    await modeChange;
    expect(runPass).toHaveBeenCalledTimes(2);
  });

  it('clears the in-flight reference after success so a later trigger starts fresh', async () => {
    const runPass = vi.fn().mockResolvedValueOnce(result(1)).mockResolvedValueOnce(result(2));
    const reconciler = createUpdateReconciler({ runPass });
    await reconciler.checkForUpdates();
    await reconciler.checkForUpdates();
    expect(runPass).toHaveBeenCalledTimes(2);
  });

  it('clears the in-flight reference after failure so a later trigger starts fresh', async () => {
    const failure = new Error('failed pass');
    const runPass = vi.fn().mockRejectedValueOnce(failure).mockResolvedValueOnce(result(2));
    const reconciler = createUpdateReconciler({ runPass });
    await expect(reconciler.checkForUpdates()).rejects.toBe(failure);
    const settled = await reconciler.checkForUpdates();
    expect(settled.snapshot).toEqual(snapshot(2));
    expect(runPass).toHaveBeenCalledTimes(2);
  });

  it('never loses a mode-change rerun requested exactly at the old settlement-cleanup boundary', async () => {
    // Reproduces the settlement microtask race: `first.resolve()` schedules
    // the pass continuation's reaction first; the `Promise.resolve().then()`
    // scheduled immediately afterward (same synchronous tick, no `await`
    // between them) is queued directly behind it — landing exactly where the
    // now-removed `.finally()` cleanup used to run several microtask hops
    // later, i.e. exactly the window the old buggy `.finally()` cleanup left
    // open. Against the old implementation this mode-change still observes
    // `inFlight` assigned to the already-decided attempt, sets
    // `rerunRequested`, and joins that same settling promise — the flag is
    // never re-checked, so the required fresh-state rerun is silently
    // dropped and `runPass` is called only once. The fix closes the window by
    // releasing ownership synchronously with the final decision, so this
    // same-tick mode-change instead starts its own fresh reconciliation and a
    // second `runPass()` genuinely executes.
    const first = deferred<ReconciliationResult>();
    const second = deferred<ReconciliationResult>();
    const runPass = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const reconciler = createUpdateReconciler({ runPass });
    const check = reconciler.checkForUpdates();
    await startPass();

    let modeChange!: Promise<void>;
    first.resolve(result(1));
    const scheduled = Promise.resolve().then(() => {
      modeChange = reconciler.reconcileAfterModeChange();
    });
    await scheduled;
    await startPass();
    await startPass();

    expect(runPass).toHaveBeenCalledTimes(2);
    second.resolve(result(2));
    await modeChange;
    const settled = await check;
    expect(settled.snapshot).toEqual(snapshot(1));
  });

  describe('deferred work release ownership', () => {
    it('hands the raw deferred callback back to a Check that creates the attempt, uninvoked', async () => {
      const work = vi.fn().mockResolvedValue(undefined);
      const runPass = vi.fn().mockResolvedValue(result(1, work));
      const reconciler = createUpdateReconciler({ runPass });

      const settled = await reconciler.checkForUpdates();

      expect(settled.runLifetimeWork).toBeTypeOf('function');
      expect(work).not.toHaveBeenCalled();
      await settled.runLifetimeWork?.();
      expect(work).toHaveBeenCalledTimes(1);
    });

    it('never exposes a deferred callback to a Check that only joins an existing attempt', async () => {
      const work = vi.fn().mockResolvedValue(undefined);
      const pass = deferred<ReconciliationResult>();
      const runPass = vi.fn(() => pass.promise);
      const reconciler = createUpdateReconciler({ runPass });

      const creatorCheck = reconciler.checkForUpdates();
      const joinerCheck = reconciler.checkForUpdates();
      await startPass();
      pass.resolve(result(1, work));

      const [creatorResult, joinerResult] = await Promise.all([creatorCheck, joinerCheck]);
      expect(creatorResult.runLifetimeWork).toBeTypeOf('function');
      expect(joinerResult.runLifetimeWork).toBeUndefined();
      expect(work).not.toHaveBeenCalled();
    });

    it('shares one durable pass and executes deferred work exactly once for multiple Check joiners', async () => {
      const work = vi.fn().mockResolvedValue(undefined);
      const pass = deferred<ReconciliationResult>();
      const runPass = vi.fn(() => pass.promise);
      const reconciler = createUpdateReconciler({ runPass });

      const first = reconciler.checkForUpdates();
      const second = reconciler.checkForUpdates();
      const third = reconciler.checkForUpdates();
      await startPass();
      pass.resolve(result(1, work));

      const [firstResult] = await Promise.all([first, second, third]);
      expect(runPass).toHaveBeenCalledTimes(1);
      await firstResult.runLifetimeWork?.();
      // A later, no-op invocation (e.g. a genuinely duplicate release call)
      // must never re-run the underlying broadcast/cleanup work.
      await firstResult.runLifetimeWork?.();
      expect(work).toHaveBeenCalledTimes(1);
    });

    it('releases automatically for a navigation that creates the attempt, only after its own deferred work finishes', async () => {
      const deferredWork = deferred<undefined>();
      const work = vi.fn(() => deferredWork.promise);
      const pass = deferred<ReconciliationResult>();
      const runPass = vi.fn(() => pass.promise);
      const reconciler = createUpdateReconciler({ runPass });

      const settled = vi.fn();
      const navigation = reconciler.reconcileNavigation().then(settled);
      await startPass();
      pass.resolve(result(1, work));
      await flushMicrotasks();

      expect(work).toHaveBeenCalledTimes(1);
      expect(settled).not.toHaveBeenCalled();

      deferredWork.resolve(undefined);
      await navigation;
      expect(settled).toHaveBeenCalledTimes(1);
    });

    it('a navigation joining a Check-created attempt never releases the work itself, and cannot release it before the Check response', async () => {
      const releaseOrder: string[] = [];
      const deferredWork = deferred<undefined>();
      const work = vi.fn(() => {
        releaseOrder.push('work-started');
        return deferredWork.promise;
      });
      const pass = deferred<ReconciliationResult>();
      const runPass = vi.fn(() => pass.promise);
      const reconciler = createUpdateReconciler({ runPass });

      const check = reconciler.checkForUpdates();
      const navigationSettled = vi.fn();
      const navigation = reconciler.reconcileNavigation().then(navigationSettled);
      await startPass();
      pass.resolve(result(1, work));
      await flushMicrotasks();

      // The pass has settled and Navigation has joined, but only the Check
      // creator owns releasing the deferred work — it must not have started
      // yet, and Navigation's own promise must still be pending.
      expect(work).not.toHaveBeenCalled();
      expect(navigationSettled).not.toHaveBeenCalled();

      const checkResult = await check;
      expect(checkResult.runLifetimeWork).toBeTypeOf('function');
      // Simulates workerMessages posting the Check response, then invoking
      // the deferred callback only afterwards.
      releaseOrder.push('check-response-posted');
      const released = checkResult.runLifetimeWork?.();
      await startPass();
      expect(releaseOrder).toEqual(['check-response-posted', 'work-started']);
      expect(navigationSettled).not.toHaveBeenCalled();

      deferredWork.resolve(undefined);
      await released;
      await navigation;
      expect(navigationSettled).toHaveBeenCalledTimes(1);
      expect(work).toHaveBeenCalledTimes(1);
    });
  });
});
