import type { ReleaseControllerState, ReleaseIdentity } from './contracts';
import { committedRelease } from './stateMachine';

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
 * Select the release the stable worker should serve right now.
 * @param state - Current private state.
 * @returns The active trial target while a trial is in progress, otherwise the committed release.
 */
export const selectServedRelease = (state: ReleaseControllerState): ReleaseIdentity =>
  state.trial?.targetRelease ?? committedRelease(state);

/**
 * Claim an unclaimed trial for the navigation that just occurred, or roll back a repeat
 * navigation that occurred before the trial's target confirmed boot.
 * @param state - Current private state.
 * @param navigatingClientId - Client id created by this navigation.
 * @returns State with the trial claimed by this navigation, or rolled back once.
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
  return rollbackFailedTrialBoot(state);
};

/**
 * Commit a trial once its target release confirms boot.
 * @param state - Current private state.
 * @param releaseId - Privately detected running release.
 * @returns Committed state, or the original state when no matching trial is active.
 */
export const confirmTrialBoot = (
  state: ReleaseControllerState,
  releaseId: string,
): ReleaseControllerState => {
  const trial = state.trial;
  if (!trial || trial.targetRelease.releaseId !== releaseId) return state;
  const activeRelease = trial.targetRelease;
  return {
    ...state,
    activeRelease,
    pinnedRelease: state.mode === 'manual' ? activeRelease : state.pinnedRelease,
    trial: undefined,
    preparation:
      state.preparation.status === 'ready' && state.preparation.release.releaseId === releaseId
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
