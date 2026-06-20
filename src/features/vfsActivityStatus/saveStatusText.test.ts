import { DomainError } from '@shared/lib/error';
import { describe, expect, it, vi } from 'vitest';
import { CHIP_STATUS_LABELS, formatSaveStatusErrorDetails } from './saveStatusText';

vi.mock('@shared/lib/dayjs', () => ({
  dayjs: () => ({
    format: () => 'formatted time',
  }),
}));

describe('saveStatusText', () => {
  it('defines compact english labels for visible save chip states', () => {
    expect(CHIP_STATUS_LABELS).toEqual({
      active: 'Saving…',
      error: 'Save failed',
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
    ).toBe(['Could not save changes', 'Operation: write file', 'Time: formatted time'].join('\n'));
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
      ['Could not save changes', 'Operation: delete entry', 'Time: formatted time'].join('\n'),
    );
  });

  it('never copies raw cause details from replay failures', () => {
    const copied = formatSaveStatusErrorDetails({
      operationType: 'writeFile',
      path: '/private/project/secret.txt',
      message: 'safe message only',
      cause: new Error(
        'raw stale replay failed for /private/project/secret.txt document Alpha id doc-123',
      ),
      occurredAt: 1_700_000_000_002,
      acknowledged: false,
    });

    expect(copied).toContain('Could not save changes');
    expect(copied).toContain('Operation: write file');
    expect(copied).not.toContain('/private/project/secret.txt');
    expect(copied).not.toContain('document Alpha');
    expect(copied).not.toContain('doc-123');
    expect(copied).not.toContain('raw stale replay failed');
  });

  it('formats a generic DomainError chain with DOMException details when present', () => {
    const domException = new DOMException('The handle became invalid', 'InvalidStateError');
    Object.defineProperty(domException, 'code', {
      configurable: true,
      value: 11,
    });
    const copied = formatSaveStatusErrorDetails({
      operationType: 'writeFile',
      path: '/private/project/secret.txt',
      message: 'safe message only',
      cause: new DomainError('Could not start writing to this storage location.', {
        code: 'web-file-system-write-start-failed',
        cause: domException,
      }),
      occurredAt: 1_700_000_000_003,
      acknowledged: false,
    });

    expect(copied).toContain('Top-level error: DomainError');
    expect(copied).toContain('Stable code: web-file-system-write-start-failed');
    expect(copied).toContain('Safe message: Could not start writing to this storage location.');
    expect(copied).toContain('Cause class: DOMException');
    expect(copied).toContain('Browser error name: InvalidStateError');
    expect(copied).toContain('Browser error message: The handle became invalid');
    expect(copied).not.toContain('Browser error code:');
    expect(copied).not.toContain('/private/project/secret.txt');
  });

  it('formats a generic Error cause with generic labels instead of browser labels', () => {
    const copied = formatSaveStatusErrorDetails({
      operationType: 'writeFile',
      path: '/private/project/secret.txt',
      message: 'safe message only',
      cause: new DomainError('Could not start writing to this storage location.', {
        code: 'web-file-system-write-start-failed',
        cause: new Error('The handle became invalid'),
      }),
      occurredAt: 1_700_000_000_004,
      acknowledged: false,
    });

    expect(copied).toContain('Top-level error: DomainError');
    expect(copied).toContain('Stable code: web-file-system-write-start-failed');
    expect(copied).toContain('Safe message: Could not start writing to this storage location.');
    expect(copied).toContain('Cause class: Error');
    expect(copied).toContain('Cause name: Error');
    expect(copied).toContain('Cause message: The handle became invalid');
    expect(copied).not.toContain('Browser error name:');
    expect(copied).not.toContain('Browser error code:');
    expect(copied).not.toContain('Browser error message:');
    expect(copied).not.toContain('/private/project/secret.txt');
  });
});
