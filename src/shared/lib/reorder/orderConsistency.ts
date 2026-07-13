/**
 * Controlled-order consistency helpers: the consumer's `keys` stay the single source of truth,
 * but a live drag session needs a non-authoritative `confirmedSequence` snapshot to detect
 * incompatible external mutations and to decide when a rollback is safe. Every function here is
 * pure and DOM-free, including the session-decision helpers, so the reorder state machine stays
 * independently unit-testable without a browser, `requestAnimationFrame`, or Vue's `nextTick`.
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
    reorderInvariant(!seen.has(key), 'duplicate controlled keys are not allowed.');
    seen.add(key);
  }
};

/** The outcome of comparing the consumer's live sequence against a session's `confirmedSequence`. */
export type OrderConsistencyOutcome = 'consistent' | 'external-mutation';

/**
 * @param confirmedSequence - The session's last-confirmed controlled sequence.
 * @param currentKeys - The consumer's live controlled keys.
 * @returns `'external-mutation'` when the consumer's sequence no longer matches
 * `confirmedSequence` (a change not requested by this session), `'consistent'` otherwise.
 */
export const checkOrderConsistency = <Key extends ReorderKey>(
  confirmedSequence: readonly Key[],
  currentKeys: readonly Key[],
): OrderConsistencyOutcome =>
  sequencesEqual(confirmedSequence, currentKeys) ? 'consistent' : 'external-mutation';

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
 * Decides whether rolling `activeKey` back to `initialIndex` is currently safe: the consumer's
 * live sequence must exactly match `confirmedSequence` (never roll back over an incompatible
 * external mutation), the key must still exist, and `initialIndex` must still be a valid position.
 * @param confirmedSequence - The session's last-confirmed controlled sequence.
 * @param currentKeys - The consumer's live controlled keys.
 * @param activeKey - The key that was being dragged.
 * @param initialIndex - The key's index at session activation.
 * @returns Whether a rollback `onReorder` request may be issued.
 */
export const canRollback = <Key extends ReorderKey>(
  confirmedSequence: readonly Key[],
  currentKeys: readonly Key[],
  activeKey: Key,
  initialIndex: number,
): boolean => {
  if (!sequencesEqual(confirmedSequence, currentKeys)) return false;
  if (currentKeys.indexOf(activeKey) === -1) return false;
  if (initialIndex < 0 || initialIndex >= currentKeys.length) return false;

  return true;
};

/** The outcome of synchronously requesting a live move through the consumer's `onReorder`. */
export type RequestedMoveOutcome<Key extends ReorderKey> =
  | { kind: 'accepted'; confirmedSequence: Key[] }
  | { kind: 'rejected' };

/**
 * Evaluates the consumer's response to a just-requested move. This is the synchronous
 * accept/reject decision: it never waits for Vue's `nextTick`, because the public contract
 * requires the consumer to update its controlled `keys` synchronously inside `onReorder`.
 * @param requestedSequence - The exact sequence requested via `onReorder`.
 * @param keysAfterRequest - The consumer's controlled keys read immediately after `onReorder` returned.
 * @returns `'accepted'` with the promoted `confirmedSequence`, or `'rejected'` when the consumer's
 * keys don't exactly match the request.
 */
export const evaluateRequestedMove = <Key extends ReorderKey>(
  requestedSequence: readonly Key[],
  keysAfterRequest: readonly Key[],
): RequestedMoveOutcome<Key> =>
  confirmRequestedMove(requestedSequence, keysAfterRequest) === 'confirmed'
    ? { kind: 'accepted', confirmedSequence: [...requestedSequence] }
    : { kind: 'rejected' };

/** The outcome of reconciling `pointerup` for an active session. */
export type PointerUpOutcome = 'cancel' | 'defer' | 'finish';

/** The session state {@link decidePointerUpOutcome} reconciles at `pointerup`. */
export interface PointerUpReconciliationState<Key extends ReorderKey> {
  /** The session's last-confirmed controlled sequence. */
  confirmedSequence: readonly Key[];
  /** The consumer's live controlled keys, read at `pointerup`. */
  currentKeys: readonly Key[];
  /** The in-flight requested sequence, or `null` when none is outstanding. */
  pendingRequestedSequence: readonly Key[] | null;
  /**
   * Whether the session is still waiting for Vue's `nextTick` to confirm the last accepted
   * move's DOM commit.
   */
  awaitingDomCommit: boolean;
}

/**
 * Reconciles an active session's controlled-order state at the moment of `pointerup`, deciding
 * whether the session may finish normally, must defer completion until the pending DOM commit
 * settles, or must cancel instead. A session must never finish successfully while a controlled
 * request is unresolved or the consumer's sequence has diverged.
 * @param params - The session state to reconcile.
 * @returns `'cancel'` on divergence or an unresolved request, `'defer'` while awaiting the DOM
 * commit, `'finish'` otherwise.
 */
export const decidePointerUpOutcome = <Key extends ReorderKey>(
  params: PointerUpReconciliationState<Key>,
): PointerUpOutcome => {
  if (checkOrderConsistency(params.confirmedSequence, params.currentKeys) === 'external-mutation') {
    return 'cancel';
  }

  if (params.pendingRequestedSequence !== null) return 'cancel';
  if (params.awaitingDomCommit) return 'defer';

  return 'finish';
};
