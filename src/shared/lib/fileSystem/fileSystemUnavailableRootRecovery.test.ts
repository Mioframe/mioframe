import { describe, expect, it } from 'vitest';
import { parseFileSystemUnavailableRootRecovery } from './fileSystemUnavailableRootRecovery';

const createSerializedUnavailableRootError = ({
  recoveryKey = 'recovery-key',
  spaceName,
}: {
  recoveryKey?: string;
  spaceName: string;
}) =>
  Object.assign(new Error('Mioframe cannot open this remembered folder anymore.'), {
    code: 'web-file-system-unavailable-root',
    name: 'WebFileSystemUnavailableRootError',
    spaceName,
    recoveryKey,
  });

describe('fileSystemUnavailableRootRecovery', () => {
  it('accepts a valid serialized unavailable-root payload, carrying spaceName and recoveryKey only', () => {
    const payload = createSerializedUnavailableRootError({
      spaceName: 'Work',
      recoveryKey: 'key-1',
    });

    expect(parseFileSystemUnavailableRootRecovery(payload)).toEqual({
      spaceName: 'Work',
      recoveryKey: 'key-1',
    });
    expect(payload).not.toHaveProperty('handle');
    expect(payload).not.toHaveProperty('path');
  });

  it('rejects a mismatched code', () => {
    expect(
      parseFileSystemUnavailableRootRecovery(
        Object.assign(new Error('Permission required'), {
          code: 'web-file-system-access-required',
          spaceName: 'Work',
          recoveryKey: 'key-1',
        }),
      ),
    ).toBeUndefined();
  });

  it('rejects a non-string space name', () => {
    expect(
      parseFileSystemUnavailableRootRecovery(
        Object.assign(new Error('Unavailable'), {
          code: 'web-file-system-unavailable-root',
          spaceName: 42,
          recoveryKey: 'key-1',
        }),
      ),
    ).toBeUndefined();
  });

  it('rejects a missing recoveryKey', () => {
    expect(
      parseFileSystemUnavailableRootRecovery(
        Object.assign(new Error('Unavailable'), {
          code: 'web-file-system-unavailable-root',
          spaceName: 'Work',
        }),
      ),
    ).toBeUndefined();
  });

  it('rejects a non-string recoveryKey', () => {
    expect(
      parseFileSystemUnavailableRootRecovery(
        Object.assign(new Error('Unavailable'), {
          code: 'web-file-system-unavailable-root',
          spaceName: 'Work',
          recoveryKey: 42,
        }),
      ),
    ).toBeUndefined();
  });

  it('rejects unrelated values', () => {
    expect(parseFileSystemUnavailableRootRecovery(new Error('Something else'))).toBeUndefined();
    expect(parseFileSystemUnavailableRootRecovery(undefined)).toBeUndefined();
  });
});
