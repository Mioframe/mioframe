/* eslint-disable jsdoc/require-jsdoc -- Pure transition names and typed inputs/outputs define the internal state-machine contract. */
import type { ReleaseControllerState, ReleaseIdentity } from './contracts';
import { RELEASE_CONTROLLER_SCHEMA_VERSION, releaseControllerStateSchema } from './contracts';

export const createInitialReleaseControllerState = (
  release: ReleaseIdentity,
): ReleaseControllerState => ({
  schemaVersion: RELEASE_CONTROLLER_SCHEMA_VERSION,
  mode: 'automatic',
  activeRelease: release,
});

export const migrateReleaseControllerState = (
  value: unknown,
  currentRelease: ReleaseIdentity,
): ReleaseControllerState => {
  const parsed = releaseControllerStateSchema.safeParse(value);
  return parsed.success ? parsed.data : createInitialReleaseControllerState(currentRelease);
};

export const confirmLatestRelease = (
  state: ReleaseControllerState,
  release: ReleaseIdentity,
  checkedAt: string,
): ReleaseControllerState => ({
  ...state,
  confirmedLatestRelease: release,
  lastSuccessfulCheckAt: checkedAt,
});

export const markCandidateReady = (
  state: ReleaseControllerState,
  candidate: ReleaseIdentity,
): ReleaseControllerState =>
  state.mode === 'automatic' && candidate.releaseId !== state.failedReleaseId
    ? { ...state, candidateRelease: candidate }
    : state;

export const setAutomaticMode = (
  state: ReleaseControllerState,
  enabled: boolean,
  runningRelease: ReleaseIdentity,
): ReleaseControllerState =>
  enabled
    ? { ...state, mode: 'automatic', pinnedRelease: undefined }
    : {
        ...state,
        mode: 'manual',
        activeRelease: runningRelease,
        pinnedRelease: runningRelease,
        candidateRelease: undefined,
      };

export const beginBootAttempt = (
  state: ReleaseControllerState,
  release: ReleaseIdentity,
): ReleaseControllerState => ({
  ...state,
  previousRelease: state.activeRelease,
  bootAttempt: release,
  bootNavigationServed: false,
  bootExpectedClientIds: undefined,
  candidateRelease: undefined,
});

export const confirmBoot = (
  state: ReleaseControllerState,
  releaseId: string,
): ReleaseControllerState => {
  if (state.bootAttempt?.releaseId !== releaseId) return state;
  const activeRelease = state.bootAttempt;
  return {
    ...state,
    activeRelease,
    pinnedRelease: state.mode === 'manual' ? activeRelease : state.pinnedRelease,
    bootAttempt: undefined,
    bootNavigationServed: undefined,
    bootExpectedClientIds: undefined,
    failedReleaseId:
      state.failedReleaseId === activeRelease.releaseId ? undefined : state.failedReleaseId,
  };
};

export const rollbackUnconfirmedBoot = (state: ReleaseControllerState): ReleaseControllerState => {
  if (!state.bootAttempt || !state.previousRelease) return state;
  return {
    ...state,
    activeRelease: state.previousRelease,
    pinnedRelease: state.mode === 'manual' ? state.previousRelease : state.pinnedRelease,
    failedReleaseId: state.bootAttempt.releaseId,
    bootAttempt: undefined,
    bootNavigationServed: undefined,
    bootExpectedClientIds: undefined,
    candidateRelease: undefined,
  };
};
/* eslint-enable jsdoc/require-jsdoc -- End pure controller transitions. */
