import type { AppUpdateSnapshot, AppUpdateState } from './publicContracts';
import type { ReleaseControllerState, ReleaseIdentity } from './contracts';
import { RELEASE_CONTROLLER_SCHEMA_VERSION, isSameReleaseIdentity } from './contracts';

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

/**
 * Release a specific client should see: the trial target only for the exact client that claimed
 * the trial, the committed release for every other client (including the pre-reload requester
 * before its own navigation claims the trial). The single owner of this rule — shared by request
 * routing (`selectServedRelease` in `trial.ts`) and snapshot projection below — so both stay in
 * sync by construction instead of duplicating the same client/trial comparison.
 * @param state - Private durable controller state.
 * @param clientId - Requesting/receiving client id.
 * @returns The release that client should be served or told is running.
 */
export const releaseForClient = (
  state: ReleaseControllerState,
  clientId: string,
): ReleaseIdentity =>
  state.trial && state.trial.initiatingClientId === clientId
    ? state.trial.targetRelease
    : committedRelease(state);

/**
 * A preparation record describes the current canonical `latestRelease` only when its target has
 * the same complete identity, or no `latestRelease` is known at all. Once `latestRelease` has
 * moved to a strictly newer target, an older ready or failed preparation must not hide it.
 * @param state - Private durable controller state.
 * @param preparationRelease - The preparation record's target release.
 * @returns Whether the preparation record still describes the current `latestRelease`.
 */
const preparationTargetsLatest = (
  state: ReleaseControllerState,
  preparationRelease: ReleaseIdentity,
): boolean =>
  state.latestRelease === undefined ||
  isSameReleaseIdentity(preparationRelease, state.latestRelease);

/**
 * Whether a specific client should be told the trial is starting: the client that already claimed
 * the trial by navigating into it, or — before that claim happens — only the sole Manual requester
 * about to reload. Every other client, including an unrelated window still running the committed
 * release, must never report `trialStarting` for a trial it has no part in.
 * @param state - Private durable controller state.
 * @param clientId - Requesting/receiving client id.
 * @returns Whether this exact client owns the in-progress trial.
 */
const isTrialStartingForClient = (state: ReleaseControllerState, clientId: string): boolean =>
  state.trial !== undefined &&
  (state.trial.initiatingClientId === clientId || state.trial.requestingClientId === clientId);

const projectUpdateState = (
  state: ReleaseControllerState,
  runningRelease: ReleaseIdentity,
  clientId: string,
): AppUpdateState => {
  if (isTrialStartingForClient(state, clientId)) return 'trialStarting';
  if (
    state.preparation.status === 'running' &&
    preparationTargetsLatest(state, state.preparation.release)
  )
    return 'preparing';
  if (
    state.preparation.status === 'ready' &&
    preparationTargetsLatest(state, state.preparation.release) &&
    isStrictlyNewerRelease(state.preparation.release, runningRelease)
  )
    return 'ready';
  if (
    state.preparation.status === 'failed' &&
    preparationTargetsLatest(state, state.preparation.release)
  )
    return 'failed';
  if (state.check.status === 'running') return 'checking';
  if (state.check.status === 'failed') return 'failed';
  if (isStrictlyNewerRelease(state.latestRelease, runningRelease)) return 'available';
  if (!state.check.lastSuccessAt) return 'notChecked';
  return 'upToDate';
};

/**
 * Project private controller state into the factual UI-safe snapshot for one requesting client.
 * @param state - Private durable controller state.
 * @param capability - Whether persisted state could be read this session.
 * @param clientId - Client the snapshot is being produced for; determines `runningRelease` during
 * an active trial. Omit only for contexts with no receiving client (there are none in production
 * call sites — every snapshot is requested by or broadcast to a specific client).
 * @returns UI-safe factual snapshot accurate for that specific client.
 */
export const projectAppUpdateSnapshot = (
  state: ReleaseControllerState,
  capability: 'available' | 'unavailable' = 'available',
  clientId = '',
): AppUpdateSnapshot => {
  const runningRelease = releaseForClient(state, clientId);
  return {
    capability,
    mode: state.mode,
    runningRelease,
    ...(state.pinnedRelease && { pinnedRelease: state.pinnedRelease }),
    ...(state.latestRelease && { latestRelease: state.latestRelease }),
    updateState: projectUpdateState(state, runningRelease, clientId),
    ...(state.check.lastSuccessAt && { lastSuccessfulCheckAt: state.check.lastSuccessAt }),
    ...(state.errorCode && { errorCode: state.errorCode }),
  };
};
