import { describe, expect, it } from 'vitest';
import type { AppUpdateSnapshot, AppUpdateState } from '@shared/serviceClient/appUpdate';
import { getCompactAppUpdateStatus } from './appUpdateStatus';

const snapshotWith = (updateState: AppUpdateState): AppUpdateSnapshot => ({
  capability: 'available',
  mode: 'automatic',
  updateState,
});

describe('getCompactAppUpdateStatus', () => {
  it('reports unavailable capability regardless of update state', () => {
    expect(getCompactAppUpdateStatus(undefined)).toBe('Status unavailable');
    expect(getCompactAppUpdateStatus({ ...snapshotWith('ready'), capability: 'unavailable' })).toBe(
      'Status unavailable',
    );
  });

  it('maps each canonical update state to a compact factual label', () => {
    expect(getCompactAppUpdateStatus(snapshotWith('notChecked'))).toBe('Not checked yet');
    expect(getCompactAppUpdateStatus(snapshotWith('failed'))).toBe('Could not check for updates');
    expect(getCompactAppUpdateStatus(snapshotWith('ready'))).toBe('Update ready');
    expect(getCompactAppUpdateStatus(snapshotWith('available'))).toBe('Update available');
    expect(getCompactAppUpdateStatus(snapshotWith('preparing'))).toBe('Update available');
    expect(getCompactAppUpdateStatus(snapshotWith('trialStarting'))).toBe('Update available');
    expect(getCompactAppUpdateStatus(snapshotWith('checking'))).toBe('Up to date');
    expect(getCompactAppUpdateStatus(snapshotWith('upToDate'))).toBe('Up to date');
  });
});
