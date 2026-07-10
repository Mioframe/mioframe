/**
 * Controlled-order consistency helpers: the consumer's `keys` stay the single source of truth,
 * but a live drag session needs a non-authoritative expected-sequence snapshot to detect
 * incompatible external mutations and to decide when a rollback is safe. Every function here is
 * pure and DOM-free so the consistency contract stays independently unit-testable.
 */
import { reorderInvariant } from './invariant';
import type { ReorderKey } from './types';

/**
 * @param a - The first sequence.
 * @param b - The second sequence.
 * @returns Whether `a` and `b` contain the same keys in the same order.
 */
export const sequencesEqual = <Key extends ReorderKey>(
  a: readonly Key[],
  b: readonly Key[],
): boolean => {
  if (a.length !== b.length) return false;

  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return false;
  }

  return true;
};

/**
 * Derives the sequence that results from moving the item at `fromIndex` to `toIndex`, without
 * mutating `sequence`.
 * @param sequence - The sequence to derive from.
 * @param fromIndex - The index to move an item from.
 * @param toIndex - The index to move that item to.
 * @returns A new sequence array reflecting the move.
 */
export const deriveMovedSequence = <Key extends ReorderKey>(
  sequence: readonly Key[],
  fromIndex: number,
  toIndex: number,
): Key[] => {
  const next = [...sequence];
  const [moved] = next.splice(fromIndex, 1);

  if (moved !== undefined) next.splice(toIndex, 0, moved);

  return next;
};

/**
 * @param keys - The controlled keys to validate.
 * @throws When `keys` contains a duplicate value; duplicate controlled keys are a consumer
 * contract violation, not a supported runtime state.
 */
export const assertUniqueKeys = (keys: readonly ReorderKey[]): void => {
  const seen = new Set<ReorderKey>();

  for (const key of keys) {
    reorderInvariant(
      !seen.has(key),
      `duplicate key "${String(key)}" found in controlled keys; keys must be unique.`,
    );
    seen.add(key);
  }
};

/**
 * A session's non-authoritative snapshot of what the consumer's controlled sequence should be.
 * Exists only to verify the controlled contract; it is never exposed publicly and never becomes
 * an authoritative state source.
 */
export interface OrderExpectation<Key extends ReorderKey> {
  /** The expected controlled sequence, owned only by the active session. */
  sequence: Key[];
}

/**
 * @param keys - The consumer's controlled keys, read at session activation.
 * @returns A fresh expectation snapshot.
 * @throws When `keys` contains a duplicate value.
 */
export const createOrderExpectation = <Key extends ReorderKey>(
  keys: readonly Key[],
): OrderExpectation<Key> => {
  assertUniqueKeys(keys);
  return { sequence: [...keys] };
};

/** The outcome of comparing the consumer's live sequence against a session's expectation. */
export type OrderConsistencyOutcome = 'consistent' | 'external-mutation';

/**
 * @param expectation - The session's current expected sequence.
 * @param currentKeys - The consumer's live controlled keys.
 * @returns `'external-mutation'` when the consumer's sequence no longer matches what the session
 * expects (a change not requested by this session), `'consistent'` otherwise.
 */
export const checkOrderConsistency = <Key extends ReorderKey>(
  expectation: OrderExpectation<Key>,
  currentKeys: readonly Key[],
): OrderConsistencyOutcome =>
  sequencesEqual(expectation.sequence, currentKeys) ? 'consistent' : 'external-mutation';

/** The outcome of confirming a library-requested move against the consumer's resulting sequence. */
export type MoveConfirmationOutcome = 'confirmed' | 'rejected';

/**
 * @param expectedNextSequence - The exact sequence the library requested via `onReorder`.
 * @param currentKeys - The consumer's controlled keys after the request.
 * @returns `'confirmed'` when the consumer's sequence exactly matches the request, `'rejected'`
 * otherwise (the consumer ignored the request, applied a different change, or the key vanished).
 */
export const confirmRequestedMove = <Key extends ReorderKey>(
  expectedNextSequence: readonly Key[],
  currentKeys: readonly Key[],
): MoveConfirmationOutcome =>
  sequencesEqual(expectedNextSequence, currentKeys) ? 'confirmed' : 'rejected';

/**
 * Decides whether rolling `activeKey` back to `initialIndex` is currently safe: the key must
 * still exist, the consumer's live sequence must exactly match the session's latest expectation
 * (never roll back over an incompatible external mutation), and `initialIndex` must still be a
 * valid position.
 * @param expectation - The session's current expected sequence.
 * @param currentKeys - The consumer's live controlled keys.
 * @param activeKey - The key that was being dragged.
 * @param initialIndex - The key's index at session activation.
 * @returns Whether a rollback `onReorder` request may be issued.
 */
export const canRollback = <Key extends ReorderKey>(
  expectation: OrderExpectation<Key>,
  currentKeys: readonly Key[],
  activeKey: Key,
  initialIndex: number,
): boolean => {
  if (!sequencesEqual(expectation.sequence, currentKeys)) return false;
  if (currentKeys.indexOf(activeKey) === -1) return false;
  if (initialIndex < 0 || initialIndex >= currentKeys.length) return false;

  return true;
};
