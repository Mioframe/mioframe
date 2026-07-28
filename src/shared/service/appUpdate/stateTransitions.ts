import {
  CONTROLLER_STATE_SCHEMA_VERSION,
  type ReleaseRef,
  type UpdateControllerState,
  type UpdateMode,
} from './contracts';

/**
 * Builds the initial persisted state for a genuinely first-ever installation,
 * once `activeRelease` has been completely prepared locally. Defaults new
 * installs to Automatic mode: Manual is the mode a user explicitly opts into
 * from settings, not the ambient baseline.
 * @param activeRelease - The release prepared and selected as active.
 * @param mode - Initial update mode; defaults to `'automatic'`.
 * @returns The initial `UpdateControllerState`.
 */
export function buildInitialControllerState(
  activeRelease: ReleaseRef,
  mode: UpdateMode = 'automatic',
): UpdateControllerState {
  return {
    schemaVersion: CONTROLLER_STATE_SCHEMA_VERSION,
    mode,
    activeRelease,
  };
}

const isNewerSequence = (candidate: ReleaseRef, known: ReleaseRef): boolean =>
  candidate.releaseSequence > known.releaseSequence;

const isSameSequenceConflict = (candidate: ReleaseRef, known: ReleaseRef): boolean =>
  candidate.releaseSequence === known.releaseSequence && candidate.releaseId !== known.releaseId;

/** Outcome of {@link applyCheckForUpdates}. */
export type CheckForUpdatesOutcome = 'updated' | 'ignored-stale' | 'rejected-conflict';

/** Result of {@link applyCheckForUpdates}: the outcome and the resulting state. */
export type CheckForUpdatesResult = {
  /** Which of the three discovery outcomes occurred. */
  outcome: CheckForUpdatesOutcome;
  /** The resulting controller state. */
  state: UpdateControllerState;
};

/**
 * Applies a successful `CHECK_FOR_UPDATES` discovery result.
 *
 * Never changes `activeRelease`. Never prepares or approves anything: that
 * remains an orchestration decision made from the resulting `latestRelease`.
 * A strictly newer discovery than a previously recorded failed release also
 * clears that failure record, since it can no longer affect Automatic
 * approval or the UI (an obsolete failure the user has already moved past).
 * @param state - Current controller state.
 * @param discovered - The release identity from the fetched and validated `latest.json`.
 * @param checkedAt - ISO timestamp of this successful check.
 * @returns The check outcome and resulting state.
 */
export function applyCheckForUpdates(
  state: UpdateControllerState,
  discovered: ReleaseRef,
  checkedAt: string,
): CheckForUpdatesResult {
  const known = state.latestRelease ?? state.activeRelease;

  if (isSameSequenceConflict(discovered, known)) {
    return { outcome: 'rejected-conflict', state: { ...state, lastSuccessfulCheckAt: checkedAt } };
  }
  // Anything not strictly newer is ignored — including the exact same
  // release already known (e.g. the very first check ever, discovering
  // only the release the worker already installed): that must never mark
  // `latestRelease` as if something new had been found.
  if (!isNewerSequence(discovered, known)) {
    return { outcome: 'ignored-stale', state: { ...state, lastSuccessfulCheckAt: checkedAt } };
  }

  const clearsObsoleteFailure =
    state.failedActivationRelease !== undefined &&
    isNewerSequence(discovered, state.failedActivationRelease);
  const { failedActivationRelease: _failedActivationRelease, ...withoutObsoleteFailure } = state;

  return {
    outcome: 'updated',
    state: {
      ...(clearsObsoleteFailure ? withoutObsoleteFailure : state),
      latestRelease: discovered,
      lastSuccessfulCheckAt: checkedAt,
    },
  };
}

/**
 * Records a Manual `INSTALL_ON_NEXT_LAUNCH` approval for one exact,
 * already-fully-prepared release. Always refers to the exact release the
 * caller resolved and prepared; never re-derived from a newer discovery. An
 * explicit Manual action may approve the exact release recorded as
 * previously failed — unlike the Automatic path, this is a deliberate user
 * retry.
 * @param state - Current controller state.
 * @param prepared - The exact release the user approved and that was fully prepared.
 * @returns The resulting state.
 */
export function approveManualRelease(
  state: UpdateControllerState,
  prepared: ReleaseRef,
): UpdateControllerState {
  return { ...state, approvedRelease: prepared };
}

/**
 * Records an Automatic-mode approval once `prepared` has been fully
 * committed locally. Only ever moves `approvedRelease` forward, and never
 * approves the exact release currently recorded as having failed its boot.
 * @param state - Current controller state.
 * @param prepared - The release that finished background preparation.
 * @returns The resulting state, unchanged if `prepared` is not a forward improvement.
 */
export function approveAutomaticRelease(
  state: UpdateControllerState,
  prepared: ReleaseRef,
): UpdateControllerState {
  if (state.failedActivationRelease?.releaseId === prepared.releaseId) return state;
  if (state.approvedRelease && prepared.releaseSequence <= state.approvedRelease.releaseSequence) {
    return state;
  }
  return { ...state, approvedRelease: prepared };
}

/**
 * Cancels a scheduled Manual update. A no-op once activation has already
 * started: an in-progress activation is not a "scheduled" update anymore.
 * @param state - Current controller state.
 * @returns The resulting state.
 */
export function cancelScheduledUpdate(state: UpdateControllerState): UpdateControllerState {
  if (state.activation || !state.approvedRelease) return state;
  const { approvedRelease: _approvedRelease, ...rest } = state;
  return rest;
}

