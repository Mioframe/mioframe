import { FileSystemError, VfsError } from '@shared/lib/virtualFileSystem';
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

  it('adds controlled write-start failure details for write stream open failures', () => {
    const copied = formatSaveStatusErrorDetails({
      operationType: 'writeFile',
      path: '/private/project/secret.txt',
      message: 'safe message only',
      cause: new VfsError(
        FileSystemError.WriteStreamOpenFailed,
        'Could not start writing to the selected storage location.',
        new DOMException('The handle became invalid', 'InvalidStateError'),
      ),
      occurredAt: 1_700_000_000_003,
      acknowledged: false,
    });

    expect(copied).toContain('Failure: write stream open failed');
    expect(copied).toContain('Phase: writableOpen');
    expect(copied).toContain('Recommendation: choose another storage location');
    expect(copied).toContain('Browser error: InvalidStateError');
    expect(copied).toContain('Browser detail: The handle became invalid');
    expect(copied).not.toContain('/private/project/secret.txt');
  });
});
