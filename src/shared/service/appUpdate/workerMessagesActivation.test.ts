import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseSummary, UpdateControllerState } from './contracts';
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

const reportDiagnosticEventMock = vi.fn();
const addTechnicalBreadcrumbMock = vi.fn();
vi.mock('@shared/lib/diagnostics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/lib/diagnostics')>();
  return {
    ...actual,
    reportDiagnosticEvent: (...args: unknown[]) => reportDiagnosticEventMock(...args),
    addTechnicalBreadcrumb: (...args: unknown[]) => addTechnicalBreadcrumbMock(...args),
  };
});

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
  reportDiagnosticEventMock.mockReset();
  addTechnicalBreadcrumbMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('handleWorkerMessage', () => {
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
      expect(reportDiagnosticEventMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'appUpdate.activationRolledBack',
          safeTags: expect.objectContaining({
            trigger: 'bootOkExpired',
            previousActiveReleaseNumber: String(releaseA.releaseNumber),
          }),
        }),
      );
      expect(addTechnicalBreadcrumbMock).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'appUpdate.rollback',
          message: 'rollback durably committed',
          data: { channel: 'stable', trigger: 'bootOkExpired' },
        }),
      );

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
      expect(reportDiagnosticEventMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'appUpdate.activationRolledBack',
          safeTags: expect.objectContaining({
            trigger: 'bootFailed',
            previousActiveReleaseNumber: String(releaseA.releaseNumber),
          }),
        }),
      );
      expect(addTechnicalBreadcrumbMock).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'appUpdate.rollback',
          message: 'watchdog reported boot failure',
          data: { channel: 'stable', releaseNumber: releaseB.releaseNumber },
        }),
      );
      expect(addTechnicalBreadcrumbMock).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'appUpdate.rollback',
          message: 'rollback durably committed',
          data: { channel: 'stable', trigger: 'bootFailed' },
        }),
      );
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
});
