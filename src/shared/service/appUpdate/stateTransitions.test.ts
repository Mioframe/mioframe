import { describe, expect, it } from 'vitest';
import type { UpdateControllerState } from './contracts';
import {
  approveAutomaticRelease,
  approveManualRelease,
  buildInitialControllerState,
  cancelScheduledUpdate,
  commitActivation,
  applyCheckForUpdates,
  isActivationExpired,
  resolveAutomaticPreparationTarget,
  rollbackActivation,
  shouldStartActivation,
  startActivation,
  switchToAutomaticMode,
  switchToManualMode,
} from './stateTransitions';

const releaseA = {
  releaseId: 'release-a',
  releaseSequence: 1,
  appVersion: '1.0.0',
  buildId: 'build-a',
  buildDate: '2026-07-24T00:00:00.000Z',
};
const releaseB = {
  releaseId: 'release-b',
  releaseSequence: 2,
  appVersion: '1.1.0',
  buildId: 'build-b',
  buildDate: '2026-07-24T00:00:00.000Z',
};
const releaseC = {
  releaseId: 'release-c',
  releaseSequence: 3,
  appVersion: '1.2.0',
  buildId: 'build-c',
  buildDate: '2026-07-24T00:00:00.000Z',
};

const baseState: UpdateControllerState = {
  schemaVersion: 1,
  mode: 'manual',
  activeRelease: releaseA,
};

describe('buildInitialControllerState', () => {
  it('defaults to automatic mode with no recorded failure', () => {
    const state = buildInitialControllerState(releaseA);
    expect(state).toEqual({
      schemaVersion: 1,
      mode: 'automatic',
      activeRelease: releaseA,
    });
  });

  it('accepts an explicit initial mode', () => {
    expect(buildInitialControllerState(releaseA, 'manual').mode).toBe('manual');
  });
});

