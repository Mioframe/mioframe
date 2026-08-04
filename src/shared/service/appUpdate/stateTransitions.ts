import {
  CONTROLLER_STATE_SCHEMA_VERSION,
  releaseSummariesMatch,
  type ReleaseSummary,
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
  activeRelease: ReleaseSummary,
  mode: UpdateMode = 'automatic',
): UpdateControllerState {
  return {
    schemaVersion: CONTROLLER_STATE_SCHEMA_VERSION,
    mode,
    activeRelease,
  };
}

/** Outcome of {@link applyDiscovery}. */
export type CheckForUpdatesOutcome = 'updated' | 'ignored-stale' | 'skipped';

/** Result of {@link applyDiscovery}: the outcome and the resulting state. */
export type CheckForUpdatesResult = {
  /** Which of the three discovery outcomes occurred. */
  outcome: CheckForUpdatesOutcome;
  /** The resulting controller state. */
  state: UpdateControllerState;
};

/**
 * Applies a successful discovery result (`CHECK_FOR_UPDATES`, or the
 * background navigation scheduler).
 *
 * Never changes `activeRelease`. Never prepares anything: that remains an
 * orchestration decision made from the resulting candidate.
 *
 * `ready` and `activating` candidates are pinned and can never be
 * superseded — this function is a true no-op for them, including
 * `lastSuccessfulCheckAt`, mirroring "discovery is skipped" for those phases.
 * `available` and `failed` candidates may be replaced by a strictly newer
 * discovered release, uniformly, regardless of mode: retry/replacement
 * policy for a `failed` candidate is entirely a consequence of this "strictly
 * newer" rule — an equal `discovered` (an exact automatic retry of the
 * failed release) is always ignored here, while an explicit Manual retry of
 * the exact failed release happens through {@link completeManualInstall}, not
 * discovery. Whether discovery runs at all for a Manual `failed` candidate is
 * an orchestration-level gate applied before this function is called.
 * @param state - Current controller state.
 * @param discovered - The validated release summary for the discovered release.
 * @param checkedAt - ISO timestamp of this successful check.
 * @returns The check outcome and resulting state.
 */
export function applyDiscovery(
  state: UpdateControllerState,
  discovered: ReleaseSummary,
  checkedAt: string,
): CheckForUpdatesResult {
  const { candidate } = state;
  if (candidate?.phase === 'ready' || candidate?.phase === 'activating') {
    return { outcome: 'skipped', state };
  }

  const known = candidate?.release ?? state.activeRelease;
  if (discovered.releaseNumber <= known.releaseNumber) {
    return { outcome: 'ignored-stale', state: { ...state, lastSuccessfulCheckAt: checkedAt } };
  }

  return {
    outcome: 'updated',
    state: {
      ...state,
      candidate: { phase: 'available', release: discovered },
      lastSuccessfulCheckAt: checkedAt,
    },
  };
}

/**
 * Resolves the candidate that currently requires Automatic preparation, if
 * any: mode is Automatic and the candidate is `available`.
 * @param state - Current controller state.
 * @returns The release to prepare, or `undefined` when none is required.
 */
export function resolveAutomaticPreparationTarget(
  state: UpdateControllerState,
): ReleaseSummary | undefined {
  return state.mode === 'automatic' && state.candidate?.phase === 'available'
    ? state.candidate.release
    : undefined;
}

/**
 * Applies a completed Automatic background preparation. Only ever moves
 * `available(B)` to `ready(B)`, and only when fresh state still has
 * Automatic mode and the candidate is `available` with the exact same
 * complete release identity as `preparedRelease` (see
 * {@link releaseSummariesMatch}) — a stale completion (mode changed,
 * candidate replaced, candidate already advanced, or the candidate's
 * `releaseNumber` matches but its `appVersion`/`buildId`/`buildDate` does
 * not) is a true no-op.
 * @param state - Current controller state.
 * @param preparedRelease - The complete release summary that finished preparing.
 * @returns The resulting state, unchanged (same reference) when stale.
 */
