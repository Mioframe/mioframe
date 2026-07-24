import { describe, expect, it } from 'vitest';
import type { ReleaseControllerState, ReleaseIdentity } from './contracts';
import { createInitialReleaseControllerState } from './stateMachine';
import {
  associateTrialNavigation,
  confirmTrialBoot,
  createTrial,
  rollbackExpiredTrial,
  rollbackFailedTrialBoot,
  selectServedRelease,
} from './trial';

const release = (letter: string, releaseSequence: number): ReleaseIdentity => ({
  releaseId: letter.repeat(40),
  releaseSequence,
  appVersion: '1.0.0',
  buildId: letter.repeat(7),
  buildDate: '2026-07-23T00:00:00.000Z',
});

const active = release('a', 1);
const target = release('b', 2);
const now = new Date('2026-07-23T00:00:00.000Z');

const preparedState = (mode: 'automatic' | 'manual' = 'automatic'): ReleaseControllerState => ({
  ...createInitialReleaseControllerState(active),
  mode,
  ...(mode === 'manual' && { pinnedRelease: active }),
  latestRelease: target,
  preparation: { status: 'ready', release: target },
});

describe('single-window trial', () => {
  it('serves the trial target only to the exact claiming client, and the committed release to everyone else', () => {
    expect(selectServedRelease(preparedState(), 'client-1')).toEqual(active);
    const started = createTrial({
      state: preparedState(),
      targetRelease: target,
      now,
      initiatingClientId: 'client-1',
    });
    expect(selectServedRelease(started, 'client-1')).toEqual(target);
    expect(selectServedRelease(started, 'someone-else')).toEqual(active);
  });

  it('claims an unclaimed trial for the first navigation and rolls back a repeat from that same client before confirmation', () => {
    const started = createTrial({ state: preparedState('manual'), targetRelease: target, now });
    expect(started.trial?.initiatingClientId).toBeUndefined();

    const claimed = associateTrialNavigation(started, 'client-1');
    expect(claimed.trial).toMatchObject({ initiatingClientId: 'client-1' });
    expect(claimed.activeRelease).toEqual(active);
    expect(selectServedRelease(claimed, 'client-1')).toEqual(target);

    const retried = associateTrialNavigation(claimed, 'client-1');
    expect(retried.trial).toBeUndefined();
    expect(retried.activeRelease).toEqual(active);
    expect(retried.pinnedRelease).toEqual(active);
    expect(retried.preparation).toEqual({ status: 'failed', release: target });
    expect(retried.failedReleaseIds).toEqual([target.releaseId]);
  });

  it('leaves a claimed trial untouched when an unrelated client navigates, and the claiming client can still confirm afterward', () => {
    const started = createTrial({ state: preparedState('manual'), targetRelease: target, now });
    const claimed = associateTrialNavigation(started, 'client-1');

    const afterOtherNavigation = associateTrialNavigation(claimed, 'client-2');
    expect(afterOtherNavigation).toBe(claimed);
    expect(afterOtherNavigation.trial).toMatchObject({ initiatingClientId: 'client-1' });

    // The unrelated client keeps receiving the committed release and cannot confirm the trial.
    expect(selectServedRelease(afterOtherNavigation, 'client-2')).toEqual(active);
    expect(confirmTrialBoot(afterOtherNavigation, 'client-2', target.releaseId)).toBe(
      afterOtherNavigation,
    );

    // The claiming client can still confirm after the unrelated navigation.
    const committed = confirmTrialBoot(afterOtherNavigation, 'client-1', target.releaseId);
    expect(committed.trial).toBeUndefined();
    expect(committed.activeRelease).toEqual(target);
  });

  it('does not touch state when no trial is active', () => {
    const state = preparedState();
    expect(associateTrialNavigation(state, 'client-1')).toBe(state);
    expect(confirmTrialBoot(state, 'client-1', target.releaseId)).toBe(state);
    expect(rollbackExpiredTrial(state, now)).toBe(state);
    expect(rollbackFailedTrialBoot(state)).toBe(state);
  });

  it('commits only when both the confirming client and release match the trial', () => {
    const started = createTrial({
      state: preparedState(),
      targetRelease: target,
      now,
      initiatingClientId: 'client-1',
    });
    // Wrong release from the claiming client.
    expect(confirmTrialBoot(started, 'client-1', active.releaseId)).toBe(started);
    // Correct release from a client other than the one that claimed the trial.
    expect(confirmTrialBoot(started, 'someone-else', target.releaseId)).toBe(started);

    const committed = confirmTrialBoot(started, 'client-1', target.releaseId);
    expect(committed.trial).toBeUndefined();
    expect(committed.activeRelease).toEqual(target);
    expect(committed.preparation).toEqual({ status: 'idle' });
    expect(committed.failedReleaseIds).toEqual([]);
  });

  it('never commits an unclaimed trial (no client has confirmed yet)', () => {
    const started = createTrial({ state: preparedState(), targetRelease: target, now });
    expect(started.trial?.initiatingClientId).toBeUndefined();
    expect(confirmTrialBoot(started, 'client-1', target.releaseId)).toBe(started);
  });

  it('advances the Manual pin on commit and never on rollback', () => {
    const started = createTrial({
      state: preparedState('manual'),
      targetRelease: target,
      now,
      initiatingClientId: 'client-1',
    });
    const committed = confirmTrialBoot(started, 'client-1', target.releaseId);
    expect(committed.pinnedRelease).toEqual(target);
    const rolledBack = rollbackFailedTrialBoot(started);
    expect(rolledBack.pinnedRelease).toEqual(active);
  });

  it('rolls an expired trial back exactly once, marking its target failed', () => {
    const started = createTrial({
      state: preparedState(),
      targetRelease: target,
      now,
      lifetimeMs: 1_000,
    });
    const before = rollbackExpiredTrial(started, new Date(now.getTime() + 500));
    expect(before).toBe(started);
    const after = rollbackExpiredTrial(started, new Date(now.getTime() + 1_500));
    expect(after.trial).toBeUndefined();
    expect(after.activeRelease).toEqual(active);
    expect(after.failedReleaseIds).toEqual([target.releaseId]);
    expect(rollbackExpiredTrial(after, new Date(now.getTime() + 2_000))).toBe(after);
  });
});
