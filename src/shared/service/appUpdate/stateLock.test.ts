import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UpdateControllerState } from './contracts';

const readControllerStateMock = vi.fn();
vi.mock('./controllerState', () => ({
  readControllerState: (...args: unknown[]) => readControllerStateMock(...args),
}));

const baseState: UpdateControllerState = {
  schemaVersion: 1,
  mode: 'manual',
  activeRelease: {
    releaseNumber: 1,
    appVersion: '1.0.0',
    buildId: 'build-a',
    buildDate: '2026-07-24T00:00:00.000Z',
  },
};

const enqueue = <T>(operation: () => Promise<T>): Promise<T> => operation();

describe('withState', () => {
  beforeEach(() => {
    readControllerStateMock.mockReset();
  });

  it('runs fn against the current valid state', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'valid', state: baseState });
    const { withState } = await import('./stateLock');

    const result = await withState('stable', enqueue, (state) => state.mode);

    expect(result).toBe('manual');
  });

  it('throws a classified ABSENT error when persisted state is absent', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    const { withState, isControllerStateUnavailableError, ControllerStateUnavailableReason } =
      await import('./stateLock');

    let caught: unknown;
    try {
      await withState('stable', enqueue, (state) => state);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(Error);
    if (!isControllerStateUnavailableError(caught)) {
      throw new Error('Expected a classified controller-state-unavailable error');
    }
    expect(caught.message).toContain('Controller state is unavailable');
    expect(caught.code).toBe(ControllerStateUnavailableReason.ABSENT);
  });

  it('throws a classified INVALID error when persisted state is invalid', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'invalid' });
    const { withState, isControllerStateUnavailableError, ControllerStateUnavailableReason } =
      await import('./stateLock');

    let caught: unknown;
    try {
      await withState('stable', enqueue, (state) => state);
    } catch (error) {
      caught = error;
    }

    if (!isControllerStateUnavailableError(caught)) {
      throw new Error('Expected a classified controller-state-unavailable error');
    }
    expect(caught.code).toBe(ControllerStateUnavailableReason.INVALID);
  });

  it('throws a classified STORAGE_UNAVAILABLE error when persisted state is storage-unavailable', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'storage-unavailable' });
    const { withState, isControllerStateUnavailableError, ControllerStateUnavailableReason } =
      await import('./stateLock');

    let caught: unknown;
    try {
      await withState('stable', enqueue, (state) => state);
    } catch (error) {
      caught = error;
    }

    if (!isControllerStateUnavailableError(caught)) {
      throw new Error('Expected a classified controller-state-unavailable error');
    }
    expect(caught.code).toBe(ControllerStateUnavailableReason.STORAGE_UNAVAILABLE);
  });

  it('isControllerStateUnavailableError never misclassifies an unrelated error', async () => {
    const { isControllerStateUnavailableError } = await import('./stateLock');

    expect(isControllerStateUnavailableError(new Error('unrelated'))).toBe(false);
    expect(isControllerStateUnavailableError(undefined)).toBe(false);
  });

  it('serializes through the provided operation queue', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'valid', state: baseState });
    const { withState } = await import('./stateLock');
    const order: string[] = [];
    let tail = Promise.resolve();
    const serializingEnqueue = <T>(operation: () => Promise<T>): Promise<T> => {
      const result = tail.then(operation);
      tail = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    };

    await Promise.all([
      withState('stable', serializingEnqueue, async () => {
        order.push('start-1');
        await new Promise((resolve) => setTimeout(resolve, 5));
        order.push('end-1');
      }),
      withState('stable', serializingEnqueue, () => {
        order.push('start-2');
        order.push('end-2');
      }),
    ]);

    expect(order).toEqual(['start-1', 'end-1', 'start-2', 'end-2']);
  });
});
