import { describe, expect, it } from 'vitest';
import type { ReleaseIdentity } from './contracts';
import { createInitialReleaseControllerState } from './stateMachine';
import {
  associateReplacementNavigation,
  confirmReplacementBoot,
  createActivationTransaction,
  releaseForClient,
  rollbackExpiredActivation,
  rollbackFailedReplacementNavigation,
} from './activationTransaction';

const release = (letter: string, releaseSequence: number): ReleaseIdentity => ({
  releaseId: letter.repeat(40),
  releaseSequence,
  appVersion: '1.0.0',
  buildId: letter.repeat(7),
  buildDate: '2026-07-23T00:00:00.000Z',
});

describe('multi-client activation transaction', () => {
  it('maps old clients to replacements and commits only after every replacement boots', () => {
    const previous = release('a', 1);
    const target = release('b', 2);
    let state = createActivationTransaction({
      state: { ...createInitialReleaseControllerState(previous), preparedRelease: target },
      targetRelease: target,
      oldClientIds: ['old-1', 'old-2'],
      now: new Date('2026-07-23T00:00:00.000Z'),
      transactionId: 'tx',
    });
    state = associateReplacementNavigation(state, 'old-1', 'new-1');
    state = associateReplacementNavigation(state, 'old-2', 'new-2');
    expect(releaseForClient(state, 'new-2')).toEqual(target);
    state = confirmReplacementBoot(state, 'new-1', target.releaseId);
    expect(state.activeRelease).toEqual(previous);
    expect(state.activationTransaction).toBeDefined();
    state = confirmReplacementBoot(state, 'new-2', target.releaseId);
    expect(state.activeRelease).toEqual(target);
    expect(state.activationTransaction).toBeUndefined();
  });

  it('is idempotent for duplicate navigation/confirmation and rolls an expired trial back once', () => {
    const previous = release('a', 1);
    const target = release('b', 2);
    let state = createActivationTransaction({
      state: { ...createInitialReleaseControllerState(previous), preparedRelease: target },
      targetRelease: target,
      oldClientIds: ['old'],
      now: new Date('2026-07-23T00:00:00.000Z'),
      transactionId: 'tx',
      lifetimeMs: 1,
    });
    state = associateReplacementNavigation(state, 'old', 'new');
    expect(associateReplacementNavigation(state, 'old', 'new')).toEqual(state);
    state = rollbackExpiredActivation(state, new Date('2026-07-23T00:00:01.000Z'));
    expect(state.failedReleaseIds).toEqual([target.releaseId]);
    expect(rollbackExpiredActivation(state, new Date('2026-07-23T00:00:02.000Z'))).toEqual(state);
  });

  it('rolls back an unconfirmed replacement without mistaking another expected tab for failure', () => {
    const previous = release('a', 1);
    const target = release('b', 2);
    let state = createActivationTransaction({
      state: { ...createInitialReleaseControllerState(previous), preparedRelease: target },
      targetRelease: target,
      oldClientIds: ['old-1', 'old-2'],
      now: new Date('2026-07-23T00:00:00.000Z'),
      transactionId: 'tx',
    });
    state = associateReplacementNavigation(state, 'old-1', 'new-1');
    expect(rollbackFailedReplacementNavigation(state, 'old-2')).toEqual(state);
    state = associateReplacementNavigation(state, 'old-2', 'new-2');
    const rolledBack = rollbackFailedReplacementNavigation(state, 'new-1');
    expect(rolledBack.activeRelease).toEqual(previous);
    expect(rolledBack.failedReleaseIds).toEqual([target.releaseId]);
  });
});
