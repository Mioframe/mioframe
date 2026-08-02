import { describe, expect, it } from 'vitest';
import {
  deriveAppUpdatesDisplayStatus,
  getAppUpdatesDisplayStatusText,
  type AppUpdatesDisplayStatus,
} from './appUpdatesDisplayStatus';
import type { AppUpdateStatus } from './useAppUpdate';

const derive = (status: AppUpdateStatus, isOnline = true) =>
  deriveAppUpdatesDisplayStatus({ status, isOnline });

describe('deriveAppUpdatesDisplayStatus', () => {
  it('maps only stable entity status, without action-local busy inputs', () => {
    expect(derive('unavailable')).toBe('unavailable');
    expect(derive('not-checked')).toBe('not-checked');
    expect(derive('up-to-date')).toBe('up-to-date');
    expect(derive('update-available')).toBe('update-available');
    expect(derive('failed')).toBe('update-failed');
    expect(derive('ready')).toBe('ready');
    expect(derive('activating')).toBe('activating');
  });

  it('maps install-failed to retryable update-available', () => {
    expect(derive('install-failed')).toBe('update-available');
  });

  it('splits check-failed into could-not-check when online and offline when offline', () => {
    expect(derive('check-failed', true)).toBe('could-not-check');
    expect(derive('check-failed', false)).toBe('offline');
  });
});

describe('getAppUpdatesDisplayStatusText', () => {
  const cases: Array<[AppUpdatesDisplayStatus, string]> = [
    ['unavailable', 'Updates unavailable'],
    ['not-checked', 'Not checked yet'],
    ['up-to-date', 'Up to date'],
    ['update-available', 'Update available'],
    ['ready', 'Update ready'],
    ['activating', 'Activating update…'],
    ['update-failed', 'Update failed'],
    ['could-not-check', 'Could not check for updates'],
    ['offline', 'Offline'],
  ];

  it.each(cases)('maps %s to %s', (status, text) => {
    expect(getAppUpdatesDisplayStatusText(status)).toBe(text);
  });

  it('does not define feature-local checking or preparing presentation states', () => {
    expect(cases.map(([status]) => status)).not.toContain('checking');
    expect(cases.map(([status]) => status)).not.toContain('preparing');
  });

  it('never mentions internal worker or release terminology', () => {
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