export function completeAutomaticPreparation(
  state: UpdateControllerState,
  preparedRelease: ReleaseSummary,
): UpdateControllerState {
  const { candidate } = state;
  if (
    state.mode !== 'automatic' ||
    candidate?.phase !== 'available' ||
    !releaseSummariesMatch(candidate.release, preparedRelease)
  ) {
    return state;
  }
  return { ...state, candidate: { phase: 'ready', release: candidate.release } };
}

/**
 * Applies a completed Manual install (`INSTALL_ON_NEXT_LAUNCH`). Moves
 * `available(B)` or `failed(B)` to `ready(B)`, only when fresh state still
 * has Manual mode and the candidate is in an allowed phase with the exact
 * same complete release identity as `preparedRelease` (see
 * {@link releaseSummariesMatch}) — a stale completion is a true no-op.
 * @param state - Current controller state.
 * @param preparedRelease - The complete release summary that finished preparing.
 * @returns The resulting state, unchanged (same reference) when stale.
 */
export function completeManualInstall(
  state: UpdateControllerState,
  preparedRelease: ReleaseSummary,
): UpdateControllerState {
  const { candidate } = state;
  if (
    state.mode !== 'manual' ||
    !candidate ||
    (candidate.phase !== 'available' && candidate.phase !== 'failed') ||
    !releaseSummariesMatch(candidate.release, preparedRelease)
  ) {
    return state;
  }
  return { ...state, candidate: { phase: 'ready', release: candidate.release } };
}

/**
 * Cancels a scheduled Manual update: `ready(B)` returns to `available(B)`.
 * Cancellation belongs only to Manual mode — an Automatic `ready` candidate
 * is a no-op here, so a user cannot leave Automatic mode `ready` for a
 * release and then cancel it out from under themselves.
 * @param state - Current controller state.
 * @returns The resulting state, unchanged (same reference) when not applicable.
 */
export function cancelScheduledUpdate(state: UpdateControllerState): UpdateControllerState {
  if (state.mode !== 'manual' || state.candidate?.phase !== 'ready') return state;
  return { ...state, candidate: { phase: 'available', release: state.candidate.release } };
}

/**
 * Changes only `mode`. Never clears, approves, or prepares the candidate,
 * and never waits for network or cache work — those are orchestration-level
 * follow-ups triggered by the caller after this returns, not part of this
 * transition. A true no-op, returning `state` unchanged (same reference),
 * when `mode` already matches, so a repeated `SET_MODE` command never causes
 * a needless persist or broadcast.
 * @param state - Current controller state.
 * @param mode - The requested mode.
 * @returns The resulting state.
 */
export function setMode(state: UpdateControllerState, mode: UpdateMode): UpdateControllerState {
  if (state.mode === mode) return state;
  return { ...state, mode };
}

/**
 * Starts a clean-launch activation. Consumes only the current `ready`
 * candidate — activation never accepts an independent target argument.
 * `activeRelease` is left unchanged; it only ever changes on a later
 * `BOOT_OK` commit. A no-op when the candidate is not `ready`, so concurrent
 * qualifying navigations can call this without creating conflicting
 * activations.
 * @param state - Current controller state.
 * @param deadlineAt - ISO timestamp of the boot-confirmation deadline.
 * @returns The resulting state, unchanged (same reference) when not applicable.
 */
export function startActivation(
  state: UpdateControllerState,
  deadlineAt: string,
): UpdateControllerState {
  if (state.candidate?.phase !== 'ready') return state;
  return {
    ...state,
    candidate: { phase: 'activating', release: state.candidate.release, deadlineAt },
  };
}

/**
 * Commits a successful `BOOT_OK` for the current activation. Ignored (no-op)
 * when there is no matching in-progress `activating` candidate for
 * `confirmedReleaseNumber`, so a wrong-release or late confirmation cannot
 * corrupt an already-resolved state.
 * @param state - Current controller state.
 * @param confirmedReleaseNumber - The release number reported as successfully booted.
 * @returns The resulting state, unchanged (same reference) when not applicable.
 */