describe('applyCheckForUpdates', () => {
  it('updates latestRelease and lastSuccessfulCheckAt for a genuinely newer release', () => {
    const result = applyCheckForUpdates(baseState, releaseB, '2026-07-24T00:00:00.000Z');
    expect(result.outcome).toBe('updated');
    expect(result.state.latestRelease).toEqual(releaseB);
    expect(result.state.lastSuccessfulCheckAt).toBe('2026-07-24T00:00:00.000Z');
    expect(result.state.activeRelease).toEqual(releaseA);
  });

  it('ignores an older sequence than what is already known, but still records the check time', () => {
    const withLatest = { ...baseState, latestRelease: releaseB };
    const result = applyCheckForUpdates(withLatest, releaseA, '2026-07-24T00:00:00.000Z');
    expect(result.outcome).toBe('ignored-stale');
    expect(result.state.latestRelease).toEqual(releaseB);
    expect(result.state.lastSuccessfulCheckAt).toBe('2026-07-24T00:00:00.000Z');
  });

  it('ignores discovering the exact same release already known, without setting latestRelease', () => {
    const result = applyCheckForUpdates(baseState, releaseA, '2026-07-24T00:00:00.000Z');
    expect(result.outcome).toBe('ignored-stale');
    expect(result.state.latestRelease).toBeUndefined();
    expect(result.state.lastSuccessfulCheckAt).toBe('2026-07-24T00:00:00.000Z');
  });

  it('rejects a same-sequence conflicting identity as invalid metadata, preserving state completely untouched', () => {
    const withLatest = {
      ...baseState,
      latestRelease: releaseB,
      lastSuccessfulCheckAt: '2026-07-20T00:00:00.000Z',
    };
    const conflicting = {
      releaseId: 'release-b-imposter',
      releaseSequence: 2,
      appVersion: '1.1.0',
      buildId: 'build-b-imposter',
      buildDate: '2026-07-24T00:00:00.000Z',
    };
    const result = applyCheckForUpdates(withLatest, conflicting, '2026-07-24T00:00:00.000Z');
    expect(result.outcome).toBe('rejected-conflict');
    expect(result.state).toBe(withLatest);
    expect(result.state.latestRelease).toEqual(releaseB);
    expect(result.state.lastSuccessfulCheckAt).toBe('2026-07-20T00:00:00.000Z');
  });

  it('never changes activeRelease', () => {
    const result = applyCheckForUpdates(baseState, releaseB, '2026-07-24T00:00:00.000Z');
    expect(result.state.activeRelease).toEqual(baseState.activeRelease);
  });

  it('clears an obsolete recorded failure once a strictly newer release is discovered', () => {
    const withFailure = { ...baseState, failedActivationRelease: releaseB };
    const result = applyCheckForUpdates(withFailure, releaseC, '2026-07-24T00:00:00.000Z');
    expect(result.outcome).toBe('updated');
    expect(result.state.failedActivationRelease).toBeUndefined();
  });

  it('keeps a recorded failure when the discovery does not supersede it', () => {
    // The discovery is newer than what was previously known (activeRelease),
    // but not newer than the failed release itself, so the failure record
    // still describes the latest known state and must not be discarded.
    const withFailure = { ...baseState, failedActivationRelease: releaseC };
    const result = applyCheckForUpdates(withFailure, releaseB, '2026-07-24T00:00:00.000Z');
    expect(result.outcome).toBe('updated');
    expect(result.state.failedActivationRelease).toEqual(releaseC);
  });

  it('rejects a conflict against approvedRelease, even when latestRelease itself is unset', () => {
    const withApproved = { ...baseState, approvedRelease: releaseB };
    const conflicting = { ...releaseB, releaseId: 'release-b-imposter' };
    const result = applyCheckForUpdates(withApproved, conflicting, '2026-07-24T00:00:00.000Z');
    expect(result.outcome).toBe('rejected-conflict');
    expect(result.state).toBe(withApproved);
  });

  it('rejects a conflict against activation.targetRelease', () => {
    const withActivation: UpdateControllerState = {
      ...baseState,
      activation: { targetRelease: releaseB, deadlineAt: '2026-07-24T00:00:30.000Z' },
    };
    const conflicting = { ...releaseB, releaseId: 'release-b-imposter' };
    const result = applyCheckForUpdates(withActivation, conflicting, '2026-07-24T00:00:00.000Z');
    expect(result.outcome).toBe('rejected-conflict');
    expect(result.state).toBe(withActivation);
  });

  it('rejects a conflict against failedActivationRelease', () => {
    const withFailure = { ...baseState, failedActivationRelease: releaseB };
    const conflicting = { ...releaseB, releaseId: 'release-b-imposter' };
    const result = applyCheckForUpdates(withFailure, conflicting, '2026-07-24T00:00:00.000Z');
    expect(result.outcome).toBe('rejected-conflict');
    expect(result.state).toBe(withFailure);
  });

  it('rejects a same-releaseId, different-releaseSequence conflict against a known reference', () => {
    const withLatest = { ...baseState, latestRelease: releaseB };
    const conflicting = { ...releaseB, releaseSequence: 5 };
    const result = applyCheckForUpdates(withLatest, conflicting, '2026-07-24T00:00:00.000Z');
    expect(result.outcome).toBe('rejected-conflict');
    expect(result.state).toBe(withLatest);
  });
});

