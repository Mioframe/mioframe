import { DomainError } from '@shared/lib/error';
import type { ManagedChannel, UpdateControllerState } from './contracts';
import { readControllerState, type ControllerStateReadResult } from './controllerState';
import type { OperationQueue } from './operationQueue';

/**
 * Stable classification for {@link withState}'s own "state not ready"
 * outcome, mirroring `readControllerState()`'s own {@link ControllerStateReadResult}
 * statuses other than `'valid'`. Never a new diagnostic in itself:
 * `readControllerState()` is already the single diagnostic owner for a raw
 * storage read failure (`STORAGE_UNAVAILABLE`), and `ABSENT`/`INVALID` are
 * expected classified states, not failures — see {@link isControllerStateUnavailableError}.
 */
export enum ControllerStateUnavailableReason {
  ABSENT = 'ABSENT',
  INVALID = 'INVALID',
  STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE',
}

const CONTROLLER_STATE_UNAVAILABLE_REASON_VALUES = new Set<string>(
  Object.values(ControllerStateUnavailableReason),
);

/**
 * Builds {@link withState}'s own classified `DomainError` from a non-`'valid'`
 * {@link ControllerStateReadResult}.
 * @param read - The non-`'valid'` read result.
 * @returns The classified `DomainError`.
 */
function controllerStateUnavailableError(
  read: Exclude<ControllerStateReadResult, { status: 'valid' }>,
): DomainError<ControllerStateUnavailableReason> {
  const code =
    read.status === 'absent'
      ? ControllerStateUnavailableReason.ABSENT
      : read.status === 'invalid'
        ? ControllerStateUnavailableReason.INVALID
        : ControllerStateUnavailableReason.STORAGE_UNAVAILABLE;
  return new DomainError('Controller state is unavailable; cannot handle worker protocol request', {
    code,
  });
}

/**
 * Returns `true` when `error` is {@link withState}'s own already-classified
 * "state not ready" outcome — narrowed from any other `DomainError` — so a
 * generic worker safety net can skip re-reporting it: `ABSENT`/`INVALID` are
 * expected classified states never reported anywhere, and
 * `STORAGE_UNAVAILABLE` was already reported once by `readControllerState()`.
 * @param error - The raw thrown value.
 * @returns Whether `error` is a classified controller-state-unavailable error.
 */
export function isControllerStateUnavailableError(
  error: unknown,
): error is DomainError<ControllerStateUnavailableReason> & {
  code: ControllerStateUnavailableReason;
} {
  return (
    error instanceof DomainError &&
    typeof error.code === 'string' &&
    CONTROLLER_STATE_UNAVAILABLE_REASON_VALUES.has(error.code)
  );
}

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
 * @throws {DomainError} A {@link ControllerStateUnavailableReason}-classified error when persisted state is absent, invalid, or unavailable.
 */
export async function withState<T>(
  channel: ManagedChannel,
  enqueue: OperationQueue,
  fn: (state: UpdateControllerState) => T | Promise<T>,
): Promise<T> {
  return enqueue(async () => {
    const read = await readControllerState(channel);
    if (read.status !== 'valid') {
      throw controllerStateUnavailableError(read);
    }
    return fn(read.state);
  });
}
