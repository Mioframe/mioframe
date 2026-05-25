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
        'Operation: writeFile',
        'Path: /old.md',
        'New path: /new.md',
        'Time: formatted time',
        'Message: disk full',
      ].join('\n'),
    );
  });

  it('omits the new path line when the error does not contain one', () => {
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
        'Operation: delete',
        'Path: /old.md',
        'Time: formatted time',
        'Message: missing file',
      ].join('\n'),
    );
  });
});
