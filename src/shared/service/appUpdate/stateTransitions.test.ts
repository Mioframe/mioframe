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
  rollbackActivation,
  shouldStartActivation,
  startActivation,
  switchToAutomaticMode,
  switchToManualMode,
} from './stateTransitions';

const releaseA = { releaseId: 'release-a', releaseSequence: 1 };
const releaseB = { releaseId: 'release-b', releaseSequence: 2 };
const releaseC = { releaseId: 'release-c', releaseSequence: 3 };

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

  it('rejects a same-sequence conflicting identity as invalid metadata', () => {
    const withLatest = { ...baseState, latestRelease: releaseB };
    const conflicting = { releaseId: 'release-b-imposter', releaseSequence: 2 };
    const result = applyCheckForUpdates(withLatest, conflicting, '2026-07-24T00:00:00.000Z');
    expect(result.outcome).toBe('rejected-conflict');
    expect(result.state.latestRelease).toEqual(releaseB);
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

  it('may approve the exact release recorded as previously failed (explicit Manual retry)', () => {
    const withFailure = { ...baseState, failedActivationRelease: releaseB };
    const state = approveManualRelease(withFailure, releaseB);
    expect(state.approvedRelease).toEqual(releaseB);
  });

  it('is a no-op while an activation is already in progress', () => {
    const withActivation: UpdateControllerState = {
      ...baseState,
      activation: { targetRelease: releaseB, deadlineAt: '2026-07-24T00:00:30.000Z' },
    };
    const state = approveManualRelease(withActivation, releaseC);
    expect(state).toEqual(withActivation);
  });
});

describe('approveAutomaticRelease', () => {
  it('approves the first prepared release', () => {
    const state = approveAutomaticRelease(baseState, releaseB);
    expect(state.approvedRelease).toEqual(releaseB);
  });

  it('moves the approval forward to a newer prepared release', () => {
    const withApproved = { ...baseState, approvedRelease: releaseB };
    const state = approveAutomaticRelease(withApproved, releaseC);
    expect(state.approvedRelease).toEqual(releaseC);
  });

  it('does not replace an equal-or-newer approved release', () => {
    const withApproved = { ...baseState, approvedRelease: releaseC };
    const state = approveAutomaticRelease(withApproved, releaseB);
    expect(state.approvedRelease).toEqual(releaseC);
  });

  it('never approves the exact release currently recorded as failed', () => {
    const withFailure = { ...baseState, failedActivationRelease: releaseB };
    const state = approveAutomaticRelease(withFailure, releaseB);
    expect(state.approvedRelease).toBeUndefined();
  });

  it('approves a newer distinct release even when a different one is recorded as failed', () => {
    const withFailure = { ...baseState, failedActivationRelease: releaseB };
    const state = approveAutomaticRelease(withFailure, releaseC);
    expect(state.approvedRelease).toEqual(releaseC);
  });

  it('is a no-op while an activation is already in progress', () => {
    const withActivation: UpdateControllerState = {
      ...baseState,
      activation: { targetRelease: releaseB, deadlineAt: '2026-07-24T00:00:30.000Z' },
    };
    const state = approveAutomaticRelease(withActivation, releaseC);
    expect(state).toEqual(withActivation);
  });
});

describe('cancelScheduledUpdate', () => {
  it('clears a scheduled approval', () => {
    const withApproved = { ...baseState, approvedRelease: releaseB };
    const state = cancelScheduledUpdate(withApproved);
    expect(state.approvedRelease).toBeUndefined();
  });

  it('is a no-op once activation has already started', () => {
    const withActivation: UpdateControllerState = {
      ...baseState,
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

describe('switchToManualMode', () => {
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
});

describe('shouldStartActivation', () => {
  const withApproved = { ...baseState, approvedRelease: releaseB };

  it('starts on the first clean launch: no other windows, not a reload', () => {
    expect(
      shouldStartActivation(withApproved, {
        isReloadOfControlledClient: false,
        otherLiveClientCount: 0,
      }),
    ).toBe(true);
  });

  it('does not start when nothing is approved', () => {
    expect(
      shouldStartActivation(baseState, {
        isReloadOfControlledClient: false,
        otherLiveClientCount: 0,
      }),
    ).toBe(false);
  });

  it('does not start for an ordinary reload of an existing session', () => {
    expect(
      shouldStartActivation(withApproved, {
        isReloadOfControlledClient: true,
        otherLiveClientCount: 0,
      }),
    ).toBe(false);
  });

  it('does not start a new activation while another same-channel window is live', () => {
    expect(
      shouldStartActivation(withApproved, {
        isReloadOfControlledClient: false,
        otherLiveClientCount: 1,
      }),
    ).toBe(false);
  });

  it('does not start again once an activation already exists', () => {
    const withActivation: UpdateControllerState = {
      ...withApproved,
      activation: { targetRelease: releaseB, deadlineAt: '2026-07-24T00:00:30.000Z' },
    };
    expect(
      shouldStartActivation(withActivation, {
        isReloadOfControlledClient: false,
        otherLiveClientCount: 0,
      }),
    ).toBe(false);
  });
});

describe('startActivation', () => {
  it('persists activation before the target would be served, leaving activeRelease unchanged', () => {
    const state = startActivation(baseState, releaseB, '2026-07-24T00:00:30.000Z');
    expect(state.activation).toEqual({
      targetRelease: releaseB,
      deadlineAt: '2026-07-24T00:00:30.000Z',
    });
    expect(state.activeRelease).toEqual(releaseA);
  });

  it('removes approvedRelease: approvedRelease and activation are mutually exclusive', () => {
    const withApproved = { ...baseState, approvedRelease: releaseB };
    const state = startActivation(withApproved, releaseB, '2026-07-24T00:00:30.000Z');
    expect(state.approvedRelease).toBeUndefined();
    expect(state.activation).toEqual({
      targetRelease: releaseB,
      deadlineAt: '2026-07-24T00:00:30.000Z',
    });
  });

  it('is a no-op when an activation already exists, so concurrent launches never conflict', () => {
    const withActivation = startActivation(baseState, releaseB, '2026-07-24T00:00:30.000Z');
    const again = startActivation(withActivation, releaseC, '2026-07-24T00:05:30.000Z');
    expect(again).toEqual(withActivation);
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
