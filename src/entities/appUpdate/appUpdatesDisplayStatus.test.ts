import { describe, expect, it } from 'vitest';
import {
  deriveAppUpdatesDisplayStatus,
  getAppUpdatesDisplayStatusText,
  type AppUpdatesDisplayStatus,
} from './appUpdatesDisplayStatus';
import type { AppUpdateStatus } from './useAppUpdate';

const derive = (status: AppUpdateStatus, overrides: Partial<Record<string, boolean>> = {}) =>
  deriveAppUpdatesDisplayStatus({
    status,
    isChecking: overrides.isChecking ?? false,
    isPreparing: overrides.isPreparing ?? false,
    isOnline: overrides.isOnline ?? true,
  });

describe('deriveAppUpdatesDisplayStatus', () => {
  it('reports unavailable regardless of local action flags', () => {
    expect(derive('unavailable', { isChecking: true, isPreparing: true })).toBe('unavailable');
  });

  it('reports checking while an explicit check is in flight, before consulting entity status', () => {
    expect(derive('not-checked', { isChecking: true })).toBe('checking');
    expect(derive('up-to-date', { isChecking: true })).toBe('checking');
  });

  it('reports preparing while an explicit prepare/install is in flight', () => {
    expect(derive('update-available', { isPreparing: true })).toBe('preparing');
  });

  it('maps not-checked, up-to-date, ready, and activating through unchanged', () => {
    expect(derive('not-checked')).toBe('not-checked');
    expect(derive('up-to-date')).toBe('up-to-date');
    expect(derive('ready')).toBe('ready');
    expect(derive('activating')).toBe('activating');
  });

  it('maps both update-available and install-failed to update-available: the release remains available to retry', () => {
    expect(derive('update-available')).toBe('update-available');
    expect(derive('install-failed')).toBe('update-available');
  });

  it('maps failed to update-failed', () => {
    expect(derive('failed')).toBe('update-failed');
  });

  it('splits check-failed into could-not-check when online', () => {
    expect(derive('check-failed', { isOnline: true })).toBe('could-not-check');
  });

  it('splits check-failed into offline when the browser reports itself offline', () => {
    expect(derive('check-failed', { isOnline: false })).toBe('offline');
  });

  it('never reports up-to-date without a prior successful check (entity already guarantees this, still not shadowed here)', () => {
    expect(derive('not-checked')).not.toBe('up-to-date');
  });
});

describe('getAppUpdatesDisplayStatusText', () => {
  const cases: Array<[AppUpdatesDisplayStatus, string]> = [
    ['unavailable', 'Updates unavailable'],
    ['not-checked', 'Not checked yet'],
    ['checking', 'Checking for updates…'],
    ['up-to-date', 'Up to date'],
    ['update-available', 'Update available'],
    ['preparing', 'Preparing update…'],
    ['ready', 'Update ready'],
    ['activating', 'Activating update…'],
    ['update-failed', 'Update failed'],
    ['could-not-check', 'Could not check for updates'],
    ['offline', 'Offline'],
  ];

  it.each(cases)('maps %s to %s', (status, text) => {
    expect(getAppUpdatesDisplayStatusText(status)).toBe(text);
  });

  it('never mentions internal worker/release terminology', () => {
    const forbidden = [
      'channel',
      'branch',
      'scope',
      'pinned',
      'service worker',
      'release id',
      'url',
    ];
    for (const [status] of cases) {
      const text = getAppUpdatesDisplayStatusText(status).toLowerCase();
      for (const term of forbidden) {
        expect(text).not.toContain(term);
      }
    }
  });
});
