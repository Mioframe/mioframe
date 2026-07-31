import { describe, expect, it } from 'vitest';
import type { UpdateControllerState } from './contracts';
import {
  applyDiscovery,
  buildInitialControllerState,
  cancelScheduledUpdate,
  commitActivation,
  completeAutomaticPreparation,
  completeManualInstall,
  isActivationExpired,
  resolveAutomaticPreparationTarget,
  rollbackActivation,
  setMode,
  shouldStartActivation,
  startActivation,
} from './stateTransitions';

const releaseA = {
  releaseNumber: 1,
  appVersion: '1.0.0',
  buildId: 'build-a',
  buildDate: '2026-07-24T00:00:00.000Z',
};
const releaseB = {
  releaseNumber: 2,
  appVersion: '1.1.0',
  buildId: 'build-b',
  buildDate: '2026-07-24T00:00:00.000Z',
};
const releaseC = {
  releaseNumber: 3,
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
  it('defaults to automatic mode with no candidate', () => {
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

describe('applyDiscovery', () => {
  it('sets an available candidate for a genuinely newer release, from no candidate', () => {
    const result = applyDiscovery(baseState, releaseB, '2026-07-24T00:00:00.000Z');
    expect(result.outcome).toBe('updated');
    expect(result.state.candidate).toEqual({ phase: 'available', release: releaseB });
    expect(result.state.lastSuccessfulCheckAt).toBe('2026-07-24T00:00:00.000Z');
    expect(result.state.activeRelease).toEqual(releaseA);
  });

  it('replaces an available candidate with a strictly newer discovery', () => {
    const withAvailable: UpdateControllerState = {
      ...baseState,
      candidate: { phase: 'available', release: releaseB },
    };
    const result = applyDiscovery(withAvailable, releaseC, '2026-07-24T00:00:00.000Z');
    expect(result.outcome).toBe('updated');
    expect(result.state.candidate).toEqual({ phase: 'available', release: releaseC });
  });

  it('ignores an older or equal discovery than the current available candidate, but still records the check time', () => {
    const withAvailable: UpdateControllerState = {
      ...baseState,
      candidate: { phase: 'available', release: releaseB },
    };
    const result = applyDiscovery(withAvailable, releaseB, '2026-07-24T00:00:00.000Z');
    expect(result.outcome).toBe('ignored-stale');
    expect(result.state.candidate).toEqual(withAvailable.candidate);
    expect(result.state.lastSuccessfulCheckAt).toBe('2026-07-24T00:00:00.000Z');
  });

  it('ignores discovering the exact active release when there is no candidate yet, without setting a candidate', () => {
    const result = applyDiscovery(baseState, releaseA, '2026-07-24T00:00:00.000Z');
    expect(result.outcome).toBe('ignored-stale');
    expect(result.state.candidate).toBeUndefined();
    expect(result.state.lastSuccessfulCheckAt).toBe('2026-07-24T00:00:00.000Z');
  });

  it('never changes activeRelease', () => {
    const result = applyDiscovery(baseState, releaseB, '2026-07-24T00:00:00.000Z');
    expect(result.state.activeRelease).toEqual(baseState.activeRelease);
  });

  it('replaces a failed candidate with a strictly newer discovery', () => {
    const withFailed: UpdateControllerState = {
      ...baseState,
      candidate: { phase: 'failed', release: releaseB },
    };
    const result = applyDiscovery(withFailed, releaseC, '2026-07-24T00:00:00.000Z');
    expect(result.outcome).toBe('updated');
    expect(result.state.candidate).toEqual({ phase: 'available', release: releaseC });
  });

  it('never retries the exact failed release through discovery (automatic retry-avoidance)', () => {
    const withFailed: UpdateControllerState = {
      ...baseState,
      candidate: { phase: 'failed', release: releaseB },
    };
    const result = applyDiscovery(withFailed, releaseB, '2026-07-24T00:00:00.000Z');
    expect(result.outcome).toBe('ignored-stale');
    expect(result.state.candidate).toEqual(withFailed.candidate);
  });

  it('is a true no-op (same reference, no lastSuccessfulCheckAt change) for a ready candidate: discovery is skipped', () => {
    const withReady: UpdateControllerState = {
      ...baseState,
      candidate: { phase: 'ready', release: releaseB },
    };
    const result = applyDiscovery(withReady, releaseC, '2026-07-24T00:00:00.000Z');
    expect(result.outcome).toBe('skipped');
    expect(result.state).toBe(withReady);
  });

  it('is a true no-op (same reference) for an activating candidate: discovery is skipped', () => {
    const withActivating: UpdateControllerState = {
      ...baseState,
      candidate: { phase: 'activating', release: releaseB, deadlineAt: '2026-07-24T00:00:30.000Z' },
    };
    const result = applyDiscovery(withActivating, releaseC, '2026-07-24T00:00:00.000Z');
    expect(result.outcome).toBe('skipped');
    expect(result.state).toBe(withActivating);
  });
});

describe('resolveAutomaticPreparationTarget', () => {
  it('selects a strictly newer available candidate in Automatic mode', () => {
    const automaticAvailable: UpdateControllerState = {
      ...baseState,
      mode: 'automatic',
      candidate: { phase: 'available', release: releaseB },
    };
    expect(resolveAutomaticPreparationTarget(automaticAvailable)).toEqual(releaseB);
  });

  it('returns undefined in Manual mode', () => {
    const manualAvailable: UpdateControllerState = {
      ...baseState,
      mode: 'manual',
      candidate: { phase: 'available', release: releaseB },
    };
    expect(resolveAutomaticPreparationTarget(manualAvailable)).toBeUndefined();
  });

  it('returns undefined when there is no candidate', () => {
    expect(resolveAutomaticPreparationTarget({ ...baseState, mode: 'automatic' })).toBeUndefined();
  });

  it.each(['ready', 'activating', 'failed'] as const)(
    'returns undefined for a %s candidate',
    (phase) => {
      const candidate =
        phase === 'activating'
          ? ({ phase, release: releaseB, deadlineAt: '2026-07-24T00:00:30.000Z' } as const)
          : ({ phase, release: releaseB } as const);
      const state: UpdateControllerState = { ...baseState, mode: 'automatic', candidate };
      expect(resolveAutomaticPreparationTarget(state)).toBeUndefined();
    },
  );
});

describe('completeAutomaticPreparation', () => {
  const automaticAvailable: UpdateControllerState = {
    ...baseState,
    mode: 'automatic',
    candidate: { phase: 'available', release: releaseB },
  };

  it('moves available(B) to ready(B) for an exact match', () => {
    const state = completeAutomaticPreparation(automaticAvailable, releaseB.releaseNumber);
    expect(state.candidate).toEqual({ phase: 'ready', release: releaseB });
  });

  it('is a no-op (same reference) when mode changed to Manual in the meantime', () => {
    const manualAvailable: UpdateControllerState = { ...automaticAvailable, mode: 'manual' };
    const state = completeAutomaticPreparation(manualAvailable, releaseB.releaseNumber);
    expect(state).toBe(manualAvailable);
  });

  it('is a no-op (same reference) when the candidate release number changed in the meantime', () => {
    const replaced: UpdateControllerState = {
      ...automaticAvailable,
      candidate: { phase: 'available', release: releaseC },
    };
    const state = completeAutomaticPreparation(replaced, releaseB.releaseNumber);
    expect(state).toBe(replaced);
  });

  it('is a no-op (same reference) when the candidate already advanced past available', () => {
    const ready: UpdateControllerState = {
      ...automaticAvailable,
      candidate: { phase: 'ready', release: releaseB },
    };
    const state = completeAutomaticPreparation(ready, releaseB.releaseNumber);
    expect(state).toBe(ready);
  });

  it('is a no-op (same reference) when there is no candidate at all', () => {
    const state = completeAutomaticPreparation(
      { ...baseState, mode: 'automatic' },
      releaseB.releaseNumber,
    );
    expect(state).toEqual({ ...baseState, mode: 'automatic' });
  });
});

describe('completeManualInstall', () => {
  const manualAvailable: UpdateControllerState = {
    ...baseState,
    mode: 'manual',
    candidate: { phase: 'available', release: releaseB },
  };

  it('moves available(B) to ready(B) for an exact match', () => {
    const state = completeManualInstall(manualAvailable, releaseB.releaseNumber);
    expect(state.candidate).toEqual({ phase: 'ready', release: releaseB });
  });

  it('moves failed(B) to ready(B): an explicit Manual retry', () => {
    const manualFailed: UpdateControllerState = {
      ...baseState,
      mode: 'manual',
      candidate: { phase: 'failed', release: releaseB },
    };
    const state = completeManualInstall(manualFailed, releaseB.releaseNumber);
    expect(state.candidate).toEqual({ phase: 'ready', release: releaseB });
  });

  it('is a no-op (same reference) when mode changed to Automatic in the meantime', () => {
    const automaticAvailable: UpdateControllerState = { ...manualAvailable, mode: 'automatic' };
    const state = completeManualInstall(automaticAvailable, releaseB.releaseNumber);
    expect(state).toBe(automaticAvailable);
  });

  it('is a no-op (same reference) when the candidate release number changed in the meantime', () => {
    const replaced: UpdateControllerState = {
      ...manualAvailable,
      candidate: { phase: 'available', release: releaseC },
    };
    const state = completeManualInstall(replaced, releaseB.releaseNumber);
    expect(state).toBe(replaced);
  });

  it('is a no-op (same reference) when the candidate is ready or activating', () => {
    const ready: UpdateControllerState = {
      ...manualAvailable,
      candidate: { phase: 'ready', release: releaseB },
    };
    expect(completeManualInstall(ready, releaseB.releaseNumber)).toBe(ready);
  });

  it('is a no-op (same reference) when there is no candidate at all', () => {
    const state = completeManualInstall({ ...baseState, mode: 'manual' }, releaseB.releaseNumber);
    expect(state).toEqual({ ...baseState, mode: 'manual' });
  });
});

describe('cancelScheduledUpdate', () => {
  it('returns a Manual ready candidate to available, for the same release', () => {
    const manualReady: UpdateControllerState = {
      ...baseState,
      mode: 'manual',
      candidate: { phase: 'ready', release: releaseB },
    };
    const state = cancelScheduledUpdate(manualReady);
    expect(state.candidate).toEqual({ phase: 'available', release: releaseB });
  });

  it('is a no-op for an Automatic ready candidate, even sent directly: cancellation belongs only to Manual mode', () => {
    const automaticReady: UpdateControllerState = {
      ...baseState,
      mode: 'automatic',
      candidate: { phase: 'ready', release: releaseB },
    };
    const state = cancelScheduledUpdate(automaticReady);
    expect(state).toBe(automaticReady);
  });

  it('is a no-op when nothing is scheduled', () => {
    expect(cancelScheduledUpdate(baseState)).toBe(baseState);
  });

  it('is a no-op for an available candidate', () => {
    const manualAvailable: UpdateControllerState = {
      ...baseState,
      mode: 'manual',
      candidate: { phase: 'available', release: releaseB },
    };
    expect(cancelScheduledUpdate(manualAvailable)).toBe(manualAvailable);
  });
});

describe('setMode', () => {
  it('changes only mode', () => {
    const withCandidate: UpdateControllerState = {
      ...baseState,
      candidate: { phase: 'available', release: releaseB },
    };
    const state = setMode(withCandidate, 'automatic');
    expect(state.mode).toBe('automatic');
    expect(state.candidate).toEqual(withCandidate.candidate);
  });

  it('never clears a ready or activating candidate', () => {
    const withReady: UpdateControllerState = {
      ...baseState,
      candidate: { phase: 'ready', release: releaseB },
    };
    expect(setMode(withReady, 'automatic').candidate).toEqual(withReady.candidate);
  });

  it('is a true no-op (same reference) when the mode already matches', () => {
    const state = setMode(baseState, 'manual');
    expect(state).toBe(baseState);
  });
});

describe('shouldStartActivation', () => {
  const withReady: UpdateControllerState = {
    ...baseState,
    candidate: { phase: 'ready', release: releaseB },
  };

  it('starts when no other same-channel window is live', () => {
    expect(shouldStartActivation(withReady, { otherLiveClientCount: 0 })).toBe(true);
  });

  it('does not start when nothing is ready', () => {
    expect(shouldStartActivation(baseState, { otherLiveClientCount: 0 })).toBe(false);
  });

  it('does not start when the candidate is only available (not yet ready)', () => {
    const withAvailable: UpdateControllerState = {
      ...baseState,
      candidate: { phase: 'available', release: releaseB },
    };
    expect(shouldStartActivation(withAvailable, { otherLiveClientCount: 0 })).toBe(false);
  });

  it('does not start a new activation while another same-channel window is live', () => {
    expect(shouldStartActivation(withReady, { otherLiveClientCount: 1 })).toBe(false);
  });

  it('does not start again once an activation already exists', () => {
    const withActivating: UpdateControllerState = {
      ...baseState,
      candidate: { phase: 'activating', release: releaseB, deadlineAt: '2026-07-24T00:00:30.000Z' },
    };
    expect(shouldStartActivation(withActivating, { otherLiveClientCount: 0 })).toBe(false);
  });
});

describe('startActivation', () => {
  const withReady: UpdateControllerState = {
    ...baseState,
    candidate: { phase: 'ready', release: releaseB },
  };

  it('activates the ready candidate, leaving activeRelease unchanged', () => {
    const state = startActivation(withReady, '2026-07-24T00:00:30.000Z');
    expect(state.candidate).toEqual({
      phase: 'activating',
      release: releaseB,
      deadlineAt: '2026-07-24T00:00:30.000Z',
    });
    expect(state.activeRelease).toEqual(releaseA);
  });

  it('is a no-op when an activation already exists, so concurrent launches never conflict', () => {
    const withActivation = startActivation(withReady, '2026-07-24T00:00:30.000Z');
    const again = startActivation(withActivation, '2026-07-24T00:05:30.000Z');
    expect(again).toBe(withActivation);
  });

  it('is a no-op when there is no ready candidate to activate', () => {
    const state = startActivation(baseState, '2026-07-24T00:00:30.000Z');
    expect(state).toBe(baseState);
  });

  it('is a no-op when the candidate is only available (not yet ready)', () => {
    const withAvailable: UpdateControllerState = {
      ...baseState,
      candidate: { phase: 'available', release: releaseB },
    };
    expect(startActivation(withAvailable, '2026-07-24T00:00:30.000Z')).toBe(withAvailable);
  });
});

const activatingState: UpdateControllerState = {
  ...baseState,
  candidate: { phase: 'activating', release: releaseB, deadlineAt: '2026-07-24T00:00:30.000Z' },
};

describe('commitActivation', () => {
  it('commits the target as active and clears the candidate', () => {
    const state = commitActivation(activatingState, releaseB.releaseNumber);
    expect(state.activeRelease).toEqual(releaseB);
    expect(state.candidate).toBeUndefined();
  });

  it('ignores a BOOT_OK for a different release number', () => {
    const state = commitActivation(activatingState, releaseC.releaseNumber);
    expect(state).toBe(activatingState);
  });

  it('ignores a BOOT_OK when there is no activation at all', () => {
    const state = commitActivation(baseState, releaseB.releaseNumber);
    expect(state).toBe(baseState);
  });

  it('ignores a BOOT_OK when the candidate is not activating', () => {
    const withReady: UpdateControllerState = {
      ...baseState,
      candidate: { phase: 'ready', release: releaseB },
    };
    expect(commitActivation(withReady, releaseB.releaseNumber)).toBe(withReady);
  });

  it('ignores a late BOOT_OK after the activation already committed', () => {
    const committed = commitActivation(activatingState, releaseB.releaseNumber);
    const late = commitActivation(committed, releaseB.releaseNumber);
    expect(late).toBe(committed);
  });
});

describe('rollbackActivation', () => {
  it('leaves activeRelease unchanged and records the target as failed', () => {
    const state = rollbackActivation(activatingState, releaseB.releaseNumber);
    expect(state.activeRelease).toEqual(releaseA);
    expect(state.candidate).toEqual({ phase: 'failed', release: releaseB });
  });

  it('ignores a failure report for a different release number', () => {
    const state = rollbackActivation(activatingState, releaseC.releaseNumber);
    expect(state).toBe(activatingState);
  });

  it('ignores a failure report when there is no activation at all', () => {
    const state = rollbackActivation(baseState, releaseB.releaseNumber);
    expect(state).toBe(baseState);
  });

  it('ignores a late rollback after the activation already resolved', () => {
    const rolledBack = rollbackActivation(activatingState, releaseB.releaseNumber);
    const late = rollbackActivation(rolledBack, releaseB.releaseNumber);
    expect(late).toBe(rolledBack);
  });

  it('supports expired/crashed rollback using the activation-owned target number', () => {
    // The worker itself detects expiry/crash and rolls back using the
    // persisted activation's own target number — no external report needed.
    const targetNumber =
      activatingState.candidate?.phase === 'activating'
        ? activatingState.candidate.release.releaseNumber
        : undefined;
    if (targetNumber === undefined) throw new Error('Expected activatingState to be activating');
    const state = rollbackActivation(activatingState, targetNumber);
    expect(state.activeRelease).toEqual(releaseA);
  });
});

describe('isActivationExpired', () => {
  it('is false when there is no candidate', () => {
    expect(isActivationExpired(baseState, '2026-07-24T00:01:00.000Z')).toBe(false);
  });

  it('is false when the candidate is not activating', () => {
    const withReady: UpdateControllerState = {
      ...baseState,
      candidate: { phase: 'ready', release: releaseB },
    };
    expect(isActivationExpired(withReady, '2026-07-24T00:01:00.000Z')).toBe(false);
  });

  it('is false before the deadline', () => {
    expect(isActivationExpired(activatingState, '2026-07-24T00:00:10.000Z')).toBe(false);
  });

  it('is true at or after the deadline', () => {
    expect(isActivationExpired(activatingState, '2026-07-24T00:00:30.000Z')).toBe(true);
    expect(isActivationExpired(activatingState, '2026-07-24T00:01:00.000Z')).toBe(true);
  });
});
