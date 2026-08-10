import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseSummary, UpdateControllerState } from './contracts';
import { createOperationQueue } from './operationQueue';
import type { PreparationCoordinator } from './preparationCoordinator';
import type { UpdateReconciler } from './updateReconciliation';

const readControllerStateMock = vi.fn();
const writeControllerStateMock = vi.fn();
type MockWindowClient = { type: 'window'; url: string; postMessage: (message: unknown) => void };
const matchAllMock = vi.fn((): Promise<MockWindowClient[]> => Promise.resolve([]));

vi.mock('./controllerState', () => ({
  readControllerState: (...args: unknown[]) => readControllerStateMock(...args),
  writeControllerState: (...args: unknown[]) => writeControllerStateMock(...args),
}));
vi.stubGlobal('self', { clients: { matchAll: matchAllMock } });

const PROTOCOL_VERSION = 1 as const;
const CHANNEL_ORIGIN = 'https://mioframe.example';

const releaseA: ReleaseSummary = {
  releaseNumber: 1,
  appVersion: '1.0.0',
  buildId: 'build-a',
  buildDate: '2026-07-24T00:00:00.000Z',
};
const releaseB: ReleaseSummary = {
  releaseNumber: 2,
  appVersion: '1.1.0',
  buildId: 'build-b',
  buildDate: '2026-07-24T00:00:00.000Z',
};
const releaseC: ReleaseSummary = {
  releaseNumber: 3,
  appVersion: '1.2.0',
  buildId: 'build-c',
  buildDate: '2026-07-24T00:00:00.000Z',
};

const baseState: UpdateControllerState = {
  schemaVersion: 1,
  mode: 'manual',
  activeRelease: releaseA,
};

const enqueue = <T>(operation: () => Promise<T>): Promise<T> => operation();

function createFakeCoordinator(
  overrides: Partial<PreparationCoordinator> = {},
): PreparationCoordinator {
  return {
    prepare: vi.fn().mockResolvedValue(undefined),
    runCleanup: (cleanup) => cleanup([]),
    ...overrides,
  };
}

