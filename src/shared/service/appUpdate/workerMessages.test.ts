import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UpdateControllerState } from './contracts';

const readControllerStateMock = vi.fn();
const writeControllerStateMock = vi.fn();
const matchAllMock = vi.fn(
  (): Promise<{ postMessage: (message: unknown) => void }[]> => Promise.resolve([]),
);

vi.mock('./controllerState', () => ({
  readControllerState: (...args: unknown[]) => readControllerStateMock(...args),
  writeControllerState: (...args: unknown[]) => writeControllerStateMock(...args),
}));
vi.stubGlobal('self', { clients: { matchAll: matchAllMock } });

const baseState: UpdateControllerState = {
  schemaVersion: 1,
  mode: 'manual',
  activeRelease: { releaseId: 'release-a', releaseSequence: 1 },
  failedReleaseIds: [],
};

const enqueue = <T>(operation: () => Promise<T>): Promise<T> => operation();

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
      handleWorkerMessage('stable', '/', { type: 'GET_SNAPSHOT' }, enqueue),
    ).rejects.toThrow('Controller state is unavailable');
  });

  it('GET_SNAPSHOT returns the current state as a snapshot without writing', async () => {
    const { handleWorkerMessage } = await import('./workerMessages');
    const result = await handleWorkerMessage('stable', '/', { type: 'GET_SNAPSHOT' }, enqueue);

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
      { type: 'CANCEL_SCHEDULED_UPDATE' },
      enqueue,
    );

    expect(result).toEqual({ snapshot: expect.objectContaining({ scheduledRelease: undefined }) });
    expect(writeControllerStateMock).toHaveBeenCalledTimes(1);
    const call = writeControllerStateMock.mock.calls[0];
    if (!call) throw new Error('Expected writeControllerState to have been called');
    const [writtenChannel, writtenState] = call;
    expect(writtenChannel).toBe('stable');
    expect(writtenState).not.toHaveProperty('approvedRelease');
  });

  it('BOOT_OK commits the matching activation target', async () => {
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: {
        ...baseState,
        approvedRelease: { releaseId: 'release-b', releaseSequence: 2 },
        activation: {
          targetRelease: { releaseId: 'release-b', releaseSequence: 2 },
          previousRelease: baseState.activeRelease,
          startedAt: '2026-07-24T00:00:00.000Z',
          deadlineAt: '2026-07-24T00:00:30.000Z',
        },
      },
    });
    const { handleWorkerMessage } = await import('./workerMessages');

    const result = await handleWorkerMessage(
      'stable',
      '/',
      { type: 'BOOT_OK', releaseId: 'release-b' },
      enqueue,
    );

    expect(result).toEqual({
      snapshot: expect.objectContaining({
        activeRelease: { releaseId: 'release-b', releaseSequence: 2 },
      }),
    });
  });

  it('BOOT_FAILED rolls back and broadcasts to same-channel windows', async () => {
    const activation = {
      targetRelease: { releaseId: 'release-b', releaseSequence: 2 },
      previousRelease: baseState.activeRelease,
      startedAt: '2026-07-24T00:00:00.000Z',
      deadlineAt: '2026-07-24T00:00:30.000Z',
    };
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: {
        ...baseState,
        approvedRelease: activation.targetRelease,
        activation,
      },
    });
    const postMessage = vi.fn();
    matchAllMock.mockResolvedValue([{ postMessage }]);
    const { handleWorkerMessage } = await import('./workerMessages');

    const result = await handleWorkerMessage(
      'stable',
      '/',
      { type: 'BOOT_FAILED', releaseId: 'release-b' },
      enqueue,
    );

    expect(result).toEqual({
      snapshot: expect.objectContaining({ activeRelease: baseState.activeRelease }),
    });
    expect(postMessage).toHaveBeenCalledWith({
      type: 'APP_UPDATE_ROLLBACK',
      releaseId: 'release-b',
    });
  });

  it('BOOT_FAILED for a non-matching release id is ignored and does not broadcast', async () => {
    const { handleWorkerMessage } = await import('./workerMessages');

    await handleWorkerMessage(
      'stable',
      '/',
      { type: 'BOOT_FAILED', releaseId: 'unknown' },
      enqueue,
    );

    expect(matchAllMock).not.toHaveBeenCalled();
    expect(writeControllerStateMock).toHaveBeenCalledWith('stable', baseState);
  });

  describe('GET_ACTIVATION_STATUS', () => {
    it('reports the target and deadline when this release is the activation target', async () => {
      const activation = {
        targetRelease: { releaseId: 'release-b', releaseSequence: 2 },
        previousRelease: baseState.activeRelease,
        startedAt: '2026-07-24T00:00:00.000Z',
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
        { type: 'GET_ACTIVATION_STATUS', releaseId: 'release-b' },
        enqueue,
      );

      expect(result).toEqual({ isActivationTarget: true, deadlineAt: '2026-07-24T00:00:30.000Z' });
    });

    it('reports false when this release is not the activation target', async () => {
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        { type: 'GET_ACTIVATION_STATUS', releaseId: 'release-a' },
        enqueue,
      );

      expect(result).toEqual({ isActivationTarget: false });
    });

    it('reports false when there is no activation at all', async () => {
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        { type: 'GET_ACTIVATION_STATUS', releaseId: 'release-b' },
        enqueue,
      );

      expect(result).toEqual({ isActivationTarget: false });
    });
  });
});