describe('approveManualRelease', () => {
  it('sets approvedRelease to the exact prepared release', () => {
    const state = approveManualRelease(baseState, releaseB);
    expect(state.approvedRelease).toEqual(releaseB);
  });

  it('does not require or consult latestRelease', () => {
    const withDifferentLatest = { ...baseState, latestRelease: releaseC };
    const state = approveManualRelease(withDifferentLatest, releaseB);
    expect(state.approvedRelease).toEqual(releaseB);
  });

  it('may approve the exact release recorded as previously failed (explicit Manual retry), when it is newer than activeRelease', () => {
    const withFailure = { ...baseState, failedActivationRelease: releaseB };
    const state = approveManualRelease(withFailure, releaseB);
    expect(state.approvedRelease).toEqual(releaseB);
  });

  it('does not approve the active release', () => {
    const state = approveManualRelease(baseState, releaseA);
    expect(state).toBe(baseState);
    expect(state.approvedRelease).toBeUndefined();
  });

  it('does not approve an older release than activeRelease', () => {
    const withNewerActive = { ...baseState, activeRelease: releaseB };
    const state = approveManualRelease(withNewerActive, releaseA);
    expect(state).toBe(withNewerActive);
    expect(state.approvedRelease).toBeUndefined();
  });

  it('is a no-op while an activation is already in progress', () => {
    const withActivation: UpdateControllerState = {
      ...baseState,
      activation: { targetRelease: releaseB, deadlineAt: '2026-07-24T00:00:30.000Z' },
    };
    const state = approveManualRelease(withActivation, releaseC);
    expect(state).toEqual(withActivation);
  });

  it('is a no-op outside Manual mode, even for an otherwise-valid release', () => {
    const automaticState: UpdateControllerState = { ...baseState, mode: 'automatic' };
    const state = approveManualRelease(automaticState, releaseB);
    expect(state).toBe(automaticState);
    expect(state.approvedRelease).toBeUndefined();
  });

  it('rejects a same-sequence conflict against latestRelease', () => {
    const withLatest = { ...baseState, latestRelease: releaseB };
    const conflicting = { ...releaseB, releaseId: 'release-b-imposter' };
    const state = approveManualRelease(withLatest, conflicting);
    expect(state).toBe(withLatest);
    expect(state.approvedRelease).toBeUndefined();
  });

  it('rejects a same-releaseId, different-releaseSequence conflict against an existing approvedRelease', () => {
    const withApproved = { ...baseState, approvedRelease: releaseB };
    const conflicting = { ...releaseB, releaseSequence: 5 };
    const state = approveManualRelease(withApproved, conflicting);
    expect(state).toBe(withApproved);
  });

  it('rejects a conflict against failedActivationRelease that is not an exact retry', () => {
    const withFailure = { ...baseState, failedActivationRelease: releaseB };
    const conflicting = { ...releaseB, releaseId: 'release-b-imposter' };
    const state = approveManualRelease(withFailure, conflicting);
    expect(state).toBe(withFailure);
  });

  it('rejects a conflict against activation.targetRelease', () => {
    // activation already short-circuits to a no-op before the conflict
    // check runs, but the outcome must still be the unchanged state.
    const withActivation: UpdateControllerState = {
      ...baseState,
      activation: { targetRelease: releaseB, deadlineAt: '2026-07-24T00:00:30.000Z' },
    };
    const conflicting = { ...releaseC, releaseSequence: releaseB.releaseSequence };
    const state = approveManualRelease(withActivation, conflicting);
    expect(state).toEqual(withActivation);
  });
});

