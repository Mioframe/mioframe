import { describe, expect, it } from 'vitest';
import { DomainError, resolveSafeErrorMessage } from '@shared/lib/error';

describe('resolveSafeErrorMessage', () => {
  it('returns the DomainError message unchanged', () => {
    const error = new DomainError('Folder is locked', { code: 'folderLocked' });

    expect(resolveSafeErrorMessage(error)).toBe('Folder is locked');
  });

  it('uses a safe fallback for plain Error instances', () => {
    const error = new Error('/mnt/user/secrets/config.json not found');

    expect(resolveSafeErrorMessage(error)).toBe('Error reading directory');
  });

  it('uses a custom fallback message when provided', () => {
    const error = new Error('something broke');

    expect(resolveSafeErrorMessage(error, 'Error reading repository')).toBe(
      'Error reading repository',
    );
  });

  it('returns the safe fallback for non-Error values', () => {
    // RxJS can emit plain objects as errors
    const error = { message: 'raw network failure' };

    expect(resolveSafeErrorMessage(error)).toBe('Error reading directory');
  });

  it('does not leak arbitrary Error.message in the user-facing string', () => {
    const pathLeakingError = new Error(
      'ENOENT: no such file or directory, open /home/user/.local/share/mioframe/repo/abc123/data.ams',
    );

    const message = resolveSafeErrorMessage(pathLeakingError);

    expect(message).toBe('Error reading directory');
    expect(message).not.toContain('/home');
    expect(message).not.toContain('.local');
    expect(message).not.toContain('mioframe');
  });
});
