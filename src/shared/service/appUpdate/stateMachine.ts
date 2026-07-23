import type { AppUpdateSnapshot, AppUpdateState } from './publicContracts';
import type { ReleaseControllerState, ReleaseIdentity } from './contracts';
import { RELEASE_CONTROLLER_SCHEMA_VERSION } from './contracts';

/**
 * Compare immutable releases using only publisher sequence.
 * @param candidate - Validated possible forward release.
 * @param running - Currently committed release.
 * @returns Whether the candidate is strictly forward.
 */
export const isStrictlyNewerRelease = (
  candidate: ReleaseIdentity | undefined,
  running: ReleaseIdentity,
): candidate is ReleaseIdentity =>
  candidate !== undefined && candidate.releaseSequence > running.releaseSequence;

/**
 * Create initial Automatic state only when no durable record exists.
 * @param release - Release currently served by the stable worker.
 * @returns Initial private controller state.
 */
export const createInitialReleaseControllerState = (
  release: ReleaseIdentity,
): ReleaseControllerState => ({
  schemaVersion: RELEASE_CONTROLLER_SCHEMA_VERSION,
  mode: 'automatic',
  activeRelease: release,
  failedReleaseIds: [],
  check: { status: 'idle' },
  preparation: { status: 'idle' },
});

/**
 * Release actually committed and confirmed running, independent of any in-flight trial.
 * @param state - Private durable controller state.
 * @returns The committed Manual pin or Automatic active release.
 */
export const committedRelease = (state: ReleaseControllerState): ReleaseIdentity =>
  state.mode === 'manual' ? (state.pinnedRelease ?? state.activeRelease) : state.activeRelease;

const projectUpdateState = (
  state: ReleaseControllerState,
  runningRelease: ReleaseIdentity,
): AppUpdateState => {
  if (state.trial) return 'trialStarting';
  if (state.preparation.status === 'running') return 'preparing';
  if (
    state.preparation.status === 'ready' &&
    isStrictlyNewerRelease(state.preparation.release, runningRelease)
  )
    return 'ready';
  if (state.preparation.status === 'failed') return 'failed';
  if (state.check.status === 'running') return 'checking';
  if (state.check.status === 'failed') return 'failed';
  if (isStrictlyNewerRelease(state.latestRelease, runningRelease)) return 'available';
  if (!state.check.lastSuccessAt) return 'notChecked';
  return 'upToDate';
};

/**
 * Project private controller state into the factual UI-safe snapshot.
 * @param state - Private durable controller state.
 * @param capability - Whether persisted state could be read this session.
 * @returns UI-safe factual snapshot.
 */
export const projectAppUpdateSnapshot = (
  state: ReleaseControllerState,
  capability: 'available' | 'unavailable' = 'available',
): AppUpdateSnapshot => {
  const runningRelease = committedRelease(state);
  return {
    capability,
    mode: state.mode,
    runningRelease,
    ...(state.pinnedRelease && { pinnedRelease: state.pinnedRelease }),
    ...(state.latestRelease && { latestRelease: state.latestRelease }),
    updateState: projectUpdateState(state, runningRelease),
    ...(state.check.lastSuccessAt && { lastSuccessfulCheckAt: state.check.lastSuccessAt }),
    ...(state.errorCode && { errorCode: state.errorCode }),
  };
};