describe('approveAutomaticRelease', () => {
  const automaticState: UpdateControllerState = { ...baseState, mode: 'automatic' };

  it('approves the first prepared release', () => {
    const state = approveAutomaticRelease(automaticState, releaseB);
    expect(state.approvedRelease).toEqual(releaseB);
  });

  it('moves the approval forward to a newer prepared release', () => {
    const withApproved = { ...automaticState, approvedRelease: releaseB };
    const state = approveAutomaticRelease(withApproved, releaseC);
    expect(state.approvedRelease).toEqual(releaseC);
  });

  it('does not replace an equal-or-newer approved release', () => {
    const withApproved = { ...automaticState, approvedRelease: releaseC };
    const state = approveAutomaticRelease(withApproved, releaseB);
    expect(state.approvedRelease).toEqual(releaseC);
  });

  it('never approves the exact release currently recorded as failed', () => {
    const withFailure = { ...automaticState, failedActivationRelease: releaseB };
    const state = approveAutomaticRelease(withFailure, releaseB);
    expect(state.approvedRelease).toBeUndefined();
  });

  it('approves a newer distinct release even when a different one is recorded as failed', () => {
    const withFailure = { ...automaticState, failedActivationRelease: releaseB };
    const state = approveAutomaticRelease(withFailure, releaseC);
    expect(state.approvedRelease).toEqual(releaseC);
  });

  it('does not approve the active release', () => {
    const state = approveAutomaticRelease(automaticState, releaseA);
    expect(state).toBe(automaticState);
    expect(state.approvedRelease).toBeUndefined();
  });

  it('does not approve an older release than activeRelease', () => {
    const withNewerActive = { ...automaticState, activeRelease: releaseB };
    const state = approveAutomaticRelease(withNewerActive, releaseA);
    expect(state).toBe(withNewerActive);
    expect(state.approvedRelease).toBeUndefined();
  });

  it('is a no-op while an activation is already in progress', () => {
    const withActivation: UpdateControllerState = {
      ...automaticState,
      activation: { targetRelease: releaseB, deadlineAt: '2026-07-24T00:00:30.000Z' },
    };
    const state = approveAutomaticRelease(withActivation, releaseC);
    expect(state).toEqual(withActivation);
  });

  it('rejects a same-sequence conflict against latestRelease', () => {
    const withLatest = { ...automaticState, latestRelease: releaseB };
    const conflicting = { ...releaseB, releaseId: 'release-b-imposter' };
    const state = approveAutomaticRelease(withLatest, conflicting);
    expect(state).toBe(withLatest);
    expect(state.approvedRelease).toBeUndefined();
  });

  it('rejects a same-releaseId, different-releaseSequence conflict against an existing approvedRelease', () => {
    const withApproved = { ...automaticState, approvedRelease: releaseB };
    const conflicting = { ...releaseC, releaseId: releaseB.releaseId };
    const state = approveAutomaticRelease(withApproved, conflicting);
    expect(state).toBe(withApproved);
  });

  it('is a no-op outside Automatic mode, even when the caller mistakenly calls it directly with Manual state', () => {
    // baseState is Manual mode: this is the transition's own fail-closed
    // invariant, not merely an orchestration convention — a stale Automatic
    // request must never be able to approve a release once a later request
    // has durably switched to Manual.
    const state = approveAutomaticRelease(baseState, releaseB);
    expect(state).toBe(baseState);
    expect(state.approvedRelease).toBeUndefined();
  });
});

describe('cancelScheduledUpdate', () => {
  it('clears a Manual scheduled approval', () => {
    const withApproved = { ...baseState, mode: 'manual' as const, approvedRelease: releaseB };
    const state = cancelScheduledUpdate(withApproved);
    expect(state.approvedRelease).toBeUndefined();
  });

  it('is a no-op for an Automatic approval, even sent directly: cancellation belongs only to Manual mode', () => {
    const automaticApproved: UpdateControllerState = {
      ...baseState,
      mode: 'automatic',
      approvedRelease: releaseB,
    };
    const state = cancelScheduledUpdate(automaticApproved);
    expect(state).toBe(automaticApproved);
    expect(state.approvedRelease).toEqual(releaseB);
  });

  it('is a no-op once activation has already started', () => {
    const withActivation: UpdateControllerState = {
      ...baseState,
      mode: 'manual',
      approvedRelease: releaseB,
      activation: { targetRelease: releaseB, deadlineAt: '2026-07-24T00:00:30.000Z' },
    };
    const state = cancelScheduledUpdate(withActivation);
    expect(state).toEqual(withActivation);
  });

  it('is a no-op when nothing is scheduled', () => {
    expect(cancelScheduledUpdate(baseState)).toEqual(baseState);
  });
});

