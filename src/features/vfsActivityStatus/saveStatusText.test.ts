import { describe, expect, it, vi } from 'vitest';
import { formatSaveStatusErrorDetails, STATUS_LABELS } from './saveStatusText';

vi.mock('@shared/lib/dayjs', () => ({
  dayjs: () => ({
    format: () => 'formatted time',
  }),
}));

describe('saveStatusText', () => {
  it('defines english labels for each save status', () => {
    expect(STATUS_LABELS).toEqual({
      idle: 'All changes saved',
      active: 'Saving…',
      error: 'Could not save changes',
    });
  });

  it('returns undefined when there is no error', () => {
    expect(formatSaveStatusErrorDetails(undefined)).toBeUndefined();
  });

  it('builds english error details with the optional new path', () => {
    expect(
      formatSaveStatusErrorDetails({
        operationType: 'writeFile',
        path: '/old.md',
        newPath: '/new.md',
        message: 'disk full',
        occurredAt: 1_700_000_000_000,
        acknowledged: false,
      }),
    ).toBe(
      [
        'Could not save changes',
        'Operation: write file',
        'Time: formatted time',
        'Details are hidden to protect private repository data.',
      ].join('\n'),
    );
  });

  it('omits private path and message details when the error does not contain one', () => {
    expect(
      formatSaveStatusErrorDetails({
        operationType: 'delete',
        path: '/old.md',
        message: 'missing file',
        occurredAt: 1_700_000_000_001,
        acknowledged: false,
      }),
    ).toBe(
      [
        'Could not save changes',
        'Operation: delete entry',
        'Time: formatted time',
        'Details are hidden to protect private repository data.',
      ].join('\n'),
    );
  });
});
