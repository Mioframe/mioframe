import { describe, expect, it } from 'vitest';
import type { UpdateControllerState } from './contracts';
import { buildAppUpdateSnapshot } from './snapshot';

const state: UpdateControllerState = {
  schemaVersion: 1,
  mode: 'manual',
  activeRelease: { releaseId: 'release-a', releaseSequence: 1 },
  latestRelease: { releaseId: 'release-b', releaseSequence: 2 },
  approvedRelease: { releaseId: 'release-b', releaseSequence: 2 },
  failedReleaseIds: [],
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
});