describe('resolveAutomaticPreparationTarget', () => {
  const automaticState: UpdateControllerState = {
    ...baseState,
    mode: 'automatic',
    latestRelease: releaseB,
  };

  it('selects a strictly newer latestRelease in Automatic mode', () => {
    expect(resolveAutomaticPreparationTarget(automaticState)).toEqual(releaseB);
  });

  it('selects it regardless of whether this discovery is what set latestRelease (retry of an already-known release)', () => {
    // No discovery-outcome field is consulted at all — the same input shape
    // a stale-but-still-unprepared latestRelease produces after a prior
    // temporary preparation failure.
    expect(resolveAutomaticPreparationTarget(automaticState)).toEqual(releaseB);
  });

  it('returns undefined in Manual mode', () => {
    expect(
      resolveAutomaticPreparationTarget({ ...automaticState, mode: 'manual' }),
    ).toBeUndefined();
  });

  it('returns undefined when nothing has been discovered', () => {
    expect(resolveAutomaticPreparationTarget({ ...baseState, mode: 'automatic' })).toBeUndefined();
  });

  it('returns undefined when latestRelease is already active (not newer)', () => {
    const alreadyActive: UpdateControllerState = {
      ...automaticState,
      activeRelease: releaseB,
      latestRelease: releaseB,
    };
    expect(resolveAutomaticPreparationTarget(alreadyActive)).toBeUndefined();
  });

  it('returns undefined when latestRelease is already approved', () => {
    expect(
      resolveAutomaticPreparationTarget({ ...automaticState, approvedRelease: releaseB }),
    ).toBeUndefined();
  });

  it('still selects latestRelease when a different, older release is approved', () => {
    // approvedRelease and latestRelease can briefly diverge in Automatic
    // mode (e.g. approvedRelease from an earlier switch-to-automatic while a
    // newer release was independently discovered but not yet prepared).
    expect(
      resolveAutomaticPreparationTarget({ ...automaticState, approvedRelease: releaseA }),
    ).toEqual(releaseB);
  });

  it('returns undefined while an activation is in progress', () => {
    const withActivation: UpdateControllerState = {
      ...automaticState,
      activation: { targetRelease: releaseC, deadlineAt: '2026-07-24T00:00:30.000Z' },
    };
    expect(resolveAutomaticPreparationTarget(withActivation)).toBeUndefined();
  });

  it('returns undefined when latestRelease is the recorded failed activation release', () => {
    expect(
      resolveAutomaticPreparationTarget({ ...automaticState, failedActivationRelease: releaseB }),
    ).toBeUndefined();
  });

  it('still selects latestRelease when a different release is recorded as failed', () => {
    expect(
      resolveAutomaticPreparationTarget({ ...automaticState, failedActivationRelease: releaseC }),
    ).toEqual(releaseB);
  });
});

describe('switchToManualMode', () => {
  it('is a true no-op (same reference) when mode is already Manual', () => {
    const state = switchToManualMode(baseState);
    expect(state).toBe(baseState);
  });

  it('is a true no-op (same reference) when mode is already Manual, even with an existing Manual approval', () => {
    const manualApproved: UpdateControllerState = { ...baseState, approvedRelease: releaseB };
    const state = switchToManualMode(manualApproved);
    expect(state).toBe(manualApproved);
  });

  it('clears an unstarted automatic approval', () => {
    const automaticApproved: UpdateControllerState = {
      ...baseState,
      mode: 'automatic',
      approvedRelease: releaseB,
    };
    const state = switchToManualMode(automaticApproved);
    expect(state.mode).toBe('manual');
    expect(state.approvedRelease).toBeUndefined();
  });

  it('does not touch an in-progress activation or its approval', () => {
    const withActivation: UpdateControllerState = {
      ...baseState,
      mode: 'automatic',
      approvedRelease: releaseB,
      activation: { targetRelease: releaseB, deadlineAt: '2026-07-24T00:00:30.000Z' },
    };
    const state = switchToManualMode(withActivation);
    expect(state.mode).toBe('manual');
    expect(state.approvedRelease).toEqual(releaseB);
    expect(state.activation).toEqual(withActivation.activation);
  });
});

describe('switchToAutomaticMode', () => {
  it('sets mode without approving anything when nothing is prepared yet', () => {
    const state = switchToAutomaticMode(baseState);
    expect(state.mode).toBe('automatic');
    expect(state.approvedRelease).toBeUndefined();
  });

  it('approves a prepared latest release as part of the switch', () => {
    const state = switchToAutomaticMode(baseState, releaseB);
    expect(state.mode).toBe('automatic');
    expect(state.approvedRelease).toEqual(releaseB);
  });

  it('is a true no-op (same reference) when mode is already Automatic and nothing is prepared', () => {
    const automaticState: UpdateControllerState = { ...baseState, mode: 'automatic' };
    const state = switchToAutomaticMode(automaticState);
    expect(state).toBe(automaticState);
  });

  it('is a true no-op (same reference) when mode is already Automatic and the prepared release changes nothing (already approved)', () => {
    const alreadyApproved: UpdateControllerState = {
      ...baseState,
      mode: 'automatic',
      approvedRelease: releaseB,
    };
    const state = switchToAutomaticMode(alreadyApproved, releaseB);
    expect(state).toBe(alreadyApproved);
  });

  it('is still a real change when mode was Manual, even if the prepared release ends up approving nothing', () => {
    // Switching mode away from Manual is itself an observable change, even
    // when approveAutomaticRelease's own rules end up approving nothing.
    const state = switchToAutomaticMode(baseState, releaseA);
    expect(state).not.toBe(baseState);
    expect(state.mode).toBe('automatic');
    expect(state.approvedRelease).toBeUndefined();
  });
});

