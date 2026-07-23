import type { ActivationTransaction, ReleaseControllerState, ReleaseIdentity } from './contracts';

const SINGLE_LAUNCH_KEY = 'single-launch';

/**
 * Create a persisted activation transaction before any stable-client reload.
 * @param root0 - Transaction inputs and deterministic seams.
 * @returns State containing the new activation transaction.
 */
export const createActivationTransaction = ({
  state,
  targetRelease,
  oldClientIds,
  now,
  transactionId = crypto.randomUUID(),
  lifetimeMs = 60_000,
}: {
  /** Current private controller state. */
  state: ReleaseControllerState;
  /** Fully prepared forward target. */
  targetRelease: ReleaseIdentity;
  /** Stable controlled windows expected to restart. */
  oldClientIds: string[];
  /** Transaction creation time. */
  now: Date;
  /** Deterministic transaction identifier seam. */
  transactionId?: string;
  /** Deterministic recovery expiry. */
  lifetimeMs?: number;
}): ReleaseControllerState => ({
  ...state,
  preparedRelease: undefined,
  previousRelease: state.activeRelease,
  activationState: oldClientIds.length === 0 ? 'waitingForSafeLaunch' : 'restarting',
  activationTransaction: {
    transactionId,
    targetRelease,
    previousRelease: state.activeRelease,
    expectedOldClientIds: [...new Set(oldClientIds)],
    replacements: {},
    confirmedReplacementClientIds: [],
    acceptsSingleLaunch: oldClientIds.length === 0,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + lifetimeMs).toISOString(),
  },
});

/**
 * Associate an expected old stable client with its navigation replacement.
 * @param state - Current private state.
 * @param replacesClientId - Old stable client replaced by navigation.
 * @param resultingClientId - New stable client created by navigation.
 * @returns Idempotently updated state.
 */
export const associateReplacementNavigation = (
  state: ReleaseControllerState,
  replacesClientId: string,
  resultingClientId: string,
): ReleaseControllerState => {
  const transaction = state.activationTransaction;
  if (!transaction || !resultingClientId) return state;
  const oldClientId = transaction.expectedOldClientIds.includes(replacesClientId)
    ? replacesClientId
    : transaction.acceptsSingleLaunch && transaction.expectedOldClientIds.length === 0
      ? SINGLE_LAUNCH_KEY
      : undefined;
  if (!oldClientId) return state;
  const existing = transaction.replacements[oldClientId];
  if (existing === resultingClientId) return state;
  if (existing) return state;
  return {
    ...state,
    activationState: 'restarting',
    activationTransaction: {
      ...transaction,
      replacements: { ...transaction.replacements, [oldClientId]: resultingClientId },
    },
  };
};

/**
 * Select the release permitted to serve a particular stable client.
 * @param state - Current private state.
 * @param clientId - Stable requesting client.
 * @returns Trial target only for mapped replacements, otherwise committed selection.
 */
export const releaseForClient = (
  state: ReleaseControllerState,
  clientId: string,
): ReleaseIdentity => {
  const transaction = state.activationTransaction;
  if (transaction && Object.values(transaction.replacements).includes(clientId)) {
    return transaction.targetRelease;
  }
  return state.mode === 'manual'
    ? (state.pinnedRelease ?? state.activeRelease)
    : state.activeRelease;
};

/**
 * Record an expected replacement boot and commit only after all replacements confirm.
 * @param state - Current private state.
 * @param clientId - Confirming replacement client.
 * @param releaseId - Privately detected running release.
 * @returns Idempotently updated or committed state.
 */
export const confirmReplacementBoot = (
  state: ReleaseControllerState,
  clientId: string,
  releaseId: string,
): ReleaseControllerState => {
  const transaction = state.activationTransaction;
  if (
    !transaction ||
    transaction.targetRelease.releaseId !== releaseId ||
    !Object.values(transaction.replacements).includes(clientId)
  )
    return state;
  const confirmations = [...new Set([...transaction.confirmedReplacementClientIds, clientId])];
  const requiredCount = transaction.acceptsSingleLaunch
    ? 1
    : transaction.expectedOldClientIds.length;
  if (confirmations.length < requiredCount) {
    return {
      ...state,
      activationTransaction: { ...transaction, confirmedReplacementClientIds: confirmations },
    };
  }
  const activeRelease = transaction.targetRelease;
  return {
    ...state,
    activeRelease,
    pinnedRelease: state.mode === 'manual' ? activeRelease : state.pinnedRelease,
    previousRelease: transaction.previousRelease,
    activationTransaction: undefined,
    activationState: 'idle',
    failedReleaseIds: state.failedReleaseIds.filter((id) => id !== activeRelease.releaseId),
  };
};

/**
 * Roll an expired activation back exactly once.
 * @param state - Current private state.
 * @param now - Recovery evaluation time.
 * @returns Original state or one-shot rollback state.
 */
export const rollbackExpiredActivation = (
  state: ReleaseControllerState,
  now: Date,
): ReleaseControllerState => {
  const transaction = state.activationTransaction;
  if (!transaction || now.getTime() < Date.parse(transaction.expiresAt)) return state;
  return {
    ...state,
    activeRelease: transaction.previousRelease,
    pinnedRelease: state.mode === 'manual' ? transaction.previousRelease : state.pinnedRelease,
    previousRelease: undefined,
    activationTransaction: undefined,
    activationState: 'idle',
    preparedRelease: undefined,
    failedReleaseIds: [
      ...new Set([...state.failedReleaseIds, transaction.targetRelease.releaseId]),
    ],
  };
};

/**
 * Roll back when a mapped replacement navigates again before confirming boot.
 * @param state - Current private state.
 * @param replacesClientId - Client being replaced by the new navigation.
 * @returns Original state or one-shot failed-boot rollback state.
 */
export const rollbackFailedReplacementNavigation = (
  state: ReleaseControllerState,
  replacesClientId: string,
): ReleaseControllerState => {
  const transaction = state.activationTransaction;
  if (
    !transaction ||
    !Object.values(transaction.replacements).includes(replacesClientId) ||
    transaction.confirmedReplacementClientIds.includes(replacesClientId)
  )
    return state;
  return {
    ...state,
    activeRelease: transaction.previousRelease,
    pinnedRelease: state.mode === 'manual' ? transaction.previousRelease : state.pinnedRelease,
    previousRelease: undefined,
    activationTransaction: undefined,
    activationState: 'idle',
    preparedRelease: undefined,
    activationRequested: undefined,
    failedReleaseIds: [
      ...new Set([...state.failedReleaseIds, transaction.targetRelease.releaseId]),
    ],
  };
};

/**
 * Narrow test guard for private activation transaction records.
 * @param value - Possible transaction value.
 * @returns Whether the minimal private transaction discriminator exists.
 */
export const isActivationTransaction = (value: unknown): value is ActivationTransaction =>
  typeof value === 'object' && value !== null && 'transactionId' in value;