function createFakeReconciler(overrides: Partial<UpdateReconciler> = {}): UpdateReconciler {
  return {
    reconcileNavigation: vi.fn().mockResolvedValue(undefined),
    checkForUpdates: vi
      .fn()
      .mockResolvedValue({ snapshot: { mode: 'manual', activeRelease: releaseA } }),
    reconcileAfterModeChange: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

beforeEach(() => {
  readControllerStateMock.mockReset();
  writeControllerStateMock.mockReset();
  matchAllMock.mockClear();
  matchAllMock.mockResolvedValue([]);
  readControllerStateMock.mockResolvedValue({ status: 'valid', state: baseState });
});

describe('handleWorkerMessage', () => {
  it('throws when persisted state is not valid', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    const { handleWorkerMessage } = await import('./workerMessages');

    await expect(
      handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'GET_SNAPSHOT' },
        enqueue,
        createFakeCoordinator(),
        createFakeReconciler(),
      ),
    ).rejects.toThrow('Controller state is unavailable');
  });

  it('GET_SNAPSHOT returns the current state as a snapshot without writing', async () => {
    const { handleWorkerMessage } = await import('./workerMessages');
    const result = await handleWorkerMessage(
      'stable',
      '/',
      CHANNEL_ORIGIN,
      { protocolVersion: PROTOCOL_VERSION, type: 'GET_SNAPSHOT' },
      enqueue,
      createFakeCoordinator(),
      createFakeReconciler(),
    );

    expect(result.response).toEqual({
      protocolVersion: PROTOCOL_VERSION,
      snapshot: expect.objectContaining({ mode: 'manual' }),
    });
    expect(writeControllerStateMock).not.toHaveBeenCalled();
    expect(result.runLifetimeWork).toBeUndefined();
  });

  it('CHECK_FOR_UPDATES returns the reconciler final snapshot without deferred work', async () => {
    const finalSnapshot = {
      mode: 'automatic' as const,
      activeRelease: releaseB,
      candidate: { phase: 'ready' as const, release: releaseC },
    };
    const checkForUpdates = vi.fn().mockResolvedValue({ snapshot: finalSnapshot });
    const reconciler = createFakeReconciler({ checkForUpdates });
    const { handleWorkerMessage } = await import('./workerMessages');
    const result = await handleWorkerMessage(
      'stable',
      '/',
      CHANNEL_ORIGIN,
      { protocolVersion: PROTOCOL_VERSION, type: 'CHECK_FOR_UPDATES' },
      enqueue,
      createFakeCoordinator(),
      reconciler,
    );
    expect(result.response).toEqual({ protocolVersion: PROTOCOL_VERSION, snapshot: finalSnapshot });
    expect(checkForUpdates).toHaveBeenCalledTimes(1);
    expect(result.runLifetimeWork).toBeUndefined();
  });

  it('CHECK_FOR_UPDATES passes through the reconciler deferred callback uninvoked', async () => {
    const finalSnapshot = {
      mode: 'automatic' as const,
      activeRelease: releaseB,
      candidate: { phase: 'ready' as const, release: releaseC },
    };
    const deferredWork = vi.fn().mockResolvedValue(undefined);
    const checkForUpdates = vi
      .fn()
      .mockResolvedValue({ snapshot: finalSnapshot, runLifetimeWork: deferredWork });
    const reconciler = createFakeReconciler({ checkForUpdates });
    const { handleWorkerMessage } = await import('./workerMessages');
    const result = await handleWorkerMessage(
      'stable',
      '/',
      CHANNEL_ORIGIN,
      { protocolVersion: PROTOCOL_VERSION, type: 'CHECK_FOR_UPDATES' },
      enqueue,
      createFakeCoordinator(),
      reconciler,
    );
    expect(result.response).toEqual({ protocolVersion: PROTOCOL_VERSION, snapshot: finalSnapshot });
    expect(result.runLifetimeWork).toBe(deferredWork);
    expect(deferredWork).not.toHaveBeenCalled();
  });

  describe('CANCEL_SCHEDULED_UPDATE', () => {
    it('returns a Manual ready candidate to available and persists it', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: { ...baseState, candidate: { phase: 'ready', release: releaseB } },
      });
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'CANCEL_SCHEDULED_UPDATE' },
        enqueue,
        createFakeCoordinator(),
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        snapshot: expect.objectContaining({ candidate: { phase: 'available', release: releaseB } }),
      });
      expect(writeControllerStateMock).toHaveBeenCalledTimes(1);
    });

    it('is a no-op for an Automatic ready candidate, and writes nothing', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: {
          ...baseState,
          mode: 'automatic',
          candidate: { phase: 'ready', release: releaseB },
        },
      });
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'CANCEL_SCHEDULED_UPDATE' },
        enqueue,
        createFakeCoordinator(),
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        snapshot: expect.objectContaining({
          mode: 'automatic',
          candidate: { phase: 'ready', release: releaseB },
        }),
      });
      expect(writeControllerStateMock).not.toHaveBeenCalled();
      expect(result.runLifetimeWork).toBeUndefined();
    });
  });

  describe('SET_MODE', () => {
    it('to manual is a true no-op when already Manual: no write, no follow-up', async () => {
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'SET_MODE', mode: 'manual' },
        enqueue,
        createFakeCoordinator(),
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        snapshot: expect.objectContaining({ mode: 'manual' }),
      });
      expect(writeControllerStateMock).not.toHaveBeenCalled();
      expect(result.runLifetimeWork).toBeUndefined();
    });

    it('to automatic persists and responds before deferred reconciliation begins', async () => {
      let persisted: UpdateControllerState = {
        ...baseState,
        candidate: { phase: 'available', release: releaseB },
      };
      readControllerStateMock.mockImplementation(() => ({ status: 'valid', state: persisted }));
      writeControllerStateMock.mockImplementation(
        (_channel: string, state: UpdateControllerState) => {
          persisted = state;
        },
      );
      const coordinator = createFakeCoordinator();
      const reconcileAfterModeChange = vi.fn().mockResolvedValue(undefined);
      const reconciler = createFakeReconciler({ reconcileAfterModeChange });
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'SET_MODE', mode: 'automatic' },
        enqueue,
        coordinator,
        reconciler,
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        snapshot: expect.objectContaining({
          mode: 'automatic',
          candidate: { phase: 'available', release: releaseB },
        }),
      });
      // The mode switch is already durable, but preparation has not started
      // yet: it only runs once runLifetimeWork is explicitly invoked.
      expect(writeControllerStateMock).toHaveBeenCalledTimes(1);
      expect(reconcileAfterModeChange).not.toHaveBeenCalled();
      expect(result.runLifetimeWork).toBeDefined();

      await result.runLifetimeWork?.();
      expect(reconcileAfterModeChange).toHaveBeenCalledTimes(1);
    });

    it('to automatic when already automatic has no deferred reconciliation retry', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: {
          ...baseState,
          mode: 'automatic',
          candidate: { phase: 'available', release: releaseB },
        },
      });
      const coordinator = createFakeCoordinator();
      const reconcileAfterModeChange = vi.fn().mockResolvedValue(undefined);
      const reconciler = createFakeReconciler({ reconcileAfterModeChange });
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'SET_MODE', mode: 'automatic' },
        enqueue,
        coordinator,
        reconciler,
      );

      expect(writeControllerStateMock).not.toHaveBeenCalled();
      expect(result.runLifetimeWork).toBeUndefined();
      expect(reconcileAfterModeChange).not.toHaveBeenCalled();
    });

    it('to manual clears nothing: the candidate is untouched by a mode switch', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: {
          ...baseState,
          mode: 'automatic',
          candidate: { phase: 'ready', release: releaseB },
        },
      });
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'SET_MODE', mode: 'manual' },
        enqueue,
        createFakeCoordinator(),
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        snapshot: expect.objectContaining({
          mode: 'manual',
          candidate: { phase: 'ready', release: releaseB },
        }),
      });
    });

    it('never triggers preparation for an activating or ready candidate', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: {
          ...baseState,
          candidate: {
            phase: 'activating',
            release: releaseB,
            deadlineAt: '2026-07-24T00:00:30.000Z',
          },
        },
      });
      const coordinator = createFakeCoordinator();
      const reconcileAfterModeChange = vi.fn().mockResolvedValue(undefined);
      const reconciler = createFakeReconciler({ reconcileAfterModeChange });
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'SET_MODE', mode: 'automatic' },
        enqueue,
        coordinator,
        reconciler,
      );

      await result.runLifetimeWork?.();
      expect(coordinator.prepare).not.toHaveBeenCalled();
      expect(reconcileAfterModeChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('INSTALL_ON_NEXT_LAUNCH', () => {
    it('reports unavailable when there is no candidate', async () => {
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'INSTALL_ON_NEXT_LAUNCH' },
        enqueue,
        createFakeCoordinator(),
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        snapshot: expect.objectContaining({ error: 'unavailable' }),
      });
    });

    it('prepares the available candidate and moves it to ready', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: { ...baseState, candidate: { phase: 'available', release: releaseB } },
      });
      const coordinator = createFakeCoordinator();
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'INSTALL_ON_NEXT_LAUNCH' },
        enqueue,
        coordinator,
        createFakeReconciler(),
      );

      expect(coordinator.prepare).toHaveBeenCalledWith('stable', '/', releaseB);
      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        snapshot: expect.objectContaining({ candidate: { phase: 'ready', release: releaseB } }),
      });
    });

    it('retries an exact failed candidate (explicit Manual retry) and moves it to ready', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: { ...baseState, candidate: { phase: 'failed', release: releaseB } },
      });
      const coordinator = createFakeCoordinator();
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'INSTALL_ON_NEXT_LAUNCH' },
        enqueue,
        coordinator,
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        snapshot: expect.objectContaining({ candidate: { phase: 'ready', release: releaseB } }),
      });
    });

    it('reports install-failed when preparation fails, leaving the candidate available', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: { ...baseState, candidate: { phase: 'available', release: releaseB } },
      });
      const coordinator = createFakeCoordinator({
        prepare: vi.fn().mockRejectedValue(new Error('offline')),
      });
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'INSTALL_ON_NEXT_LAUNCH' },
        enqueue,
        coordinator,
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        snapshot: expect.objectContaining({
          candidate: { phase: 'available', release: releaseB },
          error: 'install-failed',
        }),
      });
    });

    it('is a no-op, without preparing, while the candidate is already activating', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: {
          ...baseState,
          candidate: {
            phase: 'activating',
            release: releaseB,
            deadlineAt: '2026-07-24T00:00:30.000Z',
          },
        },
      });
      const coordinator = createFakeCoordinator();
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'INSTALL_ON_NEXT_LAUNCH' },
        enqueue,
        coordinator,
        createFakeReconciler(),
      );

      expect(coordinator.prepare).not.toHaveBeenCalled();
      expect(result.response).toMatchObject({
        snapshot: expect.objectContaining({
          candidate: expect.objectContaining({ phase: 'activating' }),
        }),
      });
    });

    it('does not prepare in Automatic mode', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: {
          ...baseState,
          mode: 'automatic',
          candidate: { phase: 'available', release: releaseB },
        },
      });
      const coordinator = createFakeCoordinator();
      const { handleWorkerMessage } = await import('./workerMessages');

      await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'INSTALL_ON_NEXT_LAUNCH' },
        enqueue,
        coordinator,
        createFakeReconciler(),
      );

      expect(coordinator.prepare).not.toHaveBeenCalled();
      expect(writeControllerStateMock).not.toHaveBeenCalled();
    });

    // Required deterministic race proof (2): Manual installation starts for
    // B; discovery replaces available(B) with available(C); B preparation
    // completes; B completion is a no-op and never schedules B.
    it('never schedules B when discovery replaces it with C while B is preparing', async () => {
      let persisted: UpdateControllerState = {
        ...baseState,
        candidate: { phase: 'available', release: releaseB },
      };
      readControllerStateMock.mockImplementation(() => ({ status: 'valid', state: persisted }));
      writeControllerStateMock.mockImplementation(
        (_channel: string, state: UpdateControllerState) => {
          persisted = state;
        },
      );
      let resolvePrepare: () => void = () => {};
      const prepareGate = new Promise<void>((resolve) => {
        resolvePrepare = resolve;
      });
      const coordinator = createFakeCoordinator({
        prepare: vi.fn().mockImplementation(async () => {
          await prepareGate;
        }),
      });
      const { handleWorkerMessage } = await import('./workerMessages');
      const realEnqueue = createOperationQueue();

      const installPromise = handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'INSTALL_ON_NEXT_LAUNCH' },
        realEnqueue,
        coordinator,
        createFakeReconciler(),
      );
      await vi.waitFor(() => {
        expect(coordinator.prepare).toHaveBeenCalledTimes(1);
      });

      // Discovery replaces available(B) with available(C) while B is preparing.
      persisted = { ...persisted, candidate: { phase: 'available', release: releaseC } };

      resolvePrepare();
      const result = await installPromise;

      expect(result.response).toMatchObject({
        snapshot: expect.objectContaining({ error: 'install-failed' }),
      });
      expect(persisted.candidate).toEqual({ phase: 'available', release: releaseC });
    });

    // Proves completeManualInstall receives the complete captured target
    // (not just a bare releaseNumber): a same-number candidate with
    // different metadata replacing the original while installing must still
    // be rejected as stale, exactly like a different release number.
    it('never approves a same-number candidate whose metadata changed while installing', async () => {
      const releaseBReplaced: ReleaseSummary = { ...releaseB, buildId: 'replaced-build' };
      let persisted: UpdateControllerState = {
        ...baseState,
        candidate: { phase: 'available', release: releaseB },
      };
      readControllerStateMock.mockImplementation(() => ({ status: 'valid', state: persisted }));
      writeControllerStateMock.mockImplementation(
        (_channel: string, state: UpdateControllerState) => {
          persisted = state;
        },
      );
      let resolvePrepare: () => void = () => {};
      const prepareGate = new Promise<void>((resolve) => {
        resolvePrepare = resolve;
      });
      const coordinator = createFakeCoordinator({
        prepare: vi.fn().mockImplementation(async () => {
          await prepareGate;
        }),
      });
      const { handleWorkerMessage } = await import('./workerMessages');
      const realEnqueue = createOperationQueue();

      const installPromise = handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'INSTALL_ON_NEXT_LAUNCH' },
        realEnqueue,
        coordinator,
        createFakeReconciler(),
      );
      await vi.waitFor(() => {
        expect(coordinator.prepare).toHaveBeenCalledTimes(1);
      });

      // Same releaseNumber as the captured target, but different buildId.
      persisted = { ...persisted, candidate: { phase: 'available', release: releaseBReplaced } };

      resolvePrepare();
      const result = await installPromise;

      expect(result.response).toMatchObject({
        snapshot: expect.objectContaining({ error: 'install-failed' }),
      });
      expect(persisted.candidate).toEqual({ phase: 'available', release: releaseBReplaced });
    });

    // Concurrent Manual install: two commands for the same exact release
    // must both resolve as success. The first to complete persists ready(B);
    // the second's completion finds the candidate already ready(B) and must
    // be an idempotent success, never a false install-failed.
    it('resolves both concurrent installs of the same exact target as success, persisting exactly once', async () => {
      let persisted: UpdateControllerState = {
        ...baseState,
        candidate: { phase: 'available', release: releaseB },
      };
      readControllerStateMock.mockImplementation(() => ({ status: 'valid', state: persisted }));
      writeControllerStateMock.mockImplementation(
        (_channel: string, state: UpdateControllerState) => {
          persisted = state;
        },
      );
      let resolvePrepare: () => void = () => {};
      const prepareGate = new Promise<void>((resolve) => {
        resolvePrepare = resolve;
      });
      const coordinator = createFakeCoordinator({
        prepare: vi.fn().mockImplementation(async () => {
          await prepareGate;
        }),
      });
      const { handleWorkerMessage } = await import('./workerMessages');
      const realEnqueue = createOperationQueue();
      const request = {
        protocolVersion: PROTOCOL_VERSION,
        type: 'INSTALL_ON_NEXT_LAUNCH' as const,
      };

      const install1 = handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        request,
        realEnqueue,
        coordinator,
        createFakeReconciler(),
      );
      const install2 = handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        request,
        realEnqueue,
        coordinator,
        createFakeReconciler(),
      );
      await vi.waitFor(() => {
        expect(coordinator.prepare).toHaveBeenCalledTimes(2);
      });

      resolvePrepare();
      const [result1, result2] = await Promise.all([install1, install2]);

      for (const result of [result1, result2]) {
        expect(result.response).toEqual({
          protocolVersion: PROTOCOL_VERSION,
          snapshot: expect.objectContaining({
            candidate: { phase: 'ready', release: releaseB },
            error: undefined,
          }),
        });
      }
      expect(writeControllerStateMock).toHaveBeenCalledTimes(1);
      expect(persisted.candidate).toEqual({ phase: 'ready', release: releaseB });
      // Exactly one of the two completions actually persisted (and
      // broadcasts state-changed as follow-up work); the other is the
      // idempotent already-satisfied completion, which schedules no cleanup
      // and no broadcast at all.
      const definedRunLifetimeWorkCount = [result1, result2].filter(
        (result) => result.runLifetimeWork !== undefined,
      ).length;
      expect(definedRunLifetimeWorkCount).toBe(1);
    });
  });
});