describe('shouldStartActivation', () => {
  const withApproved = { ...baseState, approvedRelease: releaseB };

  it('starts when no other same-channel window is live', () => {
    expect(shouldStartActivation(withApproved, { otherLiveClientCount: 0 })).toBe(true);
  });

  it('does not start when nothing is approved', () => {
    expect(shouldStartActivation(baseState, { otherLiveClientCount: 0 })).toBe(false);
  });

  it('does not start a new activation while another same-channel window is live', () => {
    expect(shouldStartActivation(withApproved, { otherLiveClientCount: 1 })).toBe(false);
  });

  it('does not start again once an activation already exists', () => {
    const withActivation: UpdateControllerState = {
      ...withApproved,
      activation: { targetRelease: releaseB, deadlineAt: '2026-07-24T00:00:30.000Z' },
    };
    expect(shouldStartActivation(withActivation, { otherLiveClientCount: 0 })).toBe(false);
  });
});

describe('startActivation', () => {
  it('persists activation of the approved release before it would be served, leaving activeRelease unchanged', () => {
    const withApproved = { ...baseState, approvedRelease: releaseB };
    const state = startActivation(withApproved, '2026-07-24T00:00:30.000Z');
    expect(state.activation).toEqual({
      targetRelease: releaseB,
      deadlineAt: '2026-07-24T00:00:30.000Z',
    });
    expect(state.activeRelease).toEqual(releaseA);
  });

  it('removes approvedRelease: approvedRelease and activation are mutually exclusive', () => {
    const withApproved = { ...baseState, approvedRelease: releaseB };
    const state = startActivation(withApproved, '2026-07-24T00:00:30.000Z');
    expect(state.approvedRelease).toBeUndefined();
    expect(state.activation).toEqual({
      targetRelease: releaseB,
      deadlineAt: '2026-07-24T00:00:30.000Z',
    });
  });

  it('is a no-op when an activation already exists, so concurrent launches never conflict', () => {
    const withApproved = { ...baseState, approvedRelease: releaseB };
    const withActivation = startActivation(withApproved, '2026-07-24T00:00:30.000Z');
    const again = startActivation(withActivation, '2026-07-24T00:05:30.000Z');
    expect(again).toEqual(withActivation);
  });

  it('is a no-op when there is no approval to activate, so it can never activate a release different from the approved one', () => {
    const state = startActivation(baseState, '2026-07-24T00:00:30.000Z');
    expect(state).toBe(baseState);
    expect(state.activation).toBeUndefined();
  });

  it('is a no-op when approvedRelease is not strictly newer than activeRelease', () => {
    const invalidApproval: UpdateControllerState = { ...baseState, approvedRelease: releaseA };
    const state = startActivation(invalidApproval, '2026-07-24T00:00:30.000Z');
    expect(state).toBe(invalidApproval);
  });

  it('is a no-op when the resulting activation would violate the canonical controller-state schema', () => {
    // approvedRelease is strictly newer than activeRelease on its own, but
    // conflicts (same sequence, different id) with latestRelease already
    // present in state — the resulting activation would carry that same
    // conflicting identity, which the canonical schema must reject.
    const conflictingLatest = { ...releaseB, releaseId: 'release-b-imposter' };
    const invalidState: UpdateControllerState = {
      ...baseState,
      approvedRelease: releaseB,
      latestRelease: conflictingLatest,
    };
    const state = startActivation(invalidState, '2026-07-24T00:00:30.000Z');
    expect(state).toBe(invalidState);
  });
});

