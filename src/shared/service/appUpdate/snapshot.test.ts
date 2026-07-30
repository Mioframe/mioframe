import { describe, expect, it } from 'vitest';
import type { UpdateControllerState } from './contracts';
import { buildAppUpdateSnapshot } from './snapshot';

const releaseSummaryB = {
  releaseId: 'release-b',
  releaseSequence: 2,
  appVersion: '1.1.0',
  buildId: 'build-b',
  buildDate: '2026-07-24T00:00:00.000Z',
};

const state: UpdateControllerState = {
  schemaVersion: 1,
  mode: 'manual',
  activeRelease: { releaseId: 'release-a', releaseSequence: 1 },
  latestRelease: releaseSummaryB,
  approvedRelease: releaseSummaryB,
  failedActivationRelease: {
    releaseId: 'release-c',
    releaseSequence: 1,
    appVersion: '0.9.0',
    buildId: 'build-c',
    buildDate: '2026-07-23T00:00:00.000Z',
  },
  lastSuccessfulCheckAt: '2026-07-24T00:00:00.000Z',
};

describe('buildAppUpdateSnapshot', () => {
  it('maps approvedRelease to scheduledRelease', () => {
    const snapshot = buildAppUpdateSnapshot(state);
    expect(snapshot.scheduledRelease).toEqual(state.approvedRelease);
  });

  it('carries mode, activeRelease, latestRelease, and lastSuccessfulCheckAt through unchanged', () => {
    const snapshot = buildAppUpdateSnapshot(state);
    expect(snapshot.mode).toBe(state.mode);
    expect(snapshot.activeRelease).toEqual(state.activeRelease);
    expect(snapshot.latestRelease).toEqual(state.latestRelease);
    expect(snapshot.lastSuccessfulCheckAt).toBe(state.lastSuccessfulCheckAt);
  });

  it('maps failedActivationRelease to failedRelease', () => {
    const snapshot = buildAppUpdateSnapshot(state);
    expect(snapshot.failedRelease).toEqual(state.failedActivationRelease);
  });

  it('omits scheduledRelease when nothing is approved', () => {
    const { approvedRelease: _approvedRelease, ...withoutApproval } = state;
    const snapshot = buildAppUpdateSnapshot(withoutApproval);
    expect(snapshot.scheduledRelease).toBeUndefined();
  });

  it('attaches the given error code', () => {
    const snapshot = buildAppUpdateSnapshot(state, 'check-failed');
    expect(snapshot.error).toBe('check-failed');
  });

  it('omits error when none is given', () => {
    const snapshot = buildAppUpdateSnapshot(state);
    expect(snapshot.error).toBeUndefined();
  });

  it('maps activation.targetRelease to activatingRelease', () => {
    const { approvedRelease: _approvedRelease, ...withoutApproval } = state;
    const activatingState: UpdateControllerState = {
      ...withoutApproval,
      activation: { targetRelease: releaseSummaryB, deadlineAt: '2026-07-24T00:00:30.000Z' },
    };
    const snapshot = buildAppUpdateSnapshot(activatingState);
    expect(snapshot.activatingRelease).toEqual(releaseSummaryB);
  });

  it('omits activatingRelease when there is no activation', () => {
    const snapshot = buildAppUpdateSnapshot(state);
    expect(snapshot.activatingRelease).toBeUndefined();
  });
});
