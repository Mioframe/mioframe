import { describe, expect, it } from 'vitest';
import {
  deriveAppUpdatesDisplayStatus,
  deriveAppUpdateTransientFeedback,
  getAppUpdatesDisplayStatusText,
  getAppUpdateTransientFeedbackText,
  type AppUpdatesDisplayStatus,
  type AppUpdateTransientFeedback,
} from './appUpdatesDisplayStatus';
import type { AppUpdateLifecycleStatus, AppUpdateTransientError } from './useAppUpdate';

const derive = (status: AppUpdateLifecycleStatus) => deriveAppUpdatesDisplayStatus({ status });

describe('deriveAppUpdatesDisplayStatus', () => {
  it('maps only stable entity lifecycle status, without action-local busy inputs or transient errors', () => {
    expect(derive('unavailable')).toBe('unavailable');
    expect(derive('not-checked')).toBe('not-checked');
    expect(derive('up-to-date')).toBe('up-to-date');
    expect(derive('update-available')).toBe('update-available');
    expect(derive('failed')).toBe('update-failed');
    expect(derive('ready')).toBe('ready');
    expect(derive('activating')).toBe('activating');
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

const deriveFeedback = (transientError: AppUpdateTransientError, isOnline = true) =>
  deriveAppUpdateTransientFeedback({ transientError, isOnline });

describe('deriveAppUpdateTransientFeedback', () => {
  it('is undefined when there is no transient error, entirely independent of lifecycle status', () => {
    expect(deriveFeedback(undefined)).toBeUndefined();
  });

  it('splits check-failed into could-not-check when online and offline when offline', () => {
    expect(deriveFeedback('check-failed', true)).toBe('could-not-check');
    expect(deriveFeedback('check-failed', false)).toBe('offline');
  });

  it('maps install-failed to could-not-prepare regardless of connectivity', () => {
    expect(deriveFeedback('install-failed', true)).toBe('could-not-prepare');
    expect(deriveFeedback('install-failed', false)).toBe('could-not-prepare');
  });
});

describe('getAppUpdateTransientFeedbackText', () => {
  const cases: Array<[AppUpdateTransientFeedback, string | undefined]> = [
    ['could-not-check', 'Could not check for updates'],
    ['offline', 'Offline'],
    ['could-not-prepare', 'Could not prepare the update'],
    [undefined, undefined],
  ];

  it.each(cases)('maps %s to %s', (feedback, text) => {
    expect(getAppUpdateTransientFeedbackText(feedback)).toBe(text);
  });
});
