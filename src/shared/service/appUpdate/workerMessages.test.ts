import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UpdateControllerState } from './contracts';
import type { PreparationCoordinator } from './preparationCoordinator';

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

const baseState: UpdateControllerState = {
  schemaVersion: 1,
  mode: 'manual',
  activeRelease: { releaseId: 'release-a', releaseSequence: 1 },
};

const CHANNEL_ORIGIN = 'https://mioframe.example';

const enqueue = <T>(operation: () => Promise<T>): Promise<T> => operation();

function createFakeCoordinator(
  overrides: Partial<PreparationCoordinator> = {},
): PreparationCoordinator {
  return {
    prepare: vi.fn().mockResolvedValue(undefined),
    getInFlightReleaseIds: () => [],
    runCleanup: (cleanup) => cleanup([]),
    ...overrides,
  };
}

describe('handleWorkerMessage', () => {
  beforeEach(() => {
    readControllerStateMock.mockReset();
    writeControllerStateMock.mockReset();
    matchAllMock.mockClear();
    readControllerStateMock.mockResolvedValue({ status: 'valid', state: baseState });
  });

  it('throws when persisted state is not valid', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    const { handleWorkerMessage } = await import('./workerMessages');

    await expect(
      handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { type: 'GET_SNAPSHOT' },
        enqueue,
        createFakeCoordinator(),
      ),
    ).rejects.toThrow('Controller state is unavailable');
  });

  it('GET_SNAPSHOT returns the current state as a snapshot without writing', async () => {
    const { handleWorkerMessage } = await import('./workerMessages');
    const result = await handleWorkerMessage(
      'stable',
      '/',
      CHANNEL_ORIGIN,
      { type: 'GET_SNAPSHOT' },
      enqueue,
      createFakeCoordinator(),
    );

    expect(result).toEqual({ snapshot: expect.objectContaining({ mode: 'manual' }) });
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('CANCEL_SCHEDULED_UPDATE clears an approved release and persists it', async () => {
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: { ...baseState, approvedRelease: { releaseId: 'release-b', releaseSequence: 2 } },
    });
    const { handleWorkerMessage } = await import('./workerMessages');

    const result = await handleWorkerMessage(
      'stable',
      '/',
      CHANNEL_ORIGIN,
      { type: 'CANCEL_SCHEDULED_UPDATE' },
      enqueue,
      createFakeCoordinator(),
    );

    expect(result).toEqual({ snapshot: expect.objectContaining({ scheduledRelease: undefined }) });
    expect(writeControllerStateMock).toHaveBeenCalledTimes(1);
    const call = writeControllerStateMock.mock.calls[0];
    if (!call) throw new Error('Expected writeControllerState to have been called');
    const [writtenChannel, writtenState] = call;
    expect(writtenChannel).toBe('stable');
    expect(writtenState).not.toHaveProperty('approvedRelease');
  });

  describe('SET_MODE', () => {
    it('to manual clears an unstarted approval and persists it', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: {
          ...baseState,
          mode: 'automatic',
          approvedRelease: { releaseId: 'release-b', releaseSequence: 2 },
        },
      });
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { type: 'SET_MODE', mode: 'manual' },
        enqueue,
        createFakeCoordinator(),
      );

      expect(result).toEqual({
        snapshot: expect.objectContaining({ mode: 'manual', scheduledRelease: undefined }),
      });
    });

    it('to automatic with nothing newer than active does not prepare anything', async () => {
      const coordinator = createFakeCoordinator();
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { type: 'SET_MODE', mode: 'automatic' },
        enqueue,
        coordinator,
      );

      expect(result).toEqual({ snapshot: expect.objectContaining({ mode: 'automatic' }) });
      expect(coordinator.prepare).not.toHaveBeenCalled();
    });

    it('to automatic prepares and approves a newer known release', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: { ...baseState, latestRelease: { releaseId: 'release-b', releaseSequence: 2 } },
      });
      const coordinator = createFakeCoordinator();
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { type: 'SET_MODE', mode: 'automatic' },
        enqueue,
        coordinator,
      );

      expect(coordinator.prepare).toHaveBeenCalledWith('stable', '/', {
        releaseId: 'release-b',
        releaseSequence: 2,
      });
      expect(result).toEqual({
        snapshot: expect.objectContaining({
          scheduledRelease: { releaseId: 'release-b', releaseSequence: 2 },
        }),
      });
    });

    it('to automatic during an active activation switches mode without preparing or approving', async () => {
      const activation = {
        targetRelease: { releaseId: 'release-c', releaseSequence: 3 },
        deadlineAt: '2026-07-24T00:00:30.000Z',
      };
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: {
          ...baseState,
          latestRelease: { releaseId: 'release-b', releaseSequence: 2 },
          activation,
        },
      });
      const coordinator = createFakeCoordinator();
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { type: 'SET_MODE', mode: 'automatic' },
        enqueue,
        coordinator,
      );

      expect(coordinator.prepare).not.toHaveBeenCalled();
      expect(result).toEqual({
        snapshot: expect.objectContaining({ mode: 'automatic', scheduledRelease: undefined }),
      });
    });

    it('to automatic reports install-failed when preparation fails, without approving', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: { ...baseState, latestRelease: { releaseId: 'release-b', releaseSequence: 2 } },
      });
      const coordinator = createFakeCoordinator({
        prepare: vi.fn().mockRejectedValue(new Error('offline')),
      });
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { type: 'SET_MODE', mode: 'automatic' },
        enqueue,
        coordinator,
      );

      expect(result).toEqual({
        snapshot: expect.objectContaining({ scheduledRelease: undefined, error: 'install-failed' }),
      });
    });
  });

  describe('INSTALL_ON_NEXT_LAUNCH', () => {
    it('reports unavailable when there is no known latest release', async () => {
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { type: 'INSTALL_ON_NEXT_LAUNCH' },
        enqueue,
        createFakeCoordinator(),
      );

      expect(result).toEqual({ snapshot: expect.objectContaining({ error: 'unavailable' }) });
    });

    it('prepares and approves the latest known release', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: { ...baseState, latestRelease: { releaseId: 'release-b', releaseSequence: 2 } },
      });
      const coordinator = createFakeCoordinator();
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { type: 'INSTALL_ON_NEXT_LAUNCH' },
        enqueue,
        coordinator,
      );

      expect(coordinator.prepare).toHaveBeenCalledWith('stable', '/', {
        releaseId: 'release-b',
        releaseSequence: 2,
      });
      expect(result).toEqual({
        snapshot: expect.objectContaining({
          scheduledRelease: { releaseId: 'release-b', releaseSequence: 2 },
        }),
      });
    });

    it('reports install-failed when preparation fails', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: { ...baseState, latestRelease: { releaseId: 'release-b', releaseSequence: 2 } },
      });
      const coordinator = createFakeCoordinator({
        prepare: vi.fn().mockRejectedValue(new Error('offline')),
      });
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { type: 'INSTALL_ON_NEXT_LAUNCH' },
        enqueue,
        coordinator,
      );

      expect(result).toEqual({
        snapshot: expect.objectContaining({ scheduledRelease: undefined, error: 'install-failed' }),
      });
    });

    it('is a no-op, without preparing, while an activation is already in progress', async () => {
      const activation = {
        targetRelease: { releaseId: 'release-c', releaseSequence: 3 },
        deadlineAt: '2026-07-24T00:00:30.000Z',
      };
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: {
          ...baseState,
          latestRelease: { releaseId: 'release-b', releaseSequence: 2 },
          activation,
        },
      });
      const coordinator = createFakeCoordinator();
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { type: 'INSTALL_ON_NEXT_LAUNCH' },
        enqueue,
        coordinator,
      );

      expect(coordinator.prepare).not.toHaveBeenCalled();
      expect(result).toEqual({
        snapshot: expect.objectContaining({ scheduledRelease: undefined }),
      });
    });

    it('does not approve a release superseded by a newer discovery while preparing', async () => {
      readControllerStateMock
        .mockResolvedValueOnce({
          status: 'valid',
          state: { ...baseState, latestRelease: { releaseId: 'release-b', releaseSequence: 2 } },
        })
        .mockResolvedValueOnce({
          status: 'valid',
          state: { ...baseState, latestRelease: { releaseId: 'release-c', releaseSequence: 3 } },
        });
      const coordinator = createFakeCoordinator();
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { type: 'INSTALL_ON_NEXT_LAUNCH' },
        enqueue,
        coordinator,
      );

      expect(result).toEqual({
        snapshot: expect.objectContaining({ scheduledRelease: undefined, error: 'install-failed' }),
      });
    });
  });

  describe('BOOT_OK', () => {
    it('commits the matching activation target and acknowledges committed', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: {
          ...baseState,
          approvedRelease: { releaseId: 'release-b', releaseSequence: 2 },
          activation: {
            targetRelease: { releaseId: 'release-b', releaseSequence: 2 },
            deadlineAt: '2026-07-24T00:00:30.000Z',
          },
        },
      });
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { type: 'BOOT_OK', releaseId: 'release-b' },
        enqueue,
        createFakeCoordinator(),
      );

      expect(result).toEqual({
        snapshot: expect.objectContaining({
          activeRelease: { releaseId: 'release-b', releaseSequence: 2 },
        }),
        ack: 'committed',
      });
    });

    it('clears a matching recorded failure on a successful retry', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: {
          ...baseState,
          approvedRelease: { releaseId: 'release-b', releaseSequence: 2 },
          activation: {
            targetRelease: { releaseId: 'release-b', releaseSequence: 2 },
            deadlineAt: '2026-07-24T00:00:30.000Z',
          },
          failedActivationRelease: { releaseId: 'release-b', releaseSequence: 2 },
        },
      });
      const { handleWorkerMessage } = await import('./workerMessages');

      await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { type: 'BOOT_OK', releaseId: 'release-b' },
        enqueue,
        createFakeCoordinator(),
      );

      const call = writeControllerStateMock.mock.calls[0];
      if (!call) throw new Error('Expected writeControllerState to have been called');
      const [, writtenState] = call;
      expect(writtenState).not.toHaveProperty('failedActivationRelease');
    });

    it('acknowledges ignored for a non-matching release id, without writing', async () => {
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { type: 'BOOT_OK', releaseId: 'unknown' },
        enqueue,
        createFakeCoordinator(),
      );

      expect(result).toEqual({ snapshot: expect.anything(), ack: 'ignored' });
      expect(writeControllerStateMock).not.toHaveBeenCalled();
    });

    it('acknowledges error, without throwing, when persistence fails', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: {
          ...baseState,
          approvedRelease: { releaseId: 'release-b', releaseSequence: 2 },
          activation: {
            targetRelease: { releaseId: 'release-b', releaseSequence: 2 },
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
        { type: 'BOOT_OK', releaseId: 'release-b' },
        enqueue,
        createFakeCoordinator(),
      );

      expect(result).toEqual({ snapshot: expect.anything(), ack: 'error' });
    });
  });

  describe('BOOT_FAILED', () => {
    it('rolls back, broadcasts to same-channel windows, and acknowledges rolled-back', async () => {
      const activation = {
        targetRelease: { releaseId: 'release-b', releaseSequence: 2 },
        deadlineAt: '2026-07-24T00:00:30.000Z',
      };
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: { ...baseState, approvedRelease: activation.targetRelease, activation },
      });
      const postMessage = vi.fn();
      const foreignPostMessage = vi.fn();
      matchAllMock.mockResolvedValue([
        { type: 'window', url: 'https://mioframe.example/settings', postMessage },
        {
          type: 'window',
          url: 'https://mioframe.example/branch/develop/',
          postMessage: foreignPostMessage,
        },
      ]);
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { type: 'BOOT_FAILED', releaseId: 'release-b' },
        enqueue,
        createFakeCoordinator(),
      );

      expect(result).toEqual({
        snapshot: expect.objectContaining({ activeRelease: baseState.activeRelease }),
        ack: 'rolled-back',
      });
      expect(postMessage).toHaveBeenCalledWith({
        type: 'APP_UPDATE_ROLLBACK',
        releaseId: 'release-b',
      });
      expect(foreignPostMessage).not.toHaveBeenCalled();
    });

    it('persists the failed release as the single failedActivationRelease record', async () => {
      const activation = {
        targetRelease: { releaseId: 'release-b', releaseSequence: 2 },
        deadlineAt: '2026-07-24T00:00:30.000Z',
      };
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: { ...baseState, approvedRelease: activation.targetRelease, activation },
      });
      const { handleWorkerMessage } = await import('./workerMessages');

      await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { type: 'BOOT_FAILED', releaseId: 'release-b' },
        enqueue,
        createFakeCoordinator(),
      );

      const call = writeControllerStateMock.mock.calls[0];
      if (!call) throw new Error('Expected writeControllerState to have been called');
      const [, writtenState] = call;
      expect(writtenState).toMatchObject({
        activeRelease: baseState.activeRelease,
        failedActivationRelease: activation.targetRelease,
      });
    });

    it('acknowledges ignored for a non-matching release id, without writing or broadcasting', async () => {
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { type: 'BOOT_FAILED', releaseId: 'unknown' },
        enqueue,
        createFakeCoordinator(),
      );

      expect(result).toEqual({ snapshot: expect.anything(), ack: 'ignored' });
      expect(matchAllMock).not.toHaveBeenCalled();
      expect(writeControllerStateMock).not.toHaveBeenCalled();
    });

    it('acknowledges error and does not broadcast when rollback persistence fails', async () => {
      const activation = {
        targetRelease: { releaseId: 'release-b', releaseSequence: 2 },
        deadlineAt: '2026-07-24T00:00:30.000Z',
      };
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: { ...baseState, approvedRelease: activation.targetRelease, activation },
      });
      writeControllerStateMock.mockRejectedValue(new Error('IndexedDB is unavailable'));
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { type: 'BOOT_FAILED', releaseId: 'release-b' },
        enqueue,
        createFakeCoordinator(),
      );

      expect(result).toEqual({ snapshot: expect.anything(), ack: 'error' });
      expect(matchAllMock).not.toHaveBeenCalled();
    });
  });

  describe('GET_ACTIVATION_STATUS', () => {
    it('reports the target and deadline when this release is the activation target', async () => {
      const activation = {
        targetRelease: { releaseId: 'release-b', releaseSequence: 2 },
        deadlineAt: '2026-07-24T00:00:30.000Z',
      };
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: { ...baseState, activation },
      });
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { type: 'GET_ACTIVATION_STATUS', releaseId: 'release-b' },
        enqueue,
        createFakeCoordinator(),
      );

      expect(result).toEqual({ isActivationTarget: true, deadlineAt: '2026-07-24T00:00:30.000Z' });
    });

    it('reports false when this release is not the activation target', async () => {
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { type: 'GET_ACTIVATION_STATUS', releaseId: 'release-a' },
        enqueue,
        createFakeCoordinator(),
      );

      expect(result).toEqual({ isActivationTarget: false });
    });

    it('reports false when there is no activation at all', async () => {
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { type: 'GET_ACTIVATION_STATUS', releaseId: 'release-b' },
        enqueue,
        createFakeCoordinator(),
      );

      expect(result).toEqual({ isActivationTarget: false });
    });
  });
});
