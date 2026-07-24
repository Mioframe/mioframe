import type { ReleaseControllerState, ReleaseIdentity } from './contracts';
import { isSameReleaseIdentity } from './contracts';
import { committedRelease, releaseForClient } from './stateMachine';

/**
 * Create the single persisted trial before reloading the one window that will run it.
 * @param root0 - Trial inputs and deterministic seams.
 * @returns State containing the new trial.
 */
export const createTrial = ({
  state,
  targetRelease,
  now,
  initiatingClientId,
  lifetimeMs = 60_000,
}: {
  /** Current private controller state. */
  state: ReleaseControllerState;
  /** Fully prepared forward target. */
  targetRelease: ReleaseIdentity;
  /** Trial creation time. */
  now: Date;
  /**
   * Client expected to run the trial. Manual `Update now` sets this to the requesting client
   * before its reload (a real navigation has not happened yet); Automatic clean launch sets it
   * directly to the navigating client, since the trial is created from within that navigation.
   */
  initiatingClientId?: string;
  /** Deterministic recovery expiry. */
  lifetimeMs?: number;
}): ReleaseControllerState => ({
  ...state,
  trial: {
    targetRelease,
    previousRelease: committedRelease(state),
    startedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + lifetimeMs).toISOString(),
    ...(initiatingClientId && { initiatingClientId }),
  },
});

/**
 * Select the release a specific requesting client should be served right now.
 *
 * Only the exact client that claimed the trial (`trial.initiatingClientId`) is ever served the
 * trial target; every other client — including the pre-reload requester before its own navigation
 * claims the trial — continues to receive the previously committed release. This is what keeps a
 * Manual trial from mixing old-page markup with new-target assets before the requesting window
 * actually reloads.
 * @param state - Current private state.
 * @param clientId - Requesting client id.
 * @returns The trial target only for the claiming client, otherwise the committed release.
 */
export const selectServedRelease = (
  state: ReleaseControllerState,
  clientId: string,
): ReleaseIdentity => releaseForClient(state, clientId);

/**
 * Claim an unclaimed trial for the navigation that just occurred, roll back a repeat navigation
 * from the exact claiming client that occurred before the trial's target confirmed boot, or leave
 * an already-claimed trial untouched for an unrelated client's navigation.
 *
 * Only the claiming client's own repeat navigation is evidence of a failed boot. An unrelated
 * client (any client id other than `trial.initiatingClientId`) navigating — opening a new window,
 * following a deep link, or simply continuing to use the committed release — must never cancel
 * another client's in-progress trial.
 * @param state - Current private state.
 * @param navigatingClientId - Client id created by this navigation.
 * @returns State with the trial claimed by this navigation, rolled back once for a repeat
 * navigation from the claiming client, or unchanged for an unrelated client's navigation.
 */
export const associateTrialNavigation = (
  state: ReleaseControllerState,
  navigatingClientId: string,
): ReleaseControllerState => {
  const trial = state.trial;
  if (!trial) return state;
  if (trial.initiatingClientId === undefined) {
    return { ...state, trial: { ...trial, initiatingClientId: navigatingClientId } };
  }
  if (trial.initiatingClientId !== navigatingClientId) return state;
  return rollbackFailedTrialBoot(state);
};

/**
 * Commit a trial once its exact claiming client confirms booting its exact target release.
 *
 * Both facts must match: a correct release id reported by the wrong client, or a wrong release id
 * reported by the claiming client, are both ignored rather than committed. Only a genuine repeat
 * navigation from the claiming client without a matching confirmation is treated as a failed boot
 * (via `associateTrialNavigation`'s rollback path, not this function).
 * @param state - Current private state.
 * @param sourceClientId - Client id the confirmation message actually arrived from.
 * @param releaseId - Privately detected running release.
 * @returns Committed state, or the original state when no matching trial/client/release is active.
 */
export const confirmTrialBoot = (
  state: ReleaseControllerState,
  sourceClientId: string,
  releaseId: string,
): ReleaseControllerState => {
  const trial = state.trial;
  if (
    !trial ||
    trial.initiatingClientId !== sourceClientId ||
    trial.targetRelease.releaseId !== releaseId
  )
    return state;
  const activeRelease = trial.targetRelease;
  return {
    ...state,
    activeRelease,
    pinnedRelease: state.mode === 'manual' ? activeRelease : state.pinnedRelease,
    trial: undefined,
    preparation:
      state.preparation.status === 'ready' &&
      isSameReleaseIdentity(state.preparation.release, trial.targetRelease)
        ? { status: 'idle' }
        : state.preparation,
    failedReleaseIds: state.failedReleaseIds.filter((id) => id !== activeRelease.releaseId),
  };
};

/**
 * Roll an expired trial back exactly once.
 * @param state - Current private state.
 * @param now - Recovery evaluation time.
 * @returns Original state or one-shot rollback state.
 */
export const rollbackExpiredTrial = (
  state: ReleaseControllerState,
  now: Date,
): ReleaseControllerState => {
  const trial = state.trial;
  if (!trial || now.getTime() < Date.parse(trial.expiresAt)) return state;
  return rollbackFailedTrialBoot(state);
};

/**
 * Roll back a trial that failed to confirm boot, marking its target as failed.
 * @param state - Current private state.
 * @returns Rolled-back state, or the original state when no trial is active.
 */
export const rollbackFailedTrialBoot = (state: ReleaseControllerState): ReleaseControllerState => {
  const trial = state.trial;
  if (!trial) return state;
  return {
    ...state,
    activeRelease: trial.previousRelease,
    pinnedRelease: state.mode === 'manual' ? trial.previousRelease : state.pinnedRelease,
    trial: undefined,
    preparation: { status: 'failed', release: trial.targetRelease },
    failedReleaseIds: [...new Set([...state.failedReleaseIds, trial.targetRelease.releaseId])],
  };
};