export function commitActivation(
  state: UpdateControllerState,
  confirmedReleaseNumber: number,
): UpdateControllerState {
  const { candidate } = state;
  if (
    candidate?.phase !== 'activating' ||
    candidate.release.releaseNumber !== confirmedReleaseNumber
  ) {
    return state;
  }
  const { candidate: _candidate, ...rest } = state;
  return { ...rest, activeRelease: candidate.release };
}

/**
 * Rolls back the current activation, leaving `activeRelease` unchanged (it
 * was never changed by starting the activation), and records the target as
 * `failed`. Ignored (no-op) when there is no matching in-progress
 * `activating` candidate for `failedReleaseNumber`, so a wrong-release or
 * late failure report cannot corrupt an already-resolved state. Used both
 * for a durable `BOOT_FAILED` acknowledgement and for expired-activation
 * recovery.
 * @param state - Current controller state.
 * @param failedReleaseNumber - The release number whose activation failed to boot.
 * @returns The resulting state, unchanged (same reference) when not applicable.
 */
export function rollbackActivation(
  state: UpdateControllerState,
  failedReleaseNumber: number,
): UpdateControllerState {
  const { candidate } = state;
  if (
    candidate?.phase !== 'activating' ||
    candidate.release.releaseNumber !== failedReleaseNumber
  ) {
    return state;
  }
  return { ...state, candidate: { phase: 'failed', release: candidate.release } };
}

/**
 * Returns `true` when the current `activating` candidate's boot-confirmation
 * deadline has passed as of `now`. `false` when the candidate is not
 * `activating`.
 *
 * Compares parsed time values (`Date.parse`), never ISO strings
 * lexicographically: differing but valid fractional-second precision must
 * never change the chronological outcome.
 * @param state - Current controller state.
 * @param now - ISO timestamp to evaluate against the candidate's `deadlineAt`.
 * @returns Whether the current activation is expired.
 */
export function isActivationExpired(state: UpdateControllerState, now: string): boolean {
  if (state.candidate?.phase !== 'activating') return false;
  return Date.parse(now) >= Date.parse(state.candidate.deadlineAt);
}

/** Same-channel window-liveness facts a clean-launch decision needs. */
export type CleanLaunchInputs = {
  /** Count of other live same-channel window clients, excluding this navigation itself. */
  otherLiveClientCount: number;
};

/**
 * Decides whether a qualifying navigation should start a brand-new clean
 * launch activation of the current `ready` candidate.
 *
 * A pure decision over two already-resolved facts: the candidate's `ready`
 * phase and `inputs.otherLiveClientCount`, the count of *other* same-channel
 * window clients live right now. The caller has already excluded the
 * navigation currently being evaluated from that count, along with every
 * client outside this exact channel (other channels, branches, and PR
 * previews). Zero other same-channel windows is a qualifying clean launch;
 * one or more other same-channel windows blocks activation. `false`
 * whenever the candidate is not `ready`: every qualifying navigation while
 * already `activating` is served its target without starting another one.
 *
 * Has no concept of "reload": it only ever consumes `otherLiveClientCount`,
 * never a request type, navigation history, or a URL heuristic — this pure
 * function performs no browser reload classification at all. Caller is
 * responsible for computing `otherLiveClientCount` (`clientId`/
 * `resultingClientId` exclusion only, see `sw.ts`) and for scoping it to the
 * current channel only.
 * @param state - Current controller state.
 * @param inputs - Same-channel window-liveness facts for this navigation.
 * @returns Whether to start a new activation.
 */
export function shouldStartActivation(
  state: UpdateControllerState,
  inputs: CleanLaunchInputs,
): boolean {
  if (state.candidate?.phase !== 'ready') return false;
  return inputs.otherLiveClientCount === 0;
}
