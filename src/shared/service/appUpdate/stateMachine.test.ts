import { describe, expect, it } from 'vitest';
import type { ReleaseIdentity } from './contracts';
import {
  beginBootAttempt,
  confirmBoot,
  createInitialReleaseControllerState,
  markCandidateReady,
  rollbackUnconfirmedBoot,
  setAutomaticMode,
} from './stateMachine';

const release = (releaseId: string, appVersion = '1.0.0'): ReleaseIdentity => ({
  releaseId: releaseId.repeat(40),
  appVersion,
  buildId: releaseId.repeat(7),
  buildDate: '2026-07-23T00:00:00.000Z',
});

describe('release controller state machine', () => {
  it('treats equal SemVer releases with different commit SHAs as distinct', () => {
    const active = release('a');
    const candidate = release('b');
    expect(
      markCandidateReady(createInitialReleaseControllerState(active), candidate).candidateRelease,
    ).toEqual(candidate);
  });

  it('pins the factually running release and cancels a candidate when Manual is selected', () => {
    const active = release('a');
    const running = release('b');
    const state = markCandidateReady(createInitialReleaseControllerState(active), release('c'));
    expect(setAutomaticMode(state, false, running)).toMatchObject({
      mode: 'manual',
      activeRelease: running,
      pinnedRelease: running,
      candidateRelease: undefined,
    });
  });

  it('allows preparation again after Manual changes to Automatic', () => {
    const active = release('a');
    const manual = setAutomaticMode(createInitialReleaseControllerState(active), false, active);
    const automatic = setAutomaticMode(manual, true, active);
    expect(markCandidateReady(automatic, release('b')).candidateRelease?.releaseId).toBe(
      release('b').releaseId,
    );
  });

  it('rolls an unconfirmed boot back once and will not prepare the failed release again', () => {
    const active = release('a');
    const failed = release('b');
    const rolledBack = rollbackUnconfirmedBoot(
      beginBootAttempt(createInitialReleaseControllerState(active), failed),
    );
    expect(rolledBack.activeRelease).toEqual(active);
    expect(rolledBack.failedReleaseId).toBe(failed.releaseId);
    expect(markCandidateReady(rolledBack, failed).candidateRelease).toBeUndefined();
  });

  it('commits a confirmed trial and advances the Manual pin', () => {
    const active = release('a');
    const next = release('b');
    const manual = setAutomaticMode(createInitialReleaseControllerState(active), false, active);
    expect(confirmBoot(beginBootAttempt(manual, next), next.releaseId)).toMatchObject({
      activeRelease: next,
      pinnedRelease: next,
      bootAttempt: undefined,
    });
  });
});