const activatingState: UpdateControllerState = {
  ...baseState,
  approvedRelease: releaseB,
  activation: { targetRelease: releaseB, deadlineAt: '2026-07-24T00:00:30.000Z' },
};

describe('commitActivation', () => {
  it('commits the target as active and clears activation/approval', () => {
    const state = commitActivation(activatingState, releaseB.releaseId);
    expect(state.activeRelease).toEqual(releaseB);
    expect(state.activation).toBeUndefined();
    expect(state.approvedRelease).toBeUndefined();
  });

  it('clears a matching recorded failure (a successful retry clears it)', () => {
    const withPriorFailure = { ...activatingState, failedActivationRelease: releaseB };
    const state = commitActivation(withPriorFailure, releaseB.releaseId);
    expect(state.failedActivationRelease).toBeUndefined();
  });

  it('keeps an unrelated recorded failure untouched', () => {
    const withUnrelatedFailure = { ...activatingState, failedActivationRelease: releaseC };
    const state = commitActivation(withUnrelatedFailure, releaseB.releaseId);
    expect(state.failedActivationRelease).toEqual(releaseC);
  });

  it('ignores a BOOT_OK for a different release id', () => {
    const state = commitActivation(activatingState, 'some-other-release');
    expect(state).toEqual(activatingState);
  });

  it('ignores a BOOT_OK when there is no activation at all', () => {
    const state = commitActivation(baseState, releaseB.releaseId);
    expect(state).toEqual(baseState);
  });

  it('ignores a late BOOT_OK after the activation already committed', () => {
    const committed = commitActivation(activatingState, releaseB.releaseId);
    const late = commitActivation(committed, releaseB.releaseId);
    expect(late).toEqual(committed);
  });
});

describe('rollbackActivation', () => {
  it('leaves activeRelease unchanged and records the target as the single failed release', () => {
    const state = rollbackActivation(activatingState, releaseB.releaseId);
    expect(state.activeRelease).toEqual(releaseA);
    expect(state.activation).toBeUndefined();
    expect(state.approvedRelease).toBeUndefined();
    expect(state.failedActivationRelease).toEqual(releaseB);
  });

  it('replaces a previously recorded failure with only the new one', () => {
    const withPriorFailure = { ...activatingState, failedActivationRelease: releaseC };
    const state = rollbackActivation(withPriorFailure, releaseB.releaseId);
    expect(state.failedActivationRelease).toEqual(releaseB);
  });

  it('ignores a failure report for a different release id', () => {
    const state = rollbackActivation(activatingState, 'some-other-release');
    expect(state).toEqual(activatingState);
  });

  it('ignores a failure report when there is no activation at all', () => {
    const state = rollbackActivation(baseState, releaseB.releaseId);
    expect(state).toEqual(baseState);
  });

  it('ignores a late rollback after the activation already resolved', () => {
    const rolledBack = rollbackActivation(activatingState, releaseB.releaseId);
    const late = rollbackActivation(rolledBack, releaseB.releaseId);
    expect(late).toEqual(rolledBack);
  });

  it('supports expired/crashed rollback using the activation-owned target id', () => {
    // The worker itself detects expiry/crash and rolls back using the
    // persisted activation's own target id — no external report needed.
    const targetId = activatingState.activation?.targetRelease.releaseId;
    if (!targetId) throw new Error('Expected activatingState to have an activation');
    const state = rollbackActivation(activatingState, targetId);
    expect(state.activeRelease).toEqual(releaseA);
  });
});

describe('isActivationExpired', () => {
  it('is false when there is no activation', () => {
    expect(isActivationExpired(baseState, '2026-07-24T00:01:00.000Z')).toBe(false);
  });

  it('is false before the deadline', () => {
    expect(isActivationExpired(activatingState, '2026-07-24T00:00:10.000Z')).toBe(false);
  });

  it('is true at or after the deadline', () => {
    expect(isActivationExpired(activatingState, '2026-07-24T00:00:30.000Z')).toBe(true);
    expect(isActivationExpired(activatingState, '2026-07-24T00:01:00.000Z')).toBe(true);
  });
});
