import { describe, expect, it, vi } from 'vitest';
import type { AppUpdateSnapshot } from './protocol';
import { createUpdateReconciler } from './updateReconciliation';

const snapshot = (releaseNumber: number): AppUpdateSnapshot => ({
  mode: 'automatic',
  activeRelease: {
    releaseNumber,
    appVersion: '1.0.0',
    buildId: `build-${releaseNumber}`,
    buildDate: '2026-08-02T00:00:00.000Z',
  },
});

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

describe('createUpdateReconciler', () => {
  it('starts one pass for idle navigation', async () => {
    const runPass = vi.fn().mockResolvedValue(snapshot(1));
    const reconciler = createUpdateReconciler({ runPass });
    await reconciler.reconcileNavigation();
    expect(runPass).toHaveBeenCalledTimes(1);
  });

  it('joins concurrent navigation without requesting a rerun', async () => {
    const pass = deferred<AppUpdateSnapshot>();
    const runPass = vi.fn(() => pass.promise);
    const reconciler = createUpdateReconciler({ runPass });
    const first = reconciler.reconcileNavigation();
    const second = reconciler.reconcileNavigation();
    await startPass();
    expect(runPass).toHaveBeenCalledTimes(1);
    pass.resolve(snapshot(1));
    await Promise.all([first, second]);
    expect(runPass).toHaveBeenCalledTimes(1);
  });

  it('joins an explicit Check and returns the final snapshot without a rerun', async () => {
    const pass = deferred<AppUpdateSnapshot>();
    const runPass = vi.fn(() => pass.promise);
    const reconciler = createUpdateReconciler({ runPass });
    const navigation = reconciler.reconcileNavigation();
    const check = reconciler.checkForUpdates();
    await startPass();
    pass.resolve(snapshot(2));
    await navigation;
    await expect(check).resolves.toEqual(snapshot(2));
    expect(runPass).toHaveBeenCalledTimes(1);
  });

  it('requests exactly one rerun for a mode change during a pass', async () => {
    const first = deferred<AppUpdateSnapshot>();
    const second = deferred<AppUpdateSnapshot>();
    const runPass = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const reconciler = createUpdateReconciler({ runPass });
    const check = reconciler.checkForUpdates();
    await startPass();
    const modeChange = reconciler.reconcileAfterModeChange();
    first.resolve(snapshot(1));
    await startPass();
    expect(runPass).toHaveBeenCalledTimes(2);
    second.resolve(snapshot(2));
    await modeChange;
    await expect(check).resolves.toEqual(snapshot(2));
  });

  it('collapses multiple mode changes during one pass into one rerun', async () => {
    const first = deferred<AppUpdateSnapshot>();
    const second = deferred<AppUpdateSnapshot>();
    const runPass = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const reconciler = createUpdateReconciler({ runPass });
    const check = reconciler.checkForUpdates();
    await startPass();
    const changes = [reconciler.reconcileAfterModeChange(), reconciler.reconcileAfterModeChange()];
    first.resolve(snapshot(1));
    await startPass();
    second.resolve(snapshot(2));
    await Promise.all(changes);
    await check;
    expect(runPass).toHaveBeenCalledTimes(2);
  });

  it('allows a mode change during a rerun to request one additional rerun', async () => {
    const first = deferred<AppUpdateSnapshot>();
    const second = deferred<AppUpdateSnapshot>();
    const third = deferred<AppUpdateSnapshot>();
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
    first.resolve(snapshot(1));
    await startPass();
    void reconciler.reconcileAfterModeChange();
    second.resolve(snapshot(2));
    await startPass();
    third.resolve(snapshot(3));
    await expect(check).resolves.toEqual(snapshot(3));
    expect(runPass).toHaveBeenCalledTimes(3);
  });

  it('keeps the shared promise pending until required reruns finish', async () => {
    const first = deferred<AppUpdateSnapshot>();
    const second = deferred<AppUpdateSnapshot>();
    const runPass = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const reconciler = createUpdateReconciler({ runPass });
    const settled = vi.fn();
    const check = reconciler.checkForUpdates().then(settled);
    await startPass();
    void reconciler.reconcileAfterModeChange();
    first.resolve(snapshot(1));
    await startPass();
    expect(settled).not.toHaveBeenCalled();
    second.resolve(snapshot(2));
    await check;
    expect(settled).toHaveBeenCalledWith(snapshot(2));
  });

  it('discards a failed pass when a mode change requested a successful rerun', async () => {
    const first = deferred<AppUpdateSnapshot>();
    const second = deferred<AppUpdateSnapshot>();
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
    second.resolve(snapshot(2));
    await modeChange;
    await expect(check).resolves.toEqual(snapshot(2));
  });

  it('rejects when a requested rerun is the final failed pass', async () => {
    const first = deferred<AppUpdateSnapshot>();
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
    const runPass = vi.fn().mockResolvedValueOnce(snapshot(1)).mockResolvedValueOnce(snapshot(2));
    const reconciler = createUpdateReconciler({ runPass });
    await reconciler.checkForUpdates();
    await reconciler.checkForUpdates();
    expect(runPass).toHaveBeenCalledTimes(2);
  });

  it('clears the in-flight reference after failure so a later trigger starts fresh', async () => {
    const failure = new Error('failed pass');
    const runPass = vi.fn().mockRejectedValueOnce(failure).mockResolvedValueOnce(snapshot(2));
    const reconciler = createUpdateReconciler({ runPass });
    await expect(reconciler.checkForUpdates()).rejects.toBe(failure);
    await expect(reconciler.checkForUpdates()).resolves.toEqual(snapshot(2));
    expect(runPass).toHaveBeenCalledTimes(2);
  });
});
