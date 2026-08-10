import { describe, expect, it } from 'vitest';
import type { UpdateControllerState } from './contracts';
import { buildAppUpdateSnapshot } from './snapshot';

const releaseSummaryB = {
  releaseNumber: 2,
  appVersion: '1.1.0',
  buildId: 'build-b',
  buildDate: '2026-07-24T00:00:00.000Z',
};

const state: UpdateControllerState = {
  schemaVersion: 1,
  mode: 'manual',
  activeRelease: {
    releaseNumber: 1,
    appVersion: '1.0.0',
    buildId: 'build-a',
    buildDate: '2026-07-23T00:00:00.000Z',
  },
  candidate: { phase: 'available', release: releaseSummaryB },
  lastSuccessfulCheckAt: '2026-07-24T00:00:00.000Z',
};

describe('buildAppUpdateSnapshot', () => {
  it('carries mode, activeRelease, candidate, and lastSuccessfulCheckAt through unchanged', () => {
    const snapshot = buildAppUpdateSnapshot(state);
    expect(snapshot.mode).toBe(state.mode);
    expect(snapshot.activeRelease).toEqual(state.activeRelease);
    expect(snapshot.candidate).toEqual(state.candidate);
    expect(snapshot.lastSuccessfulCheckAt).toBe(state.lastSuccessfulCheckAt);
  });

  it('omits candidate when there is none', () => {
    const { candidate: _candidate, ...withoutCandidate } = state;
    const snapshot = buildAppUpdateSnapshot(withoutCandidate);
    expect(snapshot.candidate).toBeUndefined();
  });

  it('carries a ready candidate through unchanged', () => {
    const readyState: UpdateControllerState = {
      ...state,
      candidate: { phase: 'ready', release: releaseSummaryB },
    };
    expect(buildAppUpdateSnapshot(readyState).candidate).toEqual(readyState.candidate);
  });

  it('carries an activating candidate through unchanged', () => {
    const activatingState: UpdateControllerState = {
      ...state,
      candidate: {
        phase: 'activating',
        release: releaseSummaryB,
        deadlineAt: '2026-07-24T00:00:30.000Z',
      },
    };
    expect(buildAppUpdateSnapshot(activatingState).candidate).toEqual(activatingState.candidate);
  });

  it('carries a failed candidate through unchanged', () => {
    const failedState: UpdateControllerState = {
      ...state,
      candidate: { phase: 'failed', release: releaseSummaryB },
    };
    expect(buildAppUpdateSnapshot(failedState).candidate).toEqual(failedState.candidate);
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
