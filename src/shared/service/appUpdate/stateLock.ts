import type { ManagedChannel, UpdateControllerState } from './contracts';
import { readControllerState } from './controllerState';
import type { OperationQueue } from './operationQueue';

/**
 * Runs `fn` against the current persisted state, serialized through this
 * channel's short state lock (`enqueue`).
 *
 * `fn` must only read, validate, decide, and persist — never perform a
 * network fetch, a full-cache scan, hashing, or a multi-file copy. Those
 * must run outside this lock (via a {@link PreparationCoordinator} or fired
 * off unlocked), so a long release download never blocks navigation or
 * other protocol requests waiting on the same lock.
 * @param channel - Managed channel.
 * @param enqueue - The channel's serialized operation queue.
 * @param fn - Runs against the current valid state.
 * @returns Whatever `fn` returns.
 * @throws When persisted state is absent or invalid.
 */
export async function withState<T>(
  channel: ManagedChannel,
  enqueue: OperationQueue,
  fn: (state: UpdateControllerState) => T | Promise<T>,
): Promise<T> {
  return enqueue(async () => {
    const read = await readControllerState(channel);
    if (read.status !== 'valid') {
      throw new Error('Controller state is unavailable; cannot handle worker protocol request');
    }
    return fn(read.state);
  });
}
