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
  it('serves the committed release with no trial and the trial target once one starts', () => {
    expect(selectServedRelease(preparedState())).toEqual(active);
    const started = createTrial({ state: preparedState(), targetRelease: target, now });
    expect(selectServedRelease(started)).toEqual(target);
  });

  it('claims an unclaimed trial for the first navigation and rolls back a repeat before confirmation', () => {
    const started = createTrial({ state: preparedState('manual'), targetRelease: target, now });
    expect(started.trial?.initiatingClientId).toBeUndefined();

    const claimed = associateTrialNavigation(started, 'client-1');
    expect(claimed.trial).toMatchObject({ initiatingClientId: 'client-1' });
    expect(claimed.activeRelease).toEqual(active);

    const retried = associateTrialNavigation(claimed, 'client-2');
    expect(retried.trial).toBeUndefined();
    expect(retried.activeRelease).toEqual(active);
    expect(retried.pinnedRelease).toEqual(active);
    expect(retried.preparation).toEqual({ status: 'failed', release: target });
    expect(retried.failedReleaseIds).toEqual([target.releaseId]);
  });

  it('does not touch state when no trial is active', () => {
    const state = preparedState();
    expect(associateTrialNavigation(state, 'client-1')).toBe(state);
    expect(confirmTrialBoot(state, target.releaseId)).toBe(state);
    expect(rollbackExpiredTrial(state, now)).toBe(state);
    expect(rollbackFailedTrialBoot(state)).toBe(state);
  });

  it('commits only when the confirming release matches the trial target', () => {
    const started = createTrial({
      state: preparedState(),
      targetRelease: target,
      now,
      initiatingClientId: 'client-1',
    });
    expect(confirmTrialBoot(started, active.releaseId)).toBe(started);
    const committed = confirmTrialBoot(started, target.releaseId);
    expect(committed.trial).toBeUndefined();
    expect(committed.activeRelease).toEqual(target);
    expect(committed.preparation).toEqual({ status: 'idle' });
    expect(committed.failedReleaseIds).toEqual([]);
  });

  it('advances the Manual pin on commit and never on rollback', () => {
    const started = createTrial({ state: preparedState('manual'), targetRelease: target, now });
    const committed = confirmTrialBoot(started, target.releaseId);
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
