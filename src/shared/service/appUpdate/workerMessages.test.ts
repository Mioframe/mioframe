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
    checkForUpdates: vi.fn().mockResolvedValue({ mode: 'manual', activeRelease: releaseA }),
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
    const checkForUpdates = vi.fn().mockResolvedValue(finalSnapshot);
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
  });

  describe('BOOT_OK', () => {
    it('commits the matching activating candidate and acknowledges committed', async () => {
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

    it('acknowledges ignored for a non-matching release number, without writing', async () => {
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'BOOT_OK', releaseNumber: 999 },
        enqueue,
        createFakeCoordinator(),
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        snapshot: expect.anything(),
        ack: 'ignored',
      });
      expect(writeControllerStateMock).not.toHaveBeenCalled();
      expect(result.runLifetimeWork).toBeUndefined();
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

    it('acknowledges ignored for a non-matching release number, without writing or broadcasting', async () => {
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
});
