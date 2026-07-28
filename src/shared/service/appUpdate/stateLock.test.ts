import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UpdateControllerState } from './contracts';

const readControllerStateMock = vi.fn();
vi.mock('./controllerState', () => ({
  readControllerState: (...args: unknown[]) => readControllerStateMock(...args),
}));

const baseState: UpdateControllerState = {
  schemaVersion: 1,
  mode: 'manual',
  activeRelease: { releaseId: 'release-a', releaseSequence: 1 },
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

  it('throws when persisted state is absent', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    const { withState } = await import('./stateLock');

    await expect(withState('stable', enqueue, (state) => state)).rejects.toThrow(
      'Controller state is unavailable',
    );
  });

  it('throws when persisted state is invalid', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'invalid' });
    const { withState } = await import('./stateLock');

    await expect(withState('stable', enqueue, (state) => state)).rejects.toThrow(
      'Controller state is unavailable',
    );
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