/**
 * Switches to Manual mode. Clears an Automatic approval that has not yet
 * entered activation; an in-progress activation and its own approved target
 * are left untouched.
 * @param state - Current controller state.
 * @returns The resulting state.
 */
export function switchToManualMode(state: UpdateControllerState): UpdateControllerState {
  if (state.mode === 'automatic' && !state.activation && state.approvedRelease) {
    const { approvedRelease: _approvedRelease, ...rest } = state;
    return { ...rest, mode: 'manual' };
  }
  return { ...state, mode: 'manual' };
}

/**
 * Switches to Automatic mode. When a `preparedRelease` is already available
 * (the latest known release, fully prepared by the caller as part of this
 * switch), approves it through the same forward-only rule as
 * {@link approveAutomaticRelease}.
 * @param state - Current controller state.
 * @param preparedRelease - The latest known release, if already fully prepared.
 * @returns The resulting state.
 */
export function switchToAutomaticMode(
  state: UpdateControllerState,
  preparedRelease?: ReleaseRef,
): UpdateControllerState {
  const withMode: UpdateControllerState = { ...state, mode: 'automatic' };
  return preparedRelease ? approveAutomaticRelease(withMode, preparedRelease) : withMode;
}

/**
 * Starts a clean-launch activation of `state.approvedRelease`. `activeRelease`
 * is left unchanged — it only ever changes on a later `BOOT_OK` commit. A
 * no-op when an activation already exists, so concurrent qualifying
 * navigations can call this without creating conflicting activations.
 * @param state - Current controller state.
 * @param target - The release to activate; must equal `state.approvedRelease`.
 * @param deadlineAt - ISO timestamp of the boot-confirmation deadline.
 * @returns The resulting state.
 */
export function startActivation(
  state: UpdateControllerState,
  target: ReleaseRef,
  deadlineAt: string,
): UpdateControllerState {
  if (state.activation) return state;
  return {
    ...state,
    activation: { targetRelease: target, deadlineAt },
  };
}

/**
 * Commits a successful `BOOT_OK` for the current activation's target.
 * Ignored (no-op) when there is no matching in-progress activation for
 * `confirmedReleaseId`, so a wrong-release or late confirmation cannot
 * corrupt an already-resolved state. Clears a matching recorded failure — a
 * successful retry clears the failure it retried.
 * @param state - Current controller state.
 * @param confirmedReleaseId - The release id reported as successfully booted.
 * @returns The resulting state.
 */
export function commitActivation(
  state: UpdateControllerState,
  confirmedReleaseId: string,
): UpdateControllerState {
  const { activation } = state;
  if (!activation || activation.targetRelease.releaseId !== confirmedReleaseId) return state;

  const {
    activation: _activation,
    approvedRelease: _approvedRelease,
    failedActivationRelease,
    ...rest
  } = state;
  const clearsFailure = failedActivationRelease?.releaseId === activation.targetRelease.releaseId;

  return {
    ...rest,
    activeRelease: activation.targetRelease,
    ...(clearsFailure ? {} : { failedActivationRelease }),
  };
}

/**
 * Rolls back the current activation, leaving `activeRelease` unchanged (it
 * was never changed by starting the activation), and records the target as
 * the single failed release. Ignored (no-op) when there is no matching
 * in-progress activation for `failedReleaseId`, so a wrong-release or late
 * failure report cannot corrupt an already-resolved state.
 * @param state - Current controller state.
 * @param failedReleaseId - The release id whose activation failed to boot.
 * @returns The resulting state.
 */
export function rollbackActivation(
  state: UpdateControllerState,
  failedReleaseId: string,
): UpdateControllerState {
  const { activation } = state;
  if (!activation || activation.targetRelease.releaseId !== failedReleaseId) return state;

  const { activation: _activation, approvedRelease: _approvedRelease, ...rest } = state;
  return {
    ...rest,
    failedActivationRelease: activation.targetRelease,
  };
}

/**
 * Returns `true` when the current activation's boot-confirmation deadline
 * has passed as of `now`. `false` when there is no activation at all.
 * @param state - Current controller state.
 * @param now - ISO timestamp to evaluate against `activation.deadlineAt`.
 * @returns Whether the current activation is expired.
 */
export function isActivationExpired(state: UpdateControllerState, now: string): boolean {
  return state.activation !== undefined && now >= state.activation.deadlineAt;
}

/** Same-channel window-liveness facts a clean-launch decision needs. */
export type CleanLaunchInputs = {
  /** Whether this navigation reloads an existing client already controlled by this worker. */
  isReloadOfControlledClient: boolean;
  /** Count of other live same-channel window clients, excluding this navigation. */
  otherLiveClientCount: number;
};

/**
 * Decides whether a qualifying navigation should start a brand-new clean
 * launch activation of `state.approvedRelease`.
 *
 * `false` whenever an activation already exists (every qualifying
 * navigation is already served its target without starting another one),
 * there is nothing approved to activate, this navigation is an ordinary
 * reload of an existing session, or another same-channel window is still
 * live. Caller is responsible for scoping `otherLiveClientCount` to the
 * current channel only (excluding other channels, branches, and PR
 * previews).
 * @param state - Current controller state.
 * @param inputs - Same-channel window-liveness facts for this navigation.
 * @returns Whether to start a new activation.
 */
export function shouldStartActivation(
  state: UpdateControllerState,
  inputs: CleanLaunchInputs,
): boolean {
  if (state.activation || !state.approvedRelease) return false;
  if (inputs.isReloadOfControlledClient) return false;
  return inputs.otherLiveClientCount === 0;
}
