import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseSummary, UpdateControllerState } from './contracts';
import { createOperationQueue } from './operationQueue';
import type { PreparationCoordinator } from './preparationCoordinator';
import type { UpdateReconciler } from './updateReconciliation';

const readControllerStateMock = vi.fn();
const writeControllerStateMock = vi.fn();
type MockWindowClient = { type: 'window'; url: string; postMessage: (message: unknown) => void };
const matchAllMock = vi.fn((): Promise<MockWindowClient[]> => Promise.resolve([]));
const fetchLatestReleasePointerMock = vi.fn();
const fetchReleaseDescriptorMock = vi.fn();

vi.mock('./controllerState', () => ({
  readControllerState: (...args: unknown[]) => readControllerStateMock(...args),
  writeControllerState: (...args: unknown[]) => writeControllerStateMock(...args),
}));
vi.mock('./releasePreparation', async () => {
  const actual =
    await vi.importActual<typeof import('./releasePreparation')>('./releasePreparation');
  return {
    ...actual,
    fetchLatestReleasePointer: (...args: unknown[]) => fetchLatestReleasePointerMock(...args),
    fetchReleaseDescriptor: (...args: unknown[]) => fetchReleaseDescriptorMock(...args),
  };
});
vi.stubGlobal('self', { clients: { matchAll: matchAllMock } });
vi.stubGlobal('caches', { keys: vi.fn().mockResolvedValue([]), delete: vi.fn() });

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
  fetchLatestReleasePointerMock.mockReset();
  fetchReleaseDescriptorMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
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

  describe('BOOT_OK', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-24T00:00:00.000Z'));
    });

    it('commits the matching activating candidate before its deadline and acknowledges committed', async () => {
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
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        {
          protocolVersion: PROTOCOL_VERSION,
          type: 'BOOT_OK',
          releaseNumber: releaseB.releaseNumber,
        },
        enqueue,
        createFakeCoordinator(),
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        snapshot: expect.objectContaining({ activeRelease: releaseB, candidate: undefined }),
        ack: 'committed',
      });
    });

    it('acknowledges idempotent rolled-back for a wrong-release BOOT_OK while a different release is activating, without writing or broadcasting', async () => {
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
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        {
          protocolVersion: PROTOCOL_VERSION,
          type: 'BOOT_OK',
          releaseNumber: releaseC.releaseNumber,
        },
        enqueue,
        createFakeCoordinator(),
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        snapshot: expect.anything(),
        ack: 'rolled-back',
      });
      expect(writeControllerStateMock).not.toHaveBeenCalled();
      expect(matchAllMock).not.toHaveBeenCalled();
      expect(result.runLifetimeWork).toBeUndefined();
    });

    it('acknowledges idempotent rolled-back for a stale window reporting BOOT_OK after this release already rolled back', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: { ...baseState, candidate: { phase: 'failed', release: releaseB } },
      });
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        {
          protocolVersion: PROTOCOL_VERSION,
          type: 'BOOT_OK',
          releaseNumber: releaseB.releaseNumber,
        },
        enqueue,
        createFakeCoordinator(),
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        snapshot: expect.anything(),
        ack: 'rolled-back',
      });
      expect(writeControllerStateMock).not.toHaveBeenCalled();
      expect(matchAllMock).not.toHaveBeenCalled();
      expect(result.runLifetimeWork).toBeUndefined();
    });

    it('acknowledges idempotent committed for a repeated BOOT_OK confirming the already-active release, without writing or broadcasting', async () => {
      readControllerStateMock.mockResolvedValue({ status: 'valid', state: baseState });
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        {
          protocolVersion: PROTOCOL_VERSION,
          type: 'BOOT_OK',
          releaseNumber: releaseA.releaseNumber,
        },
        enqueue,
        createFakeCoordinator(),
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        snapshot: expect.anything(),
        ack: 'committed',
      });
      expect(writeControllerStateMock).not.toHaveBeenCalled();
      expect(matchAllMock).not.toHaveBeenCalled();
      expect(result.runLifetimeWork).toBeUndefined();
    });

    it('rolls back a matching BOOT_OK exactly at the deadline, preserving active release and scheduling only a rollback broadcast', async () => {
      vi.setSystemTime(new Date('2026-07-24T00:00:30.000Z'));
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
      const postMessage = vi.fn();
      matchAllMock.mockResolvedValue([
        { type: 'window', url: `${CHANNEL_ORIGIN}/settings`, postMessage },
      ]);
      const coordinator = createFakeCoordinator();
      const runCleanup = vi.spyOn(coordinator, 'runCleanup');
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        {
          protocolVersion: PROTOCOL_VERSION,
          type: 'BOOT_OK',
          releaseNumber: releaseB.releaseNumber,
        },
        enqueue,
        coordinator,
        createFakeReconciler(),
      );

      expect(writeControllerStateMock).toHaveBeenCalledWith(
        'stable',
        expect.objectContaining({
          activeRelease: releaseA,
          candidate: { phase: 'failed', release: releaseB },
        }),
      );
      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        snapshot: expect.objectContaining({
          activeRelease: releaseA,
          candidate: { phase: 'failed', release: releaseB },
        }),
        ack: 'rolled-back',
      });
      expect(result.runLifetimeWork).toBeTypeOf('function');

      await result.runLifetimeWork?.();
      expect(postMessage).toHaveBeenCalledWith({
        protocolVersion: PROTOCOL_VERSION,
        type: 'APP_UPDATE_ROLLBACK',
        releaseNumber: releaseB.releaseNumber,
      });
      expect(runCleanup).not.toHaveBeenCalled();
    });

    it('rolls back a matching BOOT_OK after the deadline', async () => {
      vi.setSystemTime(new Date('2026-07-24T00:00:30.001Z'));
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
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        {
          protocolVersion: PROTOCOL_VERSION,
          type: 'BOOT_OK',
          releaseNumber: releaseB.releaseNumber,
        },
        enqueue,
        createFakeCoordinator(),
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        snapshot: expect.objectContaining({
          activeRelease: releaseA,
          candidate: { phase: 'failed', release: releaseB },
        }),
        ack: 'rolled-back',
      });
    });

    it('acknowledges error, without throwing, when persistence fails', async () => {
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
      writeControllerStateMock.mockRejectedValue(new Error('IndexedDB is unavailable'));
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        {
          protocolVersion: PROTOCOL_VERSION,
          type: 'BOOT_OK',
          releaseNumber: releaseB.releaseNumber,
        },
        enqueue,
        createFakeCoordinator(),
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        snapshot: expect.anything(),
        ack: 'error',
      });
      expect(result.runLifetimeWork).toBeUndefined();
    });

    it('acknowledges error without broadcast or cleanup when expired rollback persistence fails', async () => {
      vi.setSystemTime(new Date('2026-07-24T00:00:30.000Z'));
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
      writeControllerStateMock.mockRejectedValue(new Error('IndexedDB is unavailable'));
      const coordinator = createFakeCoordinator();
      const runCleanup = vi.spyOn(coordinator, 'runCleanup');
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        {
          protocolVersion: PROTOCOL_VERSION,
          type: 'BOOT_OK',
          releaseNumber: releaseB.releaseNumber,
        },
        enqueue,
        coordinator,
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        snapshot: expect.anything(),
        ack: 'error',
      });
      expect(result.runLifetimeWork).toBeUndefined();
      expect(matchAllMock).not.toHaveBeenCalled();
      expect(runCleanup).not.toHaveBeenCalled();
    });

    it('durably commits, producing a same-channel state-invalidation broadcast as follow-up work', async () => {
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
      const postMessage = vi.fn();
      matchAllMock.mockResolvedValue([
        { type: 'window', url: `${CHANNEL_ORIGIN}/settings`, postMessage },
      ]);
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        {
          protocolVersion: PROTOCOL_VERSION,
          type: 'BOOT_OK',
          releaseNumber: releaseB.releaseNumber,
        },
        enqueue,
        createFakeCoordinator(),
        createFakeReconciler(),
      );

      await result.runLifetimeWork?.();
      expect(postMessage).toHaveBeenCalledWith({
        protocolVersion: PROTOCOL_VERSION,
        type: 'APP_UPDATE_STATE_CHANGED',
      });
    });
  });

  describe('BOOT_FAILED', () => {
    it('rolls back to a failed candidate, broadcasts to same-channel windows, and acknowledges rolled-back', async () => {
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
      const postMessage = vi.fn();
      const foreignPostMessage = vi.fn();
      matchAllMock.mockResolvedValue([
        { type: 'window', url: `${CHANNEL_ORIGIN}/settings`, postMessage },
        {
          type: 'window',
          url: `${CHANNEL_ORIGIN}/branch/develop/`,
          postMessage: foreignPostMessage,
        },
      ]);
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        {
          protocolVersion: PROTOCOL_VERSION,
          type: 'BOOT_FAILED',
          releaseNumber: releaseB.releaseNumber,
        },
        enqueue,
        createFakeCoordinator(),
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        snapshot: expect.objectContaining({
          activeRelease: releaseA,
          candidate: { phase: 'failed', release: releaseB },
        }),
        ack: 'rolled-back',
      });
      await result.runLifetimeWork?.();
      expect(postMessage).toHaveBeenCalledWith({
        protocolVersion: PROTOCOL_VERSION,
        type: 'APP_UPDATE_ROLLBACK',
        releaseNumber: releaseB.releaseNumber,
      });
      expect(foreignPostMessage).not.toHaveBeenCalled();
    });

    it('isolates one matching client throwing from postMessage: delivery still reaches every other matching client', async () => {
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
      const throwingPostMessage = vi.fn(() => {
        throw new Error('client transport closed');
      });
      const secondPostMessage = vi.fn();
      matchAllMock.mockResolvedValue([
        {
          type: 'window',
          url: `${CHANNEL_ORIGIN}/settings`,
          postMessage: throwingPostMessage,
        },
        { type: 'window', url: `${CHANNEL_ORIGIN}/`, postMessage: secondPostMessage },
      ]);
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        {
          protocolVersion: PROTOCOL_VERSION,
          type: 'BOOT_FAILED',
          releaseNumber: releaseB.releaseNumber,
        },
        enqueue,
        createFakeCoordinator(),
        createFakeReconciler(),
      );

      await expect(result.runLifetimeWork?.()).resolves.toBeUndefined();
      expect(throwingPostMessage).toHaveBeenCalledOnce();
      expect(secondPostMessage).toHaveBeenCalledWith({
        protocolVersion: PROTOCOL_VERSION,
        type: 'APP_UPDATE_ROLLBACK',
        releaseNumber: releaseB.releaseNumber,
      });
    });

    it('acknowledges idempotent rolled-back for a non-matching, non-active release number, without writing or broadcasting', async () => {
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'BOOT_FAILED', releaseNumber: 999 },
        enqueue,
        createFakeCoordinator(),
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        snapshot: expect.anything(),
        ack: 'rolled-back',
      });
      expect(matchAllMock).not.toHaveBeenCalled();
      expect(writeControllerStateMock).not.toHaveBeenCalled();
      expect(result.runLifetimeWork).toBeUndefined();
    });

    it('acknowledges ignored (existing non-activation no-op) for a BOOT_FAILED matching the current activeRelease, which is not an activation target', async () => {
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        {
          protocolVersion: PROTOCOL_VERSION,
          type: 'BOOT_FAILED',
          releaseNumber: releaseA.releaseNumber,
        },
        enqueue,
        createFakeCoordinator(),
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        snapshot: expect.anything(),
        ack: 'ignored',
      });
      expect(matchAllMock).not.toHaveBeenCalled();
      expect(writeControllerStateMock).not.toHaveBeenCalled();
      expect(result.runLifetimeWork).toBeUndefined();
    });
  });

  describe('GET_ACTIVATION_STATUS', () => {
    it('reports the target and deadline when this release is activating', async () => {
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
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        {
          protocolVersion: PROTOCOL_VERSION,
          type: 'GET_ACTIVATION_STATUS',
          releaseNumber: releaseB.releaseNumber,
        },
        enqueue,
        createFakeCoordinator(),
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        isActivationTarget: true,
        deadlineAt: '2026-07-24T00:00:30.000Z',
      });
    });

    it('reports false when this release is not the activation target', async () => {
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        {
          protocolVersion: PROTOCOL_VERSION,
          type: 'GET_ACTIVATION_STATUS',
          releaseNumber: releaseA.releaseNumber,
        },
        enqueue,
        createFakeCoordinator(),
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        isActivationTarget: false,
      });
    });
  });

  describe('RECOVER_INSTALL_LATEST', () => {
    const descriptorFor = (summary: ReleaseSummary) => ({
      schemaVersion: 1 as const,
      ...summary,
      indexSha256: '0'.repeat(64),
      indexByteSize: 100,
      files: [{ path: 'assets/app.js', sha256: '0'.repeat(64), byteSize: 3 }],
    });

    it.each(['absent', 'invalid'] as const)(
      'never throws for %s persisted state, unlike every withState()-routed command',
      async (status) => {
        readControllerStateMock.mockResolvedValue(
          status === 'invalid'
            ? { status: 'invalid', reason: 'MALFORMED_RECORD' }
            : { status: 'absent' },
        );
        fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: releaseA.releaseNumber });
        fetchReleaseDescriptorMock.mockResolvedValue(descriptorFor(releaseA));
        const { handleWorkerMessage } = await import('./workerMessages');

        const result = await handleWorkerMessage(
          'stable',
          '/',
          CHANNEL_ORIGIN,
          { protocolVersion: PROTOCOL_VERSION, type: 'RECOVER_INSTALL_LATEST' },
          enqueue,
          createFakeCoordinator(),
          createFakeReconciler(),
        );

        expect(result.response).toEqual({ protocolVersion: PROTOCOL_VERSION, result: 'success' });
      },
    );

    it('responds with the stable result code, never a snapshot, and schedules cleanup plus a state-changed broadcast only on success', async () => {
      fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: releaseA.releaseNumber });
      fetchReleaseDescriptorMock.mockResolvedValue(descriptorFor(releaseA));
      const coordinator = createFakeCoordinator();
      const runCleanup = vi.spyOn(coordinator, 'runCleanup');
      const postMessage = vi.fn();
      matchAllMock.mockResolvedValue([
        { type: 'window', url: `${CHANNEL_ORIGIN}/settings`, postMessage },
      ]);
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'RECOVER_INSTALL_LATEST' },
        enqueue,
        coordinator,
        createFakeReconciler(),
      );

      expect(result.response).toEqual({ protocolVersion: PROTOCOL_VERSION, result: 'success' });
      expect(result.runLifetimeWork).toBeTypeOf('function');

      await result.runLifetimeWork?.();
      expect(runCleanup).toHaveBeenCalledTimes(1);
      expect(postMessage).toHaveBeenCalledWith({
        protocolVersion: PROTOCOL_VERSION,
        type: 'APP_UPDATE_STATE_CHANGED',
      });
    });

    it('carries no follow-up work for a non-success result with no possible orphaned cache', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: { ...baseState, activeRelease: releaseB },
      });
      fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: releaseA.releaseNumber });
      fetchReleaseDescriptorMock.mockResolvedValue(descriptorFor(releaseA));
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'RECOVER_INSTALL_LATEST' },
        enqueue,
        createFakeCoordinator(),
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        result: 'latest-older-than-active',
      });
      expect(result.runLifetimeWork).toBeUndefined();
    });

    it('schedules best-effort cache cleanup, without a state-changed broadcast, for state-changed: a fully prepared release may now be unowned', async () => {
      readControllerStateMock.mockResolvedValueOnce({ status: 'absent' }).mockResolvedValueOnce({
        status: 'valid',
        state: { ...baseState, activeRelease: releaseC },
      });
      fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: releaseB.releaseNumber });
      fetchReleaseDescriptorMock.mockResolvedValue(descriptorFor(releaseB));
      const coordinator = createFakeCoordinator();
      const runCleanup = vi.spyOn(coordinator, 'runCleanup');
      const postMessage = vi.fn();
      matchAllMock.mockResolvedValue([
        { type: 'window', url: `${CHANNEL_ORIGIN}/settings`, postMessage },
      ]);
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'RECOVER_INSTALL_LATEST' },
        enqueue,
        coordinator,
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        result: 'state-changed',
      });
      expect(result.runLifetimeWork).toBeTypeOf('function');

      await result.runLifetimeWork?.();
      expect(runCleanup).toHaveBeenCalledTimes(1);
      expect(postMessage).not.toHaveBeenCalled();
    });

    it('schedules best-effort cache cleanup, without a state-changed broadcast, for conflicting-release-identity', async () => {
      readControllerStateMock.mockResolvedValue({ status: 'valid', state: baseState });
      fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: releaseA.releaseNumber });
      fetchReleaseDescriptorMock.mockResolvedValue(
        descriptorFor({ ...releaseA, buildId: 'conflicting-build' }),
      );
      const coordinator = createFakeCoordinator();
      const runCleanup = vi.spyOn(coordinator, 'runCleanup');
      const postMessage = vi.fn();
      matchAllMock.mockResolvedValue([
        { type: 'window', url: `${CHANNEL_ORIGIN}/settings`, postMessage },
      ]);
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'RECOVER_INSTALL_LATEST' },
        enqueue,
        coordinator,
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        result: 'conflicting-release-identity',
      });
      expect(result.runLifetimeWork).toBeTypeOf('function');

      await result.runLifetimeWork?.();
      expect(runCleanup).toHaveBeenCalledTimes(1);
      expect(postMessage).not.toHaveBeenCalled();
    });

    it('schedules best-effort cache cleanup, without a state-changed broadcast, for controller-state-persistence-failed', async () => {
      readControllerStateMock.mockResolvedValue({ status: 'absent' });
      fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: releaseB.releaseNumber });
      fetchReleaseDescriptorMock.mockResolvedValue(descriptorFor(releaseB));
      writeControllerStateMock.mockRejectedValue(new Error('quota exceeded'));
      const coordinator = createFakeCoordinator();
      const runCleanup = vi.spyOn(coordinator, 'runCleanup');
      const postMessage = vi.fn();
      matchAllMock.mockResolvedValue([
        { type: 'window', url: `${CHANNEL_ORIGIN}/settings`, postMessage },
      ]);
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'RECOVER_INSTALL_LATEST' },
        enqueue,
        coordinator,
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        result: 'controller-state-persistence-failed',
      });
      expect(result.runLifetimeWork).toBeTypeOf('function');

      await result.runLifetimeWork?.();
      expect(runCleanup).toHaveBeenCalledTimes(1);
      expect(postMessage).not.toHaveBeenCalled();
    });

    it('a rejecting cleanup never replaces or throws past the already-classified response', async () => {
      readControllerStateMock.mockResolvedValue({ status: 'absent' });
      fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: releaseB.releaseNumber });
      fetchReleaseDescriptorMock.mockResolvedValue(descriptorFor(releaseB));
      writeControllerStateMock.mockRejectedValue(new Error('quota exceeded'));
      const coordinator = createFakeCoordinator({
        runCleanup: vi.fn().mockRejectedValue(new Error('cleanup failed')),
      });
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'RECOVER_INSTALL_LATEST' },
        enqueue,
        coordinator,
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        result: 'controller-state-persistence-failed',
      });
      await expect(result.runLifetimeWork?.()).resolves.toBeUndefined();
    });
  });
});
